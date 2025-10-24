import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsMongoId,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  column: string;

  @IsMongoId()
  @IsNotEmpty()
  boardId: string;

  @IsNumber()
  @IsOptional()
  position?: number;

  @IsString()
  @IsOptional()
  color?: string | null;

  @IsString()
  @IsOptional()
  userId?: string;
}
