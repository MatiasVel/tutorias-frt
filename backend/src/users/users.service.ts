import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OfferingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect } from '../common/utils/public-user';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getMe(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        ...publicUserSelect,
        email: true,
        phone: true,
        legajo: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });
  }

  async updateMe(id: string, dto: UpdateProfileDto) {
    if (dto.careerId) {
      const exists = await this.prisma.career.findUnique({ where: { id: dto.careerId } });
      if (!exists) throw new BadRequestException('Carrera inexistente');
    }
    await this.prisma.user.update({ where: { id }, data: dto });
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
            subject: { select: { id: true, name: true, year: true } },
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
