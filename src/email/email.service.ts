import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { envs } from '../config/envs';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: envs.mailerEmail,
        pass: envs.mailerSecretKey,
      },
    });
  }

  async sendEmail(to: string, subject: string, template: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"AguaFix API" <${envs.mailerEmail}>`,
        to: to,
        subject: subject,
        html: template, 
      });
      console.log('Correo enviado con éxito: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('Error al enviar el correo:', error);
      throw error;
    }
  }
}