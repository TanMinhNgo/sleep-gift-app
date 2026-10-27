import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(1, 50)
  name!: string;

  @IsString()
  @IsNotEmpty()
  adminSecret!: string;
}

export class JoinDto {
  @IsString()
  @Matches(/^\d{6}$/)
  code!: string;

  @IsString()
  @Length(1, 50)
  name!: string;
}
