import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendee } from '../../attendees/entities/attendee.entity';
import { TicketService } from '../../ticket/ticket.service';
import { EmailService } from '../../email/email.service';

@Processor('email-queue', {
  concurrency: 5, // Process 5 jobs concurrently
  limiter: {
    max: 5, // process maximum 5 jobs per duration
    duration: 1000, // sends 5 email per second
  }
})
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    @InjectRepository(Attendee)
    private attendeesRepo: Repository<Attendee>,
    private ticketService: TicketService,
    private emailService: EmailService,
  ) {
    super();
  }

  async process(job: Job<{ attendeeId: number }, any, string>): Promise<any> {
    const { attendeeId } = job.data;

    this.logger.log(`Processing ticket email for attendee ${attendeeId} (Job ${job.id})`);

    try {
      // Fetch attendee from database
      const attendee = await this.attendeesRepo.findOneBy({ id: attendeeId });

      if (!attendee) {
        this.logger.error(`❌ Attendee ${attendeeId} not found`);
        throw new Error(`Attendee ${attendeeId} not found`);
      }

      // Generate QR code
      this.logger.debug(`Generating QR code for attendee ${attendeeId}`);
      const qrBuffer = await this.ticketService.generateTickerQR(attendee);

      // Send email using existing email service
      this.logger.debug(`Sending email to ${attendee.email}`);
      const result = await this.emailService.sendTicketMail(attendee, qrBuffer);

      this.logger.log(`Successfully sent ticket to ${attendee.email}`);

      return {
        success: true,
        attendeeId,
        email: attendee.email,
        sentTo: result.accepted,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process ticket for attendee ${attendeeId}: ${error.message}`,
        error.stack,
      );

      // Re-throw error so BullMQ knows the job failed and will retry
      throw error;
    }
  }
}
