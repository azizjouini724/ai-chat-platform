import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendVerificationEmail(to: string, token: string) {
    const link = `http://localhost:5173/verify-email?token=${token}`;
    await this.transporter.sendMail({
      from: `"AI Chat Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Vérifiez votre adresse email',
      html: `
        <p>Bienvenue sur AI Chat Platform !</p>
        <p>Cliquez sur ce lien pour vérifier votre email :</p>
        <a href="${link}">${link}</a>
        <p>Ce lien expire dans 24 heures.</p>
      `,
    });
  }

  async sendResetPasswordEmail(to: string, token: string) {
    const link = `http://localhost:5173/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: `"AI Chat Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
        <p>Cliquez sur ce lien pour en choisir un nouveau :</p>
        <a href="${link}">${link}</a>
        <p>Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      `,
    });
  }
}