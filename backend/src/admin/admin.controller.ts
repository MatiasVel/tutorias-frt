import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import {
  HideReviewDto,
  ListOfferingsAdminDto,
  ReviewOfferingDto,
  SearchUsersDto,
  UpdateUserAdminDto,
} from './dto/admin.dto';

@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('offerings')
  offerings(@Query() q: ListOfferingsAdminDto) {
    return this.admin.listOfferings(q.status);
  }

  @Get('offerings/:id/proof')
  async proof(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    const file = await this.admin.getProof(user, id);
    return new StreamableFile(file.data, {
      type: file.mimeType,
      disposition: `inline; filename="${file.fileName}"`,
      length: file.data.length,
    });
  }

  @Patch('offerings/:id/review')
  review(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewOfferingDto,
  ) {
    return this.admin.reviewOffering(user, id, dto);
  }

  @Get('users')
  users(@Query() q: SearchUsersDto) {
    return this.admin.listUsers(q.q);
  }

  @Patch('users/:id')
  updateUser(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserAdminDto,
  ) {
    return this.admin.updateUser(user, id, dto);
  }

  @Patch('users/:id/verify-email')
  verifyEmail(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.verifyUserEmail(user, id);
  }

  @Patch('reviews/:id/hide')
  hideReview(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: HideReviewDto,
  ) {
    return this.admin.hideReview(user, id, dto.hidden);
  }
}
