import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Tân', minLength: 1, maxLength: 50 })
  @IsString()
  @Length(1, 50)
  name!: string;

  @ApiProperty({
    description: 'Secret của partner, phải khớp ADMIN_SECRET trên API.',
    format: 'password',
    writeOnly: true,
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  adminSecret!: string;
}

export class JoinDto {
  @ApiProperty({
    example: '012345',
    pattern: '^\\d{6}$',
    description: 'Mã 6 chữ số, giữ nguyên số 0 ở đầu.',
  })
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;

  @ApiProperty({ example: 'Em', minLength: 1, maxLength: 50 })
  @IsString()
  @Length(1, 50)
  name!: string;
}

export class InviteResponseDto {
  @ApiProperty({ example: '012345', pattern: '^\\d{6}$' })
  inviteCode!: string;
}

export class RegisterResponseDto extends InviteResponseDto {
  @ApiProperty({ example: 'A'.repeat(43), pattern: '^[A-Za-z0-9_-]{43}$' })
  token!: string;
}

export class JoinResponseDto {
  @ApiProperty({ example: 'A'.repeat(43), pattern: '^[A-Za-z0-9_-]{43}$' })
  token!: string;

  @ApiProperty({ example: 'Tân' })
  partnerName!: string;
}
