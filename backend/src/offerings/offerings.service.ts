import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Modality, OfferingStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { publicUserSelect } from '../common/utils/public-user';
import { assertRealFileType, proofPath, removeFile } from '../common/utils/upload.util';
import { CreateOfferingDto, SearchOfferingsDto, UpdateOfferingDto } from './dto/offering.dto';

const publicOfferingSelect = {
  id: true,
  pricePerHour: true,
  modality: true,
  description: true,
  finalGrade: true,
  approvedAt: true,
  createdAt: true,
  subject: { select: { id: true, name: true, year: true, code: true } },
  tutor: { select: publicUserSelect },
} satisfies Prisma.OfferingSelect;

@Injectable()
export class OfferingsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(dto: SearchOfferingsDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 12;

    const where: Prisma.OfferingWhereInput = {
      status: OfferingStatus.APPROVED,
      tutor: { isActive: true },
      subjectId: dto.subjectId,
      // Quien busca "virtual" también ve a quienes ofrecen ambas modalidades
      modality: dto.modality ? { in: [dto.modality, Modality.AMBAS] } : undefined,
      pricePerHour: dto.maxPrice !== undefined ? { lte: dto.maxPrice } : undefined,
      subject: dto.careerId ? { careers: { some: { id: dto.careerId } } } : undefined,
      OR: dto.q
        ? [
            { subject: { name: { contains: dto.q, mode: 'insensitive' } } },
            { tutor: { firstName: { contains: dto.q, mode: 'insensitive' } } },
            { tutor: { lastName: { contains: dto.q, mode: 'insensitive' } } },
          ]
        : undefined,
    };

    const orderBy: Prisma.OfferingOrderByWithRelationInput[] =
      dto.sort === 'price_asc'
        ? [{ pricePerHour: 'asc' }]
        : dto.sort === 'price_desc'
          ? [{ pricePerHour: 'desc' }]
          : dto.sort === 'recent'
            ? [{ createdAt: 'desc' }]
            : [{ tutor: { tutorRatingAvg: 'desc' } }, { tutor: { tutorRatingCount: 'desc' } }];

    const [items, total] = await this.prisma.$transaction([
      this.prisma.offering.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: publicOfferingSelect,
      }),
      this.prisma.offering.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findPublic(id: string) {
    const offering = await this.prisma.offering.findFirst({
      where: { id, status: OfferingStatus.APPROVED, tutor: { isActive: true } },
      select: publicOfferingSelect,
    });
    if (!offering) throw new NotFoundException('Oferta no encontrada');
    return offering;
  }

  findMine(userId: string) {
    return this.prisma.offering.findMany({
      where: { tutorId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        pricePerHour: true,
        modality: true,
        description: true,
        finalGrade: true,
        approvedAt: true,
        status: true,
        reviewNote: true,
        createdAt: true,
        subject: { select: { id: true, name: true, year: true } },
        _count: { select: { bookings: true } },
      },
    });
  }

  async create(user: AuthUser, dto: CreateOfferingDto, file?: Express.Multer.File) {
    try {
      if (file) await assertRealFileType(file);
      // Los alumnos deben acreditar que aprobaron la materia
      if (user.role === Role.STUDENT && !file) {
        throw new BadRequestException(
          'Adjuntá tu analítico o certificado donde conste la materia aprobada',
        );
      }
      const approvedAt = new Date(dto.approvedAt);
      if (approvedAt > new Date()) {
        throw new BadRequestException('La fecha de aprobación no puede ser futura');
      }
      const subject = await this.prisma.subject.findUnique({ where: { id: dto.subjectId } });
      if (!subject) throw new BadRequestException('Materia inexistente');

      const data = {
        pricePerHour: dto.pricePerHour,
        modality: dto.modality,
        description: dto.description,
        finalGrade: dto.finalGrade,
        approvedAt,
        proofFileName: file?.filename,
        proofMimeType: file?.mimetype,
        status: OfferingStatus.PENDING_REVIEW,
        reviewNote: null,
        reviewedAt: null,
        reviewedById: null,
      };

      const existing = await this.prisma.offering.findUnique({
        where: { tutorId_subjectId: { tutorId: user.id, subjectId: dto.subjectId } },
      });
      if (existing) {
        if (existing.status !== OfferingStatus.REJECTED) {
          throw new ConflictException('Ya tenés una oferta para esta materia');
        }
        // Reenvío tras un rechazo: se reemplaza el comprobante anterior
        if (existing.proofFileName) await removeFile(proofPath(existing.proofFileName));
        return this.prisma.offering.update({ where: { id: existing.id }, data });
      }
      return await this.prisma.offering.create({
        data: { ...data, tutorId: user.id, subjectId: dto.subjectId },
      });
    } catch (e) {
      await removeFile(file?.path);
      throw e;
    }
  }

  async update(user: AuthUser, id: string, dto: UpdateOfferingDto) {
    const offering = await this.prisma.offering.findUnique({ where: { id } });
    if (!offering) throw new NotFoundException('Oferta no encontrada');
    if (offering.tutorId !== user.id) throw new ForbiddenException();

    if (dto.status) {
      const togglable: OfferingStatus[] = [OfferingStatus.APPROVED, OfferingStatus.PAUSED];
      if (!togglable.includes(offering.status)) {
        throw new BadRequestException('Solo se pueden pausar o reactivar ofertas aprobadas');
      }
    }
    return this.prisma.offering.update({ where: { id }, data: dto });
  }
}
