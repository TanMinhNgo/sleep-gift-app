import { IsBoolean, IsString, Length, ValidateIf } from 'class-validator';

export class UpdateMeDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Length(1, 50)
  name?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  sharing_enabled?: boolean;
}
