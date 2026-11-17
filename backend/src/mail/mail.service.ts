import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Envío de correos. Proveedores soportados (en orden de prioridad):
 *  1. BREVO_API_KEY  -> API HTTP de Brevo (gratis: 300 correos/día). Recomendado en Vercel.
 *  2. SMTP_HOST      -> cualquier SMTP (Brevo SMTP, Gmail con contraseña de aplicación, etc.)
 *  3. ninguno        -> modo desarrollo: el enlace se imprime en la consola del backend.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly brevoKey?: string;
  private readonly frontendUrl: string;
  private readonly from: { name: string; email: string };

  constructor(private readonly config: ConfigService) {
    this.brevoKey = config.get<string>('BREVO_API_KEY') || undefined;
    this.frontendUrl = (config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173').split(',')[0].trim();
    this.from = {
      name: config.get<string>('MAIL_FROM_NAME') ?? 'Tutorías FRT',
      email: config.get<string>('MAIL_FROM_EMAIL') ?? 'no-reply@example.com',
    };
    const host = config.get<string>('SMTP_HOST');
    this.transporter =
      !this.brevoKey && host
        ? nodemailer.createTransport({
            host,
            port: Number(config.get('SMTP_PORT') ?? 587),
            secure: Number(config.get('SMTP_PORT')) === 465,
            auth: { user: config.get('SMTP_USER'), pass: config.get('SMTP_PASS') },
          })
        : null;
  }

  private layout(title: string, body: string, cta: { text: string; href: string }) {
    // Plantilla simple con estilos en línea (los clientes de correo no aceptan CSS externo)
    return `<!doctype html><html lang="es"><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#0a0a0a;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold">Tutorías <span style="color:#f26722">FRT</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 12px;font-size:20px">${title}</h1>
<div style="font-size:15px;line-height:1.6;color:#3f3f46">${body}</div>
<p style="margin:24px 0"><a href="${cta.href}" style="background:#c2410c;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block">${cta.text}</a></p>
<p style="font-size:12px;color:#71717a">Si el botón no funciona, copiá este enlace en el navegador:<br><span style="word-break:break-all">${cta.href}</span></p>
</td></tr>
<tr><td style="border-top:3px solid #f26722;padding:14px 28px;font-size:12px;color:#71717a">Plataforma de clases entre estudiantes de la UTN Facultad Regional Tucumán</td></tr>
</table></td></tr></table></body></html>`;
  }

  private async send(to: string, subject: string, html: string, devLink: string) {
    try {
      if (this.brevoKey) {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'api-key': this.brevoKey, 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ sender: this.from, to: [{ email: to }], subject, htmlContent: html }),
        });
        if (!res.ok) throw new Error(`Brevo respondió ${res.status}: ${await res.text()}`);
        return;
      }
      if (this.transporter) {
        await this.transporter.sendMail({ from: this.from, to, subject, html });
        return;
      }
    } catch (e) {
      this.logger.error(`No se pudo enviar el correo: ${(e as Error).message}`);
      throw new InternalServerErrorException('No pudimos enviar el correo. Probá de nuevo en unos minutos.');
    }
    // Sin proveedor configurado (solo desarrollo)
    this.logger.warn(`[DEV] Correo no enviado (sin proveedor). ${subject} -> ${devLink}`);
  }

  async sendVerification(to: string, token: string) {
    const link = `${this.frontendUrl}/verificar-email?token=${encodeURIComponent(token)}`;
    await this.send(
      to,
      'Confirmá tu cuenta en Tutorías FRT',
      this.layout(
        '¡Bienvenido/a a Tutorías FRT!',
        '<p>Para activar tu cuenta confirmá tu correo institucional. El enlace es válido por 24 horas.</p><p>Si no creaste una cuenta, ignorá este mensaje.</p>',
        { text: 'Confirmar mi correo', href: link },
      ),
      link,
    );
  }

  async sendPasswordReset(to: string, token: string) {
    const link = `${this.frontendUrl}/restablecer?token=${encodeURIComponent(token)}`;
    await this.send(
      to,
      'Restablecer contraseña - Tutorías FRT',
      this.layout(
        'Restablecer tu contraseña',
        '<p>Recibimos un pedido para cambiar tu contraseña. El enlace vence en 1 hora.</p><p>Si no fuiste vos, ignorá este correo: tu contraseña no cambia.</p>',
        { text: 'Elegir una nueva contraseña', href: link },
      ),
      link,
    );
  }
}
