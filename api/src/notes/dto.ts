import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NoteDto {
  @ApiProperty({ enum: ['goodnight', 'scene', 'word'], example: 'goodnight' })
  @IsIn(['goodnight', 'scene', 'word'])
  kind!: 'goodnight' | 'scene' | 'word';

  @ApiProperty({ minLength: 1, maxLength: 2000, example: 'Ngủ ngon nhé!' })
  @IsString()
  @Length(1, 2000)
  text!: string;

  @ApiPropertyOptional({
    format: 'date',
    nullable: true,
    example: '2026-10-25',
    description:
      'Bắt buộc là ngày có thật với goodnight; scene/word có thể bỏ qua hoặc null.',
  })
  @IsOptional()
  @IsString()
  show_on_date?: string;
}

export type Note = {
  id: string;
  kind: NoteDto['kind'];
  text: string;
  show_on_date: string | null;
  created_at: string;
};

export class NoteResponseDto implements Note {
  @ApiProperty({
    format: 'uuid',
    example: '64812c15-1220-465c-920a-c23a55b04538',
  })
  id!: string;

  @ApiProperty({ enum: ['goodnight', 'scene', 'word'] })
  kind!: NoteDto['kind'];

  @ApiProperty({ example: 'Ngủ ngon nhé!', minLength: 1, maxLength: 2000 })
  text!: string;

  @ApiProperty({
    type: String,
    format: 'date',
    nullable: true,
    example: '2026-10-25',
  })
  show_on_date!: string | null;

  @ApiProperty({ format: 'date-time', example: '2026-10-25T00:00:00.000Z' })
  created_at!: string;
}
