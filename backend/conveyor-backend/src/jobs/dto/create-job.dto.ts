import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateJobDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  type: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  priority?: number;
}
