import { IsNumber, Min } from 'class-validator';

export class CreateRateDto {
  @IsNumber()
  @Min(0)
  baseRate: number;

  @IsNumber()
  @Min(0)
  accessorials: number;
}
