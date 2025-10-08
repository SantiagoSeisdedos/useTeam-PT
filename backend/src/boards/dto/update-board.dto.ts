import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateBoardDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  columns?: string[];
}
