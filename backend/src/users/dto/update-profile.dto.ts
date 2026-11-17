import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UpdateProfileDto {
  @IsOptional()
  @Transform(trim)
  @Matches(/^\+?[0-9 ]{8,20}$/, { message: 'Teléfono inválido' })
  phone?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(600)
  bio?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  careerId?: number;
}
