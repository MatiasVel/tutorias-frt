import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EmailTokenType, Prisma, Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { generateToken, hashToken } from '../common/utils/crypto.util';
import { blindIndex, decrypt, encrypt, encryptOptional } from '../common/utils/field-crypto';
import { hashPassword, verifyPassword } from '../common/utils/password.util';
import { LoginDto, RegisterDto } from './dto/auth.dto';

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const RESEND_COOLDOWN_MS = 60_000;

export interface SessionMeta {
  ip?: string;
  userAgent?: string;
}

const parseDomains = (v?: string) =>
  (v ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  readonly allowedDomains: string[];
  private readonly professorDomains: string[];
  private readonly refreshDays: number;
  private readonly dummyHash: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    config: ConfigService,
  ) {
    this.allowedDomains = parseDomains(config.get('ALLOWED_EMAIL_DOMAINS'));
    this.professorDomains = parseDomains(config.get('PROFESSOR_EMAIL_DOMAINS'));
    this.refreshDays = Number(config.get('REFRESH_TOKEN_TTL_DAYS') ?? 7);
    // Hash "señuelo" para que el login tarde lo mismo exista o no el usuario
    this.dummyHash = hashPassword(generateToken(16));
  }

  private domainOf(email: string) {
    return email.split('@')[1]?.toLowerCase() ?? '';
  }

  isAllowedEmail(email: string) {
    if (this.allowedDomains.length === 0) return true;
    return this.allowedDomains.includes(this.domainOf(email));
  }

  private domainError() {
    return new BadRequestException(
      `Solo se aceptan correos institucionales: ${this.allowedDomains.map((d) => '@' + d).join(' o ')}`,
    );
  }

  // ---------- Registro y verificación ----------

  async register(dto: RegisterDto) {
    const generic = {
      message: 'Si los datos son válidos, te enviamos un correo para confirmar tu cuenta.',
    };
    if (!this.isAllowedEmail(dto.email)) throw this.domainError();

    if (dto.careerId) {
      const career = await this.prisma.career.findUnique({ where: { id: dto.careerId } });
      if (!career) throw new BadRequestException('Carrera inexistente');
    }
    if (dto.studyPlanId) {
      const plan = await this.prisma.studyPlan.findUnique({ where: { id: dto.studyPlanId } });
      if (!plan || (dto.careerId && plan.careerId !== dto.careerId)) {
        throw new BadRequestException('El plan de estudios no corresponde a la carrera');
      }
    }

    // Los correos del dominio docente quedan registrados como DOCENTE automáticamente
    const role = this.professorDomains.includes(this.domainOf(dto.email)) ? Role.PROFESSOR : Role.STUDENT;

    let userId: string;
    try {
      const user = await this.prisma.user.create({
        data: {
          emailEnc: encrypt(dto.email),
          emailHash: blindIndex(dto.email),
          passwordHash: await hashPassword(dto.password),
          firstName: dto.firstName,
          lastName: dto.lastName,
          legajoEnc: encryptOptional(dto.legajo),
          legajoHash: dto.legajo ? blindIndex(dto.legajo) : null,
          role,
          careerId: dto.careerId,
          studyPlanId: dto.studyPlanId,
        },
        select: { id: true },
      });
      userId = user.id;
    } catch (e) {
      // Correo o legajo ya registrados: respuesta idéntica para no revelar qué cuentas existen
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        this.logger.warn('Intento de registro con correo o legajo ya existente');
        return generic;
      }
      throw e;
    }
    try {
      await this.issueEmailToken(userId, dto.email, EmailTokenType.VERIFY_EMAIL);
    } catch {
      return {
        message:
          'Tu cuenta se creó, pero no pudimos enviar el correo de verificación. Usá "Reenviar correo de verificación" en la pantalla de ingreso.',
      };
    }
    return generic;
  }

  private async issueEmailToken(userId: string, email: string, type: EmailTokenType) {
    const token = generateToken();
    const ttlMs = type === EmailTokenType.VERIFY_EMAIL ? 24 * 3600_000 : 3600_000;
    // Invalida tokens anteriores del mismo tipo
    await this.prisma.emailToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });
    await this.prisma.emailToken.create({
      data: { userId, type, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ttlMs) },
    });
    if (type === EmailTokenType.VERIFY_EMAIL) await this.mail.sendVerification(email, token);
    else await this.mail.sendPasswordReset(email, token);
  }

  private async consumeEmailToken(token: string, type: EmailTokenType) {
    const record = await this.prisma.emailToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('El enlace es inválido o venció. Pedí uno nuevo.');
    }
    await this.prisma.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    return record;
  }

  async verifyEmail(token: string) {
    const record = await this.consumeEmailToken(token, EmailTokenType.VERIFY_EMAIL);
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    });
    return { message: 'Correo confirmado. Ya podés iniciar sesión.' };
  }

  /** Reenvía el correo de verificación (respuesta genérica, con espera mínima entre envíos). */
  async resendVerification(email: string) {
    const generic = { message: 'Si la cuenta existe y no está verificada, te reenviamos el correo.' };
    if (!this.isAllowedEmail(email)) throw this.domainError();
    const user = await this.prisma.user.findUnique({ where: { emailHash: blindIndex(email) } });
    if (!user || user.emailVerifiedAt || !user.isActive) return generic;

    const last = await this.prisma.emailToken.findFirst({
      where: { userId: user.id, type: EmailTokenType.VERIFY_EMAIL },
      orderBy: { createdAt: 'desc' },
    });
    if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) return generic;

    await this.issueEmailToken(user.id, email, EmailTokenType.VERIFY_EMAIL);
    return generic;
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { emailHash: blindIndex(email) } });
    if (user && user.isActive) {
      await this.issueEmailToken(user.id, decrypt(user.emailEnc)!, EmailTokenType.RESET_PASSWORD);
    }
    return { message: 'Si el correo está registrado, te enviamos instrucciones.' };
  }

  async resetPassword(token: string, password: string) {
    const record = await this.consumeEmailToken(token, EmailTokenType.RESET_PASSWORD);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          passwordHash: await hashPassword(password),
          failedLoginCount: 0,
          lockedUntil: null,
          // Si pudo leer el correo, el email queda verificado
          emailVerifiedAt: new Date(),
        },
      }),
      // Cierra todas las sesiones abiertas
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await this.audit(record.userId, 'PASSWORD_RESET');
    return { message: 'Contraseña actualizada. Iniciá sesión nuevamente.' };
  }

  // ---------- Login y sesiones ----------

  async login(dto: LoginDto, meta: SessionMeta) {
    const invalid = new UnauthorizedException('Correo o contraseña incorrectos');
    const user = await this.prisma.user.findUnique({ where: { emailHash: blindIndex(dto.email) } });

    // Solo correos institucionales (la cuenta de administración queda exceptuada)
    if (!this.isAllowedEmail(dto.email) && user?.role !== Role.ADMIN) {
      throw this.domainError();
    }

    if (!user) {
      await verifyPassword(await this.dummyHash, dto.password);
      throw invalid;
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException(
        'Cuenta bloqueada temporalmente por intentos fallidos. Probá en unos minutos.',
      );
    }

    const ok = await verifyPassword(user.passwordHash, dto.password);
    if (!ok) {
      const failed = user.failedLoginCount + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: failed >= MAX_FAILED_LOGINS ? 0 : failed,
          lockedUntil:
            failed >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
        },
      });
      await this.audit(user.id, 'LOGIN_FAILED', meta.ip);
      throw invalid;
    }
    if (!user.isActive) throw new ForbiddenException('La cuenta está suspendida');
    if (!user.emailVerifiedAt) {
      // El código permite al frontend ofrecer "reenviar correo de verificación"
      throw new ForbiddenException({
        statusCode: 403,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Tenés que confirmar tu correo antes de ingresar. Revisá tu bandeja (y la carpeta de spam).',
      });
    }

    if (user.failedLoginCount > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: 0, lockedUntil: null },
      });
    }
    await this.audit(user.id, 'LOGIN', meta.ip);
    return this.createSession(user.id, randomUUID(), meta);
  }

  private async createSession(userId: string, familyId: string, meta: SessionMeta) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, role: true, firstName: true, lastName: true },
    });
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    const refreshToken = generateToken();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshDays * 86400_000),
        ip: meta.ip,
        userAgent: meta.userAgent?.slice(0, 255),
      },
    });
    return { accessToken, refreshToken, refreshMaxAgeMs: this.refreshDays * 86400_000, user };
  }

  /** Rotación de refresh token con detección de reutilización (robo de token). */
  async refresh(token: string | undefined, meta: SessionMeta) {
    if (!token) throw new UnauthorizedException();
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { select: { isActive: true } } },
    });
    if (!record) throw new UnauthorizedException();

    if (record.revokedAt) {
      // Un token ya usado volvió a aparecer: se revoca toda la familia de sesiones
      await this.prisma.refreshToken.updateMany({
        where: { familyId: record.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await this.audit(record.userId, 'REFRESH_TOKEN_REUSE', meta.ip);
      throw new UnauthorizedException();
    }
    if (record.expiresAt < new Date() || !record.user.isActive) throw new UnauthorizedException();

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    return this.createSession(record.userId, record.familyId, meta);
  }

  async logout(token: string | undefined) {
    if (!token) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async audit(userId: string, action: string, ip?: string) {
    await this.prisma.auditLog.create({ data: { userId, action, ip } }).catch(() => undefined);
  }
}
