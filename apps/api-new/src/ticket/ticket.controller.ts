import { Controller, Get, Query, Res, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { TicketService } from './ticket.service';
import { Public } from 'src/auth/decorators/public-auth.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendee } from 'src/attendees/entities/attendee.entity';
import { Repository } from 'typeorm';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('tickets')
@Controller('tickets')
export class TicketController {
  constructor(
    private readonly ticketService: TicketService,
    @InjectRepository(Attendee)
    private readonly attendeeRepository: Repository<Attendee>,
  ) {}

  @Public()
  @Get('by-email')
  @ApiOperation({ summary: 'Get ticket QR code image by email address' })
  @ApiQuery({ name: 'email', required: true, description: 'Email address of the attendee' })
  @ApiResponse({ status: 200, description: 'Returns the ticket QR code as a PNG image' })
  @ApiResponse({ status: 400, description: 'Email is required' })
  @ApiResponse({ status: 404, description: 'Attendee not found' })
  async getTicketByEmail(
    @Query('email') email: string,
    @Res() res: Response,
  ) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const attendee = await this.attendeeRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!attendee) {
      throw new NotFoundException(`Attendee with email ${email} not found`);
    }

    const ticketBuffer = await this.ticketService.generateTickerQR(attendee);

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="ticket-${attendee.id}.png"`,
      'Cache-Control': 'no-cache',
    });

    res.send(ticketBuffer);
  }

  @Public()
  @Get('download')
  @ApiOperation({ summary: 'Download ticket QR code image by email address' })
  @ApiQuery({ name: 'email', required: true, description: 'Email address of the attendee' })
  @ApiResponse({ status: 200, description: 'Downloads the ticket QR code as a PNG image' })
  @ApiResponse({ status: 400, description: 'Email is required' })
  @ApiResponse({ status: 404, description: 'Attendee not found' })
  async downloadTicketByEmail(
    @Query('email') email: string,
    @Res() res: Response,
  ) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const attendee = await this.attendeeRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!attendee) {
      throw new NotFoundException(`Attendee with email ${email} not found`);
    }

    const ticketBuffer = await this.ticketService.generateTickerQR(attendee);

    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="ticket-${attendee.full_name.replace(/\s+/g, '_')}.png"`,
      'Cache-Control': 'no-cache',
    });

    res.send(ticketBuffer);
  }
}
