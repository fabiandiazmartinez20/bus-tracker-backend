import {
  IsEmail,
  IsString,
  IsOptional,
  IsInt,
  IsBoolean,
} from 'class-validator';

export class UpdateChoferDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  apellido?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsInt()
  @IsOptional()
  busAsignado?: number;

  @IsString()
  @IsOptional()
  turno?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
