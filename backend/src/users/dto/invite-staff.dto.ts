import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class InviteStaffDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  roleId: string;
}
