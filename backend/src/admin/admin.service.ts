import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus, OfferingStatus } from '@prisma/client';
import { createReadStream } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { proofPath } from '../common/utils/upload.util';
import { ReviewsService } from '../reviews/reviews.service';
import { ReviewOfferingDto, UpdateUserAdminDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private audit(admin: AuthUser, action: string, entity: string, entityId: string) {
    return this.prisma.auditLog.create({ data: { userId: admin.id, action, entity, entityId } });
  }

  async stats() {
    const [users, pendingOfferings, approvedOfferings, completedClasses] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.offering.count({ where: { status: OfferingStatus.PENDING_REVIEW } }),
      this.prisma.offering.count({ where: { status: OfferingStatus.APPROVED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
    ]);
    return { users, pendingOfferings, approvedOfferings, completedClasses };
  }

  listOfferings(status: OfferingStatus = OfferingStatus.PENDING_REVIEW) {
    return this.prisma.offering.findMany({
      where: { status },
      orderBy: { createdAt: 'asc' },
      take: 100,
      select: {
        id: true,
        status: true,
        pricePerHour: true,
        modality: true,
        description: true,
        finalGrade: true,
        approvedAt: true,
        proofFileName: true,
        reviewNote: true,
        createdAt: true,
        subject: { select: { name: true, year: true } },
        tutor: {
          select: { id: true, firstName: true, lastName: true, email: true, legajo: true, role: true },
        },
      },
    });
  }

  async getProof(id: string) {
    const offering = await this.prisma.offering.findUnique({
      where: { id },
      select: { proofFileName: true, proofMimeType: true },
    });
    if (!offering?.proofFileName) throw new NotFoundException('Sin comprobante adjunto');
    return {
      stream: createReadStream(proofPath(offering.proofFileName)),
      mimeType: offering.proofMimeType ?? 'application/octet-stream',
      fileName: offering.proofFileName,
    };
  }

  async reviewOffering(admin: AuthUser, id: string, dto: ReviewOfferingDto) {
    const offering = await this.prisma.offering.findUnique({ where: { id } });
    if (!offering) throw new NotFoundException('Oferta no encontrada');
    if (dto.decision === 'REJECTED' && !dto.note) {
      throw new BadRequestException('Indicá el motivo del rechazo');
    }
    const updated = await this.prisma.offering.update({
      where: { id },
      data: {
        status: dto.decision,
        reviewNote: dto.note ?? null,
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });
    await this.audit(admin, `OFFERING_${dto.decision}`, 'Offering', id);
    return updated;
  }

  listUsers(q?: string) {
    return this.prisma.user.findMany({
      where: q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { legajo: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        legajo: true,
        role: true,
        isActive: true,
        emailVerifiedAt: true,
        tutorRatingAvg: true,
        studentRatingAvg: true,
        createdAt: true,
      },
    });
  }

  async updateUser(admin: AuthUser, id: string, dto: UpdateUserAdminDto) {
    if (id === admin.id) throw new BadRequestException('No podés modificar tu propia cuenta');
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, isActive: true, role: true },
    });
    if (dto.isActive === false) {
      // Suspender = cerrar todas sus sesiones
      await this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    await this.audit(admin, 'USER_UPDATED', 'User', id);
    return user;
  }

  async hideReview(admin: AuthUser, id: string, hidden: boolean) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Reseña no encontrada');
    await this.prisma.$transaction(async (tx) => {
      await tx.review.update({ where: { id }, data: { isHidden: hidden } });
      await ReviewsService.recalculate(tx, review.targetId, review.direction);
    });
    await this.audit(admin, hidden ? 'REVIEW_HIDDEN' : 'REVIEW_SHOWN', 'Review', id);
    return { id, hidden };
  }
}
