import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export enum AccountType {
  BROKER = 'BROKER',
  CARRIER = 'CARRIER',
  SHIPPER = 'SHIPPER'
}

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AccountType)
  @IsNotEmpty()
  accountType: AccountType;

  @IsString()
  @IsOptional()
  companyName?: string;
}
