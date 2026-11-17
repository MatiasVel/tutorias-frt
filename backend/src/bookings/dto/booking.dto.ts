import { Transform, Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  offeringId!: string;

  @IsDateString()
  scheduledAt!: string;

  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(240)
  durationMinutes!: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class ListBookingsDto {
  @IsOptional()
  @IsIn(['student', 'tutor'])
  as?: 'student' | 'tutor';
}
