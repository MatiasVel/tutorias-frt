import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, ReviewDirection } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateReviewDto } from './dto/review.dto';

const REVIEW_WINDOW_DAYS = 30;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Puntuación bidireccional. Reglas:
   *  - solo sobre clases COMPLETED (no se puede puntuar a alguien con quien no hubo clase)
   *  - una sola puntuación por persona y por clase
   *  - dentro de los 30 días posteriores a la clase
   */
  async create(user: AuthUser, dto: CreateReviewDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { offering: { select: { tutorId: true } } },
    });
    if (!booking) throw new NotFoundException('Clase no encontrada');

    const isStudent = booking.studentId === user.id;
    const isTutor = booking.offering.tutorId === user.id;
    if (!isStudent && !isTutor) throw new ForbiddenException();
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Solo se puede puntuar una clase finalizada');
    }
    if (Date.now() - booking.scheduledAt.getTime() > REVIEW_WINDOW_DAYS * 86400_000) {
      throw new BadRequestException(`El plazo para puntuar (${REVIEW_WINDOW_DAYS} días) venció`);
    }

    const direction = isStudent ? ReviewDirection.STUDENT_TO_TUTOR : ReviewDirection.TUTOR_TO_STUDENT;
    const targetId = isStudent ? booking.offering.tutorId : booking.studentId;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
          data: {
            bookingId: booking.id,
            authorId: user.id,
            targetId,
            direction,
            rating: dto.rating,
            comment: dto.comment || null,
          },
        });
        await ReviewsService.recalculate(tx, targetId, direction);
        return review;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Ya puntuaste esta clase');
      }
      throw e;
    }
  }

  /** Recalcula el promedio desnormalizado del usuario (se usa también al moderar). */
  static async recalculate(
    tx: Prisma.TransactionClient,
    userId: string,
    direction: ReviewDirection,
  ) {
    const agg = await tx.review.aggregate({
      where: { targetId: userId, direction, isHidden: false },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const avg = Math.round((agg._avg.rating ?? 0) * 100) / 100;
    const count = agg._count._all;
    await tx.user.update({
      where: { id: userId },
      data:
        direction === ReviewDirection.STUDENT_TO_TUTOR
          ? { tutorRatingAvg: avg, tutorRatingCount: count }
          : { studentRatingAvg: avg, studentRatingCount: count },
    });
  }

  listForUser(userId: string, direction?: ReviewDirection) {
    return this.prisma.review.findMany({
      where: { targetId: userId, isHidden: false, direction },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        rating: true,
        comment: true,
        direction: true,
        createdAt: true,
        author: { select: { id: true, firstName: true, lastName: true } },
        booking: { select: { offering: { select: { subject: { select: { name: true } } } } } },
      },
    });
  }
}
