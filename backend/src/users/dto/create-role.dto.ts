import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}
