import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, OfferingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateBookingDto } from './dto/booking.dto';
import { decrypt } from '../common/utils/field-crypto';

const MIN_ADVANCE_MS = 60 * 60_000; // se reserva con al menos 1 hora de anticipación
const MAX_ADVANCE_DAYS = 90;

const contactSelect = {
  id: true,
  firstName: true,
  lastName: true,
  emailEnc: true,
  phoneEnc: true,
  tutorRatingAvg: true,
  tutorRatingCount: true,
  studentRatingAvg: true,
  studentRatingCount: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateBookingDto) {
    const offering = await this.prisma.offering.findFirst({
      where: { id: dto.offeringId, status: OfferingStatus.APPROVED, tutor: { isActive: true } },
    });
    if (!offering) throw new NotFoundException('La oferta no está disponible');
    if (offering.tutorId === user.id) {
      throw new BadRequestException('No podés reservar una clase con vos mismo');
    }

    const start = new Date(dto.scheduledAt);
    const now = Date.now();
    if (start.getTime() < now + MIN_ADVANCE_MS) {
      throw new BadRequestException('La clase debe reservarse con al menos 1 hora de anticipación');
    }
    if (start.getTime() > now + MAX_ADVANCE_DAYS * 86400_000) {
      throw new BadRequestException(`Solo se puede reservar hasta ${MAX_ADVANCE_DAYS} días adelante`);
    }

    // Evita spam: máximo 3 solicitudes pendientes por oferta y alumno
    const pending = await this.prisma.booking.count({
      where: { offeringId: offering.id, studentId: user.id, status: BookingStatus.PENDING },
    });
    if (pending >= 3) {
      throw new ConflictException('Ya tenés 3 solicitudes pendientes con esta persona');
    }

    const price = new Prisma.Decimal(offering.pricePerHour)
      .mul(dto.durationMinutes)
      .div(60)
      .toDecimalPlaces(2);

    return this.prisma.booking.create({
      data: {
        offeringId: offering.id,
        studentId: user.id,
        scheduledAt: start,
        durationMinutes: dto.durationMinutes,
        priceAgreed: price,
        message: dto.message,
      },
    });
  }

  async list(user: AuthUser, as: 'student' | 'tutor' = 'student') {
    const where: Prisma.BookingWhereInput =
      as === 'tutor' ? { offering: { tutorId: user.id } } : { studentId: user.id };

    const bookings = await this.prisma.booking.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      take: 100,
      include: {
        offering: {
          select: {
            id: true,
            modality: true,
            subject: { select: { id: true, name: true } },
            tutor: { select: contactSelect },
          },
        },
        student: { select: contactSelect },
        reviews: { select: { authorId: true, rating: true, comment: true } },
      },
    });

    // Privacidad: el correo y teléfono de la otra persona solo se muestran con la clase confirmada
    const revealContact: BookingStatus[] = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED];
    return bookings.map((b) => {
      const reveal = revealContact.includes(b.status);
      // Se descifran solo si corresponde mostrarlos
      const strip = <T extends { emailEnc: string; phoneEnc: string | null }>({ emailEnc, phoneEnc, ...u }: T) =>
        reveal ? { ...u, email: decrypt(emailEnc), phone: decrypt(phoneEnc) } : u;
      return {
        ...b,
        student: strip(b.student),
        offering: { ...b.offering, tutor: strip(b.offering.tutor) },
        myReview: b.reviews.find((r) => r.authorId === user.id) ?? null,
        reviews: undefined,
      };
    });
  }

  private async getForTutor(user: AuthUser, id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { offering: { select: { tutorId: true } } },
    });
    if (!booking) throw new NotFoundException('Clase no encontrada');
    if (booking.offering.tutorId !== user.id) throw new ForbiddenException();
    return booking;
  }

  async confirm(user: AuthUser, id: string) {
    const booking = await this.getForTutor(user, id);
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Solo se pueden confirmar solicitudes pendientes');
    }
    if (booking.scheduledAt < new Date()) throw new BadRequestException('La fecha ya pasó');

    const start = booking.scheduledAt.getTime();
    const end = start + booking.durationMinutes * 60_000;

    // Transacción serializable: dos confirmaciones simultáneas no pueden pisarse
    return this.prisma.$transaction(
      async (tx) => {
        const confirmed = await tx.booking.findMany({
          where: {
            offering: { tutorId: user.id },
            status: BookingStatus.CONFIRMED,
            scheduledAt: { gte: new Date(start - 4 * 3600_000), lt: new Date(end) },
          },
          select: { scheduledAt: true, durationMinutes: true },
        });
        const overlaps = confirmed.some((c) => {
          const cStart = c.scheduledAt.getTime();
          const cEnd = cStart + c.durationMinutes * 60_000;
          return cStart < end && start < cEnd;
        });
        if (overlaps) throw new ConflictException('Ya tenés otra clase confirmada en ese horario');
        return tx.booking.update({ where: { id }, data: { status: BookingStatus.CONFIRMED } });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async reject(user: AuthUser, id: string) {
    const booking = await this.getForTutor(user, id);
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Solo se pueden rechazar solicitudes pendientes');
    }
    return this.prisma.booking.update({ where: { id }, data: { status: BookingStatus.REJECTED } });
  }

  async complete(user: AuthUser, id: string) {
    const booking = await this.getForTutor(user, id);
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Solo se pueden finalizar clases confirmadas');
    }
    if (booking.scheduledAt > new Date()) {
      throw new BadRequestException('La clase todavía no empezó');
    }
    return this.prisma.booking.update({ where: { id }, data: { status: BookingStatus.COMPLETED } });
  }

  async cancel(user: AuthUser, id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { offering: { select: { tutorId: true } } },
    });
    if (!booking) throw new NotFoundException('Clase no encontrada');
    if (booking.studentId !== user.id && booking.offering.tutorId !== user.id) {
      throw new ForbiddenException();
    }
    const cancellable: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.CONFIRMED];
    if (!cancellable.includes(booking.status)) {
      throw new BadRequestException('Esta clase ya no se puede cancelar');
    }
    if (booking.scheduledAt < new Date()) {
      throw new BadRequestException('No se puede cancelar una clase que ya empezó');
    }
    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED, cancelledById: user.id },
    });
  }
}
