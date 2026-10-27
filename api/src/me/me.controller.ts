import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, requireRole } from '../common/auth.guard';
import type { AuthUser } from '../common/auth.guard';
import { sql } from '../common/db';
import { UpdateMeDto } from './dto';

@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  @Get()
  async get(@CurrentUser() user: AuthUser) {
    const [other] = (await sql`
      select name, sharing_enabled from users where role <> ${user.role}
    `) as { name: string; sharing_enabled: boolean }[];
    return {
      role: user.role,
      name: user.name,
      sharing_enabled: user.sharing_enabled,
      other: other ?? null,
    };
  }

  @Patch()
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    if (dto.sharing_enabled !== undefined) requireRole(user, 'sleeper');
    const [updated] = (await sql`
      update users set name = coalesce(${dto.name ?? null}, name),
        sharing_enabled = coalesce(${dto.sharing_enabled ?? null}, sharing_enabled)
      where id = ${user.id} returning id, role, name, sharing_enabled
    `) as AuthUser[];
    return this.get(updated);
  }
}
