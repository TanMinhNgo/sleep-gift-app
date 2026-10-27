import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class NoteDto {
  @IsIn(['goodnight', 'scene', 'word'])
  kind!: 'goodnight' | 'scene' | 'word';

  @IsString()
  @Length(1, 2000)
  text!: string;

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
