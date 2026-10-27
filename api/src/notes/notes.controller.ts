import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard, CurrentUser, requireRole } from '../common/auth.guard';
import type { AuthUser } from '../common/auth.guard';
import {
  addDays,
  isIsoDate,
  validateDateRange,
  vnToday,
} from '../common/dates';
import { sql } from '../common/db';
import { NoteDto } from './dto';
import type { Note } from './dto';

@Controller('notes')
@UseGuards(AuthGuard)
export class NotesController {
  @Post()
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: NoteDto,
  ): Promise<Note> {
    requireRole(user, 'partner');
    if (dto.show_on_date != null && !isIsoDate(dto.show_on_date)) {
      throw new BadRequestException('invalid date');
    }
    const [note] = (await sql`
      insert into notes (kind, text, show_on_date)
      values (${dto.kind}, ${dto.text}, ${dto.show_on_date ?? null})
      returning id, kind, text, show_on_date::text as show_on_date, created_at
    `) as Note[];
    return { ...note, created_at: new Date(note.created_at).toISOString() };
  }

  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<Note[]> {
    validateDateRange(from, to);
    const horizon = addDays(vnToday(), 7);
    const upper = user.role === 'sleeper' && to > horizon ? horizon : to;
    const notes = (await sql`
      select id, kind, text, show_on_date::text as show_on_date, created_at from notes
      where kind in ('scene', 'word') or (kind = 'goodnight' and show_on_date between ${from}::date and ${upper}::date)
      order by show_on_date nulls last, created_at, id
    `) as Note[];
    return notes.map((note) => ({
      ...note,
      created_at: new Date(note.created_at).toISOString(),
    }));
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    requireRole(user, 'partner');
    const rows = await sql`delete from notes where id = ${id} returning id`;
    if (!rows.length) throw new NotFoundException('not found');
  }
}
