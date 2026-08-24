import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateLoadDto {
  @IsString()
  @IsNotEmpty()
  shipperId: string;

  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsString()
  @IsNotEmpty()
  equipmentType: string;

  @IsString()
  @IsNotEmpty()
  commodity: string;

  @IsOptional()
  @IsDateString()
  pickupDate?: string;

  @IsOptional()
  @IsDateString()
  deliveryDate?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  targetOffer?: number;
}
