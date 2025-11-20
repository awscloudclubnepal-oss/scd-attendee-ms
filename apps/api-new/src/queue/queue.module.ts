import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './processors/email.processor';
import { TicketModule } from '../ticket/ticket.module';
import { EmailModule } from '../email/email.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendee } from '../attendees/entities/attendee.entity';

@Module({
  imports: [
    // BullMQ connection configuration
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    
    // Register the email queue with rate limiting
    BullModule.registerQueue({
      name: 'email-queue',
      defaultJobOptions: {
        attempts: 3, // Retry failed jobs 3 times
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 second delay
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
      },
    }),
    
    // Import modules needed by processor
    TypeOrmModule.forFeature([Attendee]),
    TicketModule,
    EmailModule,
  ],
  providers: [EmailProcessor],
  exports: [BullModule], // Export so other modules can use the queue
})
export class QueueModule {}
