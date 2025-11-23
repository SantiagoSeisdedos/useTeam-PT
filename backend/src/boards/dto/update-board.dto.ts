import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class UpdateBoardDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  columns?: string[];

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
