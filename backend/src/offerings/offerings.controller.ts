import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { proofUploadOptions } from '../common/utils/upload.util';
import { CreateOfferingDto, SearchOfferingsDto, UpdateOfferingDto } from './dto/offering.dto';
import { OfferingsService } from './offerings.service';

@Controller('offerings')
export class OfferingsController {
  constructor(private readonly offerings: OfferingsService) {}

  @Public()
  @Get()
  search(@Query() dto: SearchOfferingsDto) {
    return this.offerings.search(dto);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.offerings.findMine(user.id);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.offerings.findPublic(id);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  @UseInterceptors(FileInterceptor('proof', proofUploadOptions))
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOfferingDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.offerings.create(user, dto, file);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOfferingDto,
  ) {
    return this.offerings.update(user, id, dto);
  }
}
