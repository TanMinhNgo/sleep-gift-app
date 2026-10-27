import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard, CurrentUser, requireRole } from '../common/auth.guard';
import type { AuthUser } from '../common/auth.guard';
import { AuthService } from './auth.service';
import {
  InviteResponseDto,
  JoinDto,
  JoinResponseDto,
  RegisterDto,
  RegisterResponseDto,
} from './dto';
import { ErrorResponseDto } from '../common/swagger';

@Controller()
@ApiTags('Auth')
@ApiBadRequestResponse({
  type: ErrorResponseDto,
  description: 'Body không hợp lệ hoặc mã mời không còn dùng được.',
})
@ApiConflictResponse({ type: ErrorResponseDto, description: 'conflict' })
@ApiInternalServerErrorResponse({
  type: ErrorResponseDto,
  description: 'internal',
})
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Đăng ký hoặc khôi phục partner',
    description:
      'Yêu cầu adminSecret. Đăng ký lại thay token cũ; trả token mới và mã mời.',
  })
  @ApiCreatedResponse({ type: RegisterResponseDto })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'ADMIN_SECRET chưa đặt, rỗng hoặc sai: unauthorized.',
  })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('join')
  @ApiOperation({
    summary: 'Sleeper ghép đôi bằng mã mời',
    description:
      'Mã hết hạn sau 7 ngày, dùng một lần. Sau 5 lần đoán sai, các mã đang hiệu lực bị khóa. Ghép lại thay token cũ, giữ nhật ký và quyền chia sẻ.',
  })
  @ApiCreatedResponse({ type: JoinResponseDto })
  join(@Body() dto: JoinDto) {
    return this.auth.join(dto);
  }

  @Post('invites')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Partner tạo mã mời mới' })
  @ApiCreatedResponse({ type: InviteResponseDto })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'unauthorized',
  })
  @ApiForbiddenResponse({
    type: ErrorResponseDto,
    description: 'Chỉ partner: forbidden.',
  })
  createInvite(@CurrentUser() user: AuthUser) {
    requireRole(user, 'partner');
    return this.auth.createInvite();
  }
}
