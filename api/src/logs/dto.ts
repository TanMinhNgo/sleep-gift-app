import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';

export class LogDto {
  @ApiProperty({ format: 'date-time', example: '2026-10-24T16:30:00.000Z' })
  @IsISO8601({ strict: true })
  bed_time!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-10-24T23:30:00.000Z',
    description: 'Phải sau bed_time.',
  })
  @IsISO8601({ strict: true })
  wake_time!: string;

  @ApiProperty({ type: 'integer', minimum: 0, maximum: 600, example: 40 })
  @IsInt()
  @Min(0)
  @Max(600)
  latency_min!: number;

  @ApiProperty({ type: 'integer', minimum: 0, maximum: 30, example: 2 })
  @IsInt()
  @Min(0)
  @Max(30)
  awakenings!: number;

  @ApiProperty({ type: 'integer', minimum: 0, maximum: 600, example: 15 })
  @IsInt()
  @Min(0)
  @Max(600)
  awake_min!: number;

  @ApiProperty({ type: 'integer', minimum: 1, maximum: 5, example: 3 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({
    maxLength: 500,
    nullable: true,
    example: 'Hơi mệt',
    description: 'Bỏ qua hoặc null để xóa ghi chú.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-10-25T00:00:00.000Z',
    description: 'Thời điểm sửa trên client; giữ nguyên khi retry.',
  })
  @IsISO8601({ strict: true })
  updated_at!: string;
}

export class LogResponseDto extends OmitType(LogDto, ['note'] as const) {
  @ApiProperty({ format: 'date', example: '2026-10-25' })
  date!: string;

  @ApiProperty({ type: String, nullable: true, maxLength: 500, example: null })
  note!: string | null;
}

export class AppliedResponseDto {
  @ApiProperty({
    example: true,
    description: 'false nếu updated_at bằng hoặc cũ hơn bản server.',
  })
  applied!: boolean;
}
