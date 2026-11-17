import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { OfferingStatus, Role } from '@prisma/client';

export class ReviewOfferingDto {
  @IsIn(['APPROVED', 'REJECTED'])
  decision!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ListOfferingsAdminDto {
  @IsOptional()
  @IsEnum(OfferingStatus)
  status?: OfferingStatus;
}

export class UpdateUserAdminDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class HideReviewDto {
  @IsBoolean()
  hidden!: boolean;
}

export class SearchUsersDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(80)
  q?: string;
}
