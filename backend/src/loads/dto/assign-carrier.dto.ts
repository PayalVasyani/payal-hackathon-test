import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class AssignCarrierDto {
  @IsString()
  @IsNotEmpty()
  carrierOrganizationId: string;

  @IsBoolean()
  @IsOptional()
  overrideCompliance?: boolean;
}
