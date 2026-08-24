import { IsString, IsNotEmpty } from 'class-validator';

export class CreateLoadDto {
  @IsString()
  @IsNotEmpty()
  shipperId: string;
}
