import { IsBoolean, IsString, Length, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMeDto {
  @ApiPropertyOptional({
    example: 'Em',
    minLength: 1,
    maxLength: 50,
    description: 'Không nhận null.',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Length(1, 50)
  name?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Chỉ sleeper được đổi; không nhận null.',
  })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  sharing_enabled?: boolean;
}

export class OtherUserResponseDto {
  @ApiProperty({ example: 'Tân' })
  name!: string;

  @ApiProperty({ example: false })
  sharing_enabled!: boolean;
}

export class MeResponseDto extends OtherUserResponseDto {
  @ApiProperty({ enum: ['sleeper', 'partner'], example: 'sleeper' })
  role!: 'sleeper' | 'partner';

  @ApiProperty({
    type: OtherUserResponseDto,
    nullable: true,
    description: 'null nếu chưa ghép đôi.',
  })
  other!: OtherUserResponseDto | null;
}
