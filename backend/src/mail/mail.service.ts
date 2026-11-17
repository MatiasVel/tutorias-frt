import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    this.frontendUrl = (config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173').split(',')[0];
    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port: Number(config.get('SMTP_PORT') ?? 587),
          secure: Number(config.get('SMTP_PORT')) === 465,
          auth: { user: config.get('SMTP_USER'), pass: config.get('SMTP_PASS') },
        })
      : null;
  }

  private async send(to: string, subject: string, html: string, devLink: string) {
    if (!this.transporter) {
      // Modo desarrollo: sin SMTP configurado se muestra el enlace en consola
      this.logger.warn(`[DEV] Correo a ${to} | ${subject} | ${devLink}`);
      return;
    }
    await this.transporter.sendMail({ from: this.config.get('MAIL_FROM'), to, subject, html });
  }

  async sendVerification(to: string, token: string) {
    const link = `${this.frontendUrl}/verificar-email?token=${encodeURIComponent(token)}`;
    await this.send(
      to,
      'Confirmá tu cuenta en Tutorías FRT',
      `<p>¡Hola! Para activar tu cuenta hacé clic en el siguiente enlace (válido por 24 horas):</p>
       <p><a href="${link}">Confirmar mi correo</a></p>
       <p>Si no creaste una cuenta, ignorá este mensaje.</p>`,
      link,
    );
  }

  async sendPasswordReset(to: string, token: string) {
    const link = `${this.frontendUrl}/restablecer?token=${encodeURIComponent(token)}`;
    await this.send(
      to,
      'Restablecer contraseña - Tutorías FRT',
      `<p>Recibimos un pedido para cambiar tu contraseña. El enlace vence en 1 hora:</p>
       <p><a href="${link}">Elegir una nueva contraseña</a></p>
       <p>Si no fuiste vos, ignorá este correo: tu contraseña no cambia.</p>`,
      link,
    );
  }
}
