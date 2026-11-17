import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OfferingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect } from '../common/utils/public-user';
import { decrypt, encrypt } from '../common/utils/field-crypto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(id: string) {
    const { emailEnc, phoneEnc, legajoEnc, ...user } = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        ...publicUserSelect,
        emailEnc: true,
        phoneEnc: true,
        legajoEnc: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });
    // Los datos personales se descifran solo para su dueño
    return { ...user, email: decrypt(emailEnc), phone: decrypt(phoneEnc), legajo: decrypt(legajoEnc) };
  }

  async updateMe(id: string, dto: UpdateProfileDto) {
    if (dto.careerId) {
      const exists = await this.prisma.career.findUnique({ where: { id: dto.careerId } });
      if (!exists) throw new BadRequestException('Carrera inexistente');
    }
    if (dto.studyPlanId) {
      const plan = await this.prisma.studyPlan.findUnique({ where: { id: dto.studyPlanId } });
      if (!plan) throw new BadRequestException('Plan de estudios inexistente');
    }
    const { phone, ...rest } = dto;
    await this.prisma.user.update({
      where: { id },
      data: { ...rest, ...(phone !== undefined ? { phoneEnc: encrypt(phone) } : {}) },
    });
    return this.getMe(id);
  }

  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, isActive: true },
      select: {
        ...publicUserSelect,
        createdAt: true,
        offerings: {
          where: { status: OfferingStatus.APPROVED },
          select: {
            id: true,
            pricePerHour: true,
            modality: true,
            finalGrade: true,
            subject: { select: { id: true, name: true, year: true, plan: { select: { year: true } } } },
          },
        },
        reviewsReceived: {
          where: { isHidden: false },
          orderBy: { createdAt: 'desc' },
          take: 30,
          select: {
            id: true,
            rating: true,
            comment: true,
            direction: true,
            createdAt: true,
            author: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
