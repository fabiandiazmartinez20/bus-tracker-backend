import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class UpdateBusDto {
  @IsString()
  @IsOptional()
  numero?: string;

  @IsString()
  @IsOptional()
  ruta?: string;

  @IsString()
  @IsOptional()
  placa?: string;

  @IsString()
  @IsOptional()
  modelo?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsInt()
  @IsOptional()
  capacidad?: number;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
