import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class MoveTaskDto {
  @IsString()
  @IsNotEmpty()
  sourceColumn: string;

  @IsString()
  @IsNotEmpty()
  destinationColumn: string;

  @IsNumber()
  @IsNotEmpty()
  sourceIndex: number;

  @IsNumber()
  @IsNotEmpty()
  destinationIndex: number;
}
