import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';

export class ImproveDescriptionDto {
  @IsString()
  @IsNotEmpty()
  currentDescription: string;

  @IsString()
  @IsNotEmpty()
  taskTitle: string;

  @IsEnum(['simple', 'context'])
  mode: 'simple' | 'context';

  @IsEnum([
    'gpt-3.5-turbo',
    'gpt-4o-mini',
    'gpt-4o',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
  ])
  @IsOptional()
  model?:
    | 'gpt-3.5-turbo'
    | 'gpt-4o-mini'
    | 'gpt-4o'
    | 'gemini-2.5-flash'
    | 'gemini-2.5-pro';

  @IsArray()
  @IsOptional()
  contextTasks?: Array<{
    title: string;
    description: string;
    column: string;
  }>;
}
