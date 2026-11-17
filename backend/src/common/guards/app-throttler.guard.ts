import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate limit por IP y, en rutas con correo (login, registro, recuperación),
 * también por correo: aunque varios usuarios compartan IP (wifi de la facultad,
 * proxy de Vercel) cada cuenta tiene su propio límite de intentos.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip: string = req.ips?.length ? req.ips[0] : req.ip;
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return email ? `${ip}|${email}` : ip;
  }
}
