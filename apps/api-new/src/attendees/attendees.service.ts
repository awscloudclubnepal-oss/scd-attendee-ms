import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAttendeeDto } from './dto/create-attendee.dto';
import { SessionCheckInDto, UpdateAttendeeDto, UpdateLunchDto } from './dto/update-attendee.dto';
import { PaginationDto, PaginatedResponseDto } from './dto/pagination.dto';
import { BulkDeleteDto } from './dto/bulk-delete.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendee } from './entities/attendee.entity';
import { ILike, In, Repository } from 'typeorm';
import Papa from "papaparse"
import { TicketService } from 'src/ticket/ticket.service';
import { EmailService } from 'src/email/email.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AttendeesService {
  constructor(
    @InjectRepository(Attendee) 
    private attendeeRepository: Repository<Attendee>, 
    private ticketService: TicketService, 
    private emailService: EmailService,
    @InjectQueue('email-queue')
    private emailQueue: Queue,
  ) { }

  async create(createAttendeeDto: CreateAttendeeDto) {
    const attendee = this.attendeeRepository.create(createAttendeeDto)
    const createdAttendee = await this.attendeeRepository.save(attendee)

    // Add job to queue instead of sending email directly
    // await this.emailQueue.add('send-ticket', {
    //   attendeeId: createdAttendee.id,
    // }, {
    //   attempts: 3,
    //   backoff: {
    //     type: 'exponential',
    //     delay: 5000,
    //   },
    // });

    return createdAttendee
  }

  async generateAndEmailTicket(id: number) {
    const attendee = await this.findOne(id)
    const ticketQr = await this.ticketService.generateTickerQR(attendee)

    // TODO: Implement SQS and SES here
    const ticketInfo = await this.emailService.sendTicketMail(attendee, ticketQr)
    return {
      sentTo: ticketInfo.accepted
    }
  }

  async findAll() {
    return this.attendeeRepository.find()
  }

  async findAllPaginated(paginationDto: PaginationDto): Promise<PaginatedResponseDto<Attendee>> {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    const whereConditions = search
      ? [
          { full_name: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
          { phone: ILike(`%${search}%`) },
        ]
      : undefined;

    const [data, total] = await this.attendeeRepository.findAndCount({
      where: whereConditions,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: number) {

    const attendee = await this.attendeeRepository.findOneById(id)
    if (!attendee) {
      throw new NotFoundException(`User with id: ${id} not found`)
    }
    return attendee
  }

  async update(id: number, updateAttendeeDto: UpdateAttendeeDto) {
    const attendee = await this.findOne(id)

    Object.assign(attendee, updateAttendeeDto)
    return this.attendeeRepository.save(attendee)

  }

  async remove(id: number) {
    const attendee = await this.findOne(id)

    return this.attendeeRepository.remove(attendee)
  }

  async bulkRemove(bulkDeleteDto: BulkDeleteDto) {
    const { ids } = bulkDeleteDto;
    
    if (!ids || ids.length === 0) {
      return {
        success: false,
        message: 'No attendee IDs provided',
        deleted: 0,
      };
    }

    const attendees = await this.attendeeRepository.find({
      where: { id: In(ids) },
    });

    if (attendees.length === 0) {
      return {
        success: false,
        message: 'No attendees found with the provided IDs',
        deleted: 0,
      };
    }

    await this.attendeeRepository.remove(attendees);

    return {
      success: true,
      message: `Successfully deleted ${attendees.length} attendee(s)`,
      deleted: attendees.length,
    };
  }

  async checkIn(id: number) {
    const attendee = await this.findOne(id)
    if (attendee.checked_in == true) {
      return {
        success: false,
        message: `Attendee with email ${attendee.email} already checked.`
      }
    }

    attendee.checked_in = true;
    attendee.check_in_time = new Date()
    await this.attendeeRepository.save(attendee)
    return {
      success: true,
      message: `Attendee ${attendee.full_name} checked in.`
    }
  }

  async sessionCheckIn(sessionChekInDto: SessionCheckInDto) {
    const { userId, session } = sessionChekInDto;
    const attendee = await this.findOne(userId)

    if (attendee.session_choice.includes(session)) {
      return {
        success: false,
        message: `Attendee with email ${attendee.email} already checked in to session: ${session}.`
      }
    }

    attendee.session_choice.push(session)
    await this.attendeeRepository.save(attendee)
    return {
      success: true,
      message: `Attendee ${attendee.full_name} checked in.`
    }
  }

  async isCheckedIn(id: number) {
    const attendee = await this.findOne(id)
    return {
      checkedIn: attendee.checked_in,
      checkedInTime: attendee.check_in_time
    }
  }

  async updateLunch(updateLunchDto: UpdateLunchDto) {
    const { userId, lunchId, value } = updateLunchDto;
    const validLunchIds = [1, 2]
    const attendee = await this.findOne(userId)
    if (!validLunchIds.includes(lunchId)) {
      throw new NotFoundException(`Lunch: ${lunchId} not found`)
    }

    if (lunchId == 1) {
      attendee.lunch = value
    } else {
      attendee.lunch2 = value
    }
    await this.attendeeRepository.save(attendee)
    return {
      success: true,
      message: `Lunch ${lunchId} set to ${value}`
    }
  }


  async importFromCsv(fileBuffer: Buffer) {

    const parsedData = await this.parseCsv(fileBuffer)

    if (!parsedData || parsedData.length === 0) {
      return {
        success: false,
        message: "No data found in CSV file",
        inserted: 0,
      };
    }
    const { validRecords, errors } = await this.filterValidEntry(parsedData)

    let insertedCount = 0;

    for (const createAttendeeDto of validRecords) {
      try {
        await this.create(createAttendeeDto)
        insertedCount++
      } catch (insertError) {
        errors.push(insertError.detail)
        continue;
      }
    }
    return {
      success: true,
      inserted: insertedCount,
      errors: errors,
    }
  }

  private async filterValidEntry(parsedData: any[]) {
    const validRecords: CreateAttendeeDto[] = []
    const errors: any[] = [];

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      try {
        // Parse session choices - handle the breakout session column
        // The column name is: "Select 4 (1 from each row)  Breakout Session that you would like to attend:"
        const sessionChoiceKey = Object.keys(row).find(key => 
          key.toLowerCase().includes('breakout session') || 
          key.toLowerCase().includes('session')
        );
        let sessionChoices: string[] = [];
        if (sessionChoiceKey && row[sessionChoiceKey]) {
          // Split by comma and trim each session
          sessionChoices = String(row[sessionChoiceKey])
            .split(',')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
        }

        // Map CSV columns to database schema with flexible header matching
        const record: CreateAttendeeDto = {
          full_name: row['Full Name'] || row.full_name || row.Full_Name || row['full name'] || '',
          email: row['Email Address'] || row.email || row.Email || row['email address'] || '',
          phone: String(row['Contact Number'] || row.phone || row.Phone || row['contact number'] || row['Phone Number'] || ''),
          food_preference: row.food_preference || row['Food Preference'] || "",
          session_choice: sessionChoices.length > 0 ? sessionChoices : (row.session_choice || []),
          checked_in: row.checked_in || false,
          check_in_time: row.check_in_time || null,
          lunch: row.lunch || false,
          lunch2: row.lunch2 || false,
        };

        // Basic validation
        if (!record.full_name || !record.phone || !record.email) {
          errors.push({
            row: i + 1,
            data: row,
            error: "Missing required fields: full_name, phone, or email",
          });
          continue;
        }

        validRecords.push(record);
      } catch (error) {
        errors.push({
          row: i + 1,
          data: row,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
    return {
      validRecords,
      errors
    }
  }

  private async parseCsv(fileBuffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(fileBuffer.toString("utf-8"), {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => resolve(results.data),
        error: (err: any) => reject(err),
      })
    })
  }

}
