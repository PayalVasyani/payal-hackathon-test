import { IsString, IsNotEmpty } from 'class-validator';

export class UploadPodDto {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileType: string;

  @IsString()
  @IsNotEmpty()
  fileData: string;
}
