import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard, CurrentUser, requireRole } from '../common/auth.guard';
import type { AuthUser } from '../common/auth.guard';
import { sql } from '../common/db';
import { MeResponseDto, UpdateMeDto } from './dto';
import { ErrorResponseDto } from '../common/swagger';

@Controller('me')
@UseGuards(AuthGuard)
@ApiTags('Profile')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  type: ErrorResponseDto,
  description: 'unauthorized',
})
@ApiInternalServerErrorResponse({
  type: ErrorResponseDto,
  description: 'internal',
})
export class MeController {
  @Get()
  @ApiOperation({ summary: 'Lấy hồ sơ và trạng thái ghép đôi' })
  @ApiOkResponse({ type: MeResponseDto })
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
  @ApiOperation({
    summary: 'Đổi tên hoặc quyền chia sẻ của chính mình',
    description:
      'Chỉ sleeper được đổi sharing_enabled, kể cả đổi thành false. Không nhận null hoặc field lạ.',
  })
  @ApiOkResponse({ type: MeResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'Partner đổi sharing_enabled: forbidden.',
  })
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
