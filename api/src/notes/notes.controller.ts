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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard, CurrentUser, requireRole } from '../common/auth.guard';
import type { AuthUser } from '../common/auth.guard';
import {
  addDays,
  isIsoDate,
  validateDateRange,
  vnToday,
} from '../common/dates';
import { sql } from '../common/db';
import { NoteDto, NoteResponseDto } from './dto';
import type { Note } from './dto';
import { ErrorResponseDto } from '../common/swagger';

@Controller('notes')
@UseGuards(AuthGuard)
@ApiTags('Notes')
@ApiBearerAuth()
@ApiBadRequestResponse({
  type: ErrorResponseDto,
  description: 'Ngày, ID hoặc body không hợp lệ.',
})
@ApiUnauthorizedResponse({
  type: ErrorResponseDto,
  description: 'unauthorized',
})
@ApiInternalServerErrorResponse({
  type: ErrorResponseDto,
  description: 'internal',
})
export class NotesController {
  @Post()
  @ApiOperation({
    summary: 'Partner tạo lời chúc, khung cảnh hoặc từ gốc',
    description: 'goodnight bắt buộc có show_on_date là ngày có thật.',
  })
  @ApiCreatedResponse({ type: NoteResponseDto })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'Chỉ partner: forbidden.',
  })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'conflict' })
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
  @ApiOperation({
    summary: 'Lấy nội dung để đồng bộ',
    description:
      'Luôn trả mọi scene/word. goodnight nằm trong [from,to]; sleeper chỉ thấy tối đa hôm nay Việt Nam +7 ngày. Tính cả hai đầu, tối đa 366 ngày lịch. Ghi đè cache trong khoảng để phản ánh note đã xóa.',
  })
  @ApiQuery({
    name: 'from',
    type: String,
    format: 'date',
    required: true,
    example: '2026-10-25',
  })
  @ApiQuery({
    name: 'to',
    type: String,
    format: 'date',
    required: true,
    example: '2026-11-01',
  })
  @ApiOkResponse({ type: NoteResponseDto, isArray: true })
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
  @ApiOperation({ summary: 'Partner xóa nội dung' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '64812c15-1220-465c-920a-c23a55b04538',
  })
  @ApiNoContentResponse({ description: 'Đã xóa; không có response body.' })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'Chỉ partner: forbidden.',
  })
  @ApiNotFoundResponse({ type: ErrorResponseDto, description: 'not found' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    requireRole(user, 'partner');
    const rows = await sql`delete from notes where id = ${id} returning id`;
    if (!rows.length) throw new NotFoundException('not found');
  }
}
