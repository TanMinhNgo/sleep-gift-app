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
import { AuthGuard, CurrentUser, requireRole } from '../common/auth.guard';
import type { AuthUser } from '../common/auth.guard';
import { isIsoDate, validateDateRange } from '../common/dates';
import { LogDto } from './dto';
import { LogsService } from './logs.service';

@Controller('logs')
@UseGuards(AuthGuard)
export class LogsController {
  constructor(private readonly logs: LogsService) {}

  @Put(':date')
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
  list(
    @CurrentUser() user: AuthUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    validateDateRange(from, to);
    return this.logs.list(user, from, to);
  }
}
