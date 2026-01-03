import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
} from 'class-validator';

export class CreateChoferDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsNotEmpty()
  apellido: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  telefono: string;

  @IsInt()
  @IsNotEmpty()
  busAsignado: number;

  @IsString()
  @IsOptional()
  turno?: string;
}
