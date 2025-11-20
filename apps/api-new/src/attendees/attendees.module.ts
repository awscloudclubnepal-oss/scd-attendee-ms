import { Module } from '@nestjs/common';
import { AttendeesService } from './attendees.service';
import { AttendeesController } from './attendees.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendee } from './entities/attendee.entity';
import { TicketModule } from 'src/ticket/ticket.module';
import { EmailModule } from 'src/email/email.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendee]),
    TicketModule,
    EmailModule,
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  controllers: [AttendeesController],
  providers: [AttendeesService],
})
export class AttendeesModule {}
