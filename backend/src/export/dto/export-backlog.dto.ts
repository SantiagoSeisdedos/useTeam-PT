import { IsEmail, IsOptional } from 'class-validator';

export class ExportBacklogDto {
  @IsEmail()
  @IsOptional()
  email?: string;
}
