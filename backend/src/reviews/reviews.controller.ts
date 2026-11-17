import { Body, Controller, Get, Param, ParseEnumPipe, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ReviewDirection } from '@prisma/client';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user, dto);
  }

  @Get('user/:id')
  list(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('direction', new ParseEnumPipe(ReviewDirection, { optional: true }))
    direction?: ReviewDirection,
  ) {
    return this.reviews.listForUser(id, direction);
  }
}
