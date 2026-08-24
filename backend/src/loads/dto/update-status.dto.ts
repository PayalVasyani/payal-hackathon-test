import { IsEnum, IsNotEmpty } from 'class-validator';
import { LoadStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsEnum(LoadStatus)
  status: LoadStatus;
}
