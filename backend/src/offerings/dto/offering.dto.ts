import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Modality } from '@prisma/client';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateOfferingDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  subjectId!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000)
  pricePerHour!: number;

  @IsEnum(Modality)
  modality!: Modality;

  @Transform(trim)
  @IsString()
  @Length(20, 1000, { message: 'Contá en al menos 20 caracteres cómo son tus clases' })
  description!: string;

  @Type(() => Number)
  @IsInt()
  @Min(4)
  @Max(10)
  finalGrade!: number;

  @IsDateString({}, { message: 'Fecha de aprobación inválida' })
  approvedAt!: string;
}

export class UpdateOfferingDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1_000_000)
  pricePerHour?: number;

  @IsOptional()
  @IsEnum(Modality)
  modality?: Modality;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(20, 1000)
  description?: string;

  /** Permite pausar/reactivar una oferta ya aprobada */
  @IsOptional()
  @IsIn(['PAUSED', 'APPROVED'])
  status?: 'PAUSED' | 'APPROVED';
}

export class SearchOfferingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subjectId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  careerId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  planId?: number;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @IsEnum(Modality)
  modality?: Modality;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsIn(['rating', 'price_asc', 'price_desc', 'recent'])
  sort?: 'rating' | 'price_asc' | 'price_desc' | 'recent';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}
