import { IsOptional, IsString, IsArray, IsDateString } from 'class-validator';

export class UpdateComplianceDto {
  @IsOptional()
  @IsDateString()
  insuranceExpiry?: string;

  @IsOptional()
  @IsString()
  mcDotStatus?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  approvedEquipment?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  approvedCommodities?: string[];
}
