import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from "nodemailer"
import { Attendee } from 'src/attendees/entities/attendee.entity';
import { generateTicketEmailHtml } from './email.template';
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"
import SESTransport from 'nodemailer/lib/ses-transport';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Try Gmail first, fall back to SES
    const gmailPassword = this.configService.get<string>('GOOGLE_APP_PASSWORD');
    const gmailUser = this.configService.get<string>('GMAIL_USER');

    if (gmailPassword && gmailUser) {
      this.transporter = this.createGmailTransport(gmailUser, gmailPassword);
    } else {
      throw new Error("Could not get email configuration. Set GMAIL_USER and GOOGLE_APP_PASSWORD.");

    }
  }

  async sendTicketMail(attendee: Attendee, ticketQrBuffer: Buffer) {
    const cid = 'ticket_qr_' + Math.random().toString(36).substring(7);

    const htmlContent = generateTicketEmailHtml(attendee, cid);

    return this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_FROM') || this.configService.get<string>('GMAIL_USER') || 'noreply@awscloudclubnepal.com',
      to: attendee.email,
      subject: 'Ticket for AWS SCD Nepal 2025',
      html: htmlContent,
      attachments: [
        {
          filename: 'ticket-qr.png',
          content: ticketQrBuffer,
          contentType: 'image/png',
          cid: cid, // Referenced in the HTML as 'cid:cid'
        },
      ],

    });
  }

  private createGmailTransport(user: string, appPassword: string): nodemailer.Transporter {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: appPassword,
      },
    });
  }

  private getSESConfig(): SESTransport.Options | null {
    const region = this.configService.get<string>("AWS_REGION", "ap-south-1")
    const accessKeyId = this.configService.get<string>("AWS_ACCESS_KEY_ID")
    const secretAccessKey = this.configService.get<string>("AWS_SECRET_ACCESS_KEY")
    const config = {
      region: region
    }
    if (accessKeyId && secretAccessKey) {
      config["credentials"] = {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
      }
    }

    const sesClient = new SESv2Client(config);

    return {
      SES: { sesClient, SendEmailCommand }
    }
  }

}
