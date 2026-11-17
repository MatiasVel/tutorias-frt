import { Controller, Get, NotFoundException, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('careers')
  careers() {
    return this.prisma.career.findMany({
      orderBy: { name: 'asc' },
      include: {
        plans: {
          orderBy: { year: 'desc' },
          select: { id: true, year: true, name: true, isCurrent: true },
        },
      },
    });
  }

  @Public()
  @Get('plans')
  plans(@Query('careerId', new ParseIntPipe({ optional: true })) careerId?: number) {
    return this.prisma.studyPlan.findMany({
      where: careerId ? { careerId } : undefined,
      orderBy: [{ isCurrent: 'desc' }, { year: 'desc' }],
      select: { id: true, year: true, name: true, resolution: true, isCurrent: true, careerId: true },
    });
  }

  @Public()
  @Get('subjects')
  subjects(
    @Query('careerId', new ParseIntPipe({ optional: true })) careerId?: number,
    @Query('planId', new ParseIntPipe({ optional: true })) planId?: number,
  ) {
    return this.prisma.subject.findMany({
      where: { planId, plan: careerId ? { careerId } : undefined },
      orderBy: [{ plan: { year: 'desc' } }, { year: 'asc' }, { isElective: 'asc' }, { planCode: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        code: true,
        planCode: true,
        year: true,
        isElective: true,
        isIntegrating: true,
        weeklyHours: true,
        term: true,
        plan: { select: { id: true, year: true, isCurrent: true } },
      },
    });
  }

  /** Detalle de una materia con sus correlativas (qué necesita y para qué materias es requisito). */
  @Public()
  @Get('subjects/:id')
  async subject(@Param('id', ParseIntPipe) id: number) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        plan: { select: { id: true, year: true, name: true } },
        prerequisites: {
          select: { type: true, required: { select: { id: true, planCode: true, name: true } } },
          orderBy: { required: { planCode: 'asc' } },
        },
        requiredFor: {
          select: { type: true, subject: { select: { id: true, planCode: true, name: true } } },
        },
      },
    });
    if (!subject) throw new NotFoundException('Materia no encontrada');
    return subject;
  }
}
