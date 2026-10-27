import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
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
import { isIsoDate, validateDateRange } from '../common/dates';
import { AppliedResponseDto, LogDto, LogResponseDto } from './dto';
import { ErrorResponseDto } from '../common/swagger';
import { LogsService } from './logs.service';

@Controller('logs')
@UseGuards(AuthGuard)
@ApiTags('Logs')
@ApiBearerAuth()
@ApiBadRequestResponse({
  type: ErrorResponseDto,
  description: 'invalid date, invalid data hoặc body sai validation.',
})
@ApiUnauthorizedResponse({
  type: ErrorResponseDto,
  description: 'unauthorized',
})
@ApiForbiddenResponse({
  type: ErrorResponseDto,
  description: 'forbidden hoặc sharing disabled.',
})
@ApiInternalServerErrorResponse({
  type: ErrorResponseDto,
  description: 'internal',
})
export class LogsController {
  constructor(private readonly logs: LogsService) {}

  @Put(':date')
  @ApiOperation({
    summary: 'Sleeper tạo/cập nhật nhật ký theo ngày thức dậy',
    description:
      'Chỉ ghi đè nếu updated_at mới hơn bản server. Bằng hoặc cũ hơn trả applied:false. PUT bỏ note sẽ xóa note.',
  })
  @ApiParam({
    name: 'date',
    type: String,
    format: 'date',
    example: '2026-10-25',
  })
  @ApiOkResponse({ type: AppliedResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'conflict' })
  async upsert(
    @CurrentUser() user: AuthUser,
    @Param('date') date: string,
    @Body() dto: LogDto,
  ) {
    requireRole(user, 'sleeper');
    if (!isIsoDate(date)) throw new BadRequestException('invalid date');
    return { applied: await this.logs.upsert(user.id, date, dto) };
  }

  @Get()
  @ApiOperation({
    summary: 'Đọc nhật ký theo khoảng ngày',
    description:
      'Sleeper đọc của mình; partner chỉ đọc khi sleeper bật chia sẻ. Tính cả hai đầu, tối đa 366 ngày lịch. Trả ngày tăng dần, timestamps ISO UTC.',
  })
  @ApiQuery({
    name: 'from',
    type: String,
    format: 'date',
    required: true,
    example: '2026-10-01',
  })
  @ApiQuery({
    name: 'to',
    type: String,
    format: 'date',
    required: true,
    example: '2026-10-31',
  })
  @ApiOkResponse({ type: LogResponseDto, isArray: true })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'no sleeper yet',
  })
  list(
    @CurrentUser() user: AuthUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    validateDateRange(from, to);
    return this.logs.list(user, from, to);
  }
}
