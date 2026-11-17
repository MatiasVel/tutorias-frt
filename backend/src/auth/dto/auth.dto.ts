import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const lower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

// Mínimo 10 caracteres, con mayúscula, minúscula y número
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,128}$/;
const PASSWORD_MSG =
  'La contraseña debe tener entre 10 y 128 caracteres e incluir mayúscula, minúscula y número';

export class RegisterDto {
  @Transform(lower)
  @IsEmail({}, { message: 'Correo inválido' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  password!: string;

  @Transform(trim)
  @IsString()
  @Length(2, 60)
  firstName!: string;

  @Transform(trim)
  @IsString()
  @Length(2, 60)
  lastName!: string;

  @IsOptional()
  @Transform(trim)
  @Matches(/^[0-9]{4,10}$/, { message: 'El legajo debe ser numérico (4 a 10 dígitos)' })
  legajo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  careerId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  studyPlanId?: number;
}

export class LoginDto {
  @Transform(lower)
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(128)
  password!: string;
}

export class TokenDto {
  @IsString()
  @Length(20, 200)
  token!: string;
}

export class ForgotPasswordDto {
  @Transform(lower)
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto extends TokenDto {
  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  password!: string;
}
