import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class LogDto {
  @IsISO8601({ strict: true })
  bed_time!: string;

  @IsISO8601({ strict: true })
  wake_time!: string;

  @IsInt()
  @Min(0)
  @Max(600)
  latency_min!: number;

  @IsInt()
  @Min(0)
  @Max(30)
  awakenings!: number;

  @IsInt()
  @Min(0)
  @Max(600)
  awake_min!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsISO8601({ strict: true })
  updated_at!: string;
}
