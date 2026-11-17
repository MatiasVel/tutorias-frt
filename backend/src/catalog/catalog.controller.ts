import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('careers')
  careers() {
    return this.prisma.career.findMany({ orderBy: { name: 'asc' } });
  }

  @Public()
  @Get('subjects')
  subjects(@Query('careerId', new ParseIntPipe({ optional: true })) careerId?: number) {
    return this.prisma.subject.findMany({
      where: careerId ? { careers: { some: { id: careerId } } } : undefined,
      orderBy: [{ year: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, code: true, year: true },
    });
  }
}
