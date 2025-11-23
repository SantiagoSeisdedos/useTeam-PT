import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ExportBacklogDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  boardId?: string;
}
