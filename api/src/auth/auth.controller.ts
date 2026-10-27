import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard, CurrentUser, requireRole } from '../common/auth.guard';
import type { AuthUser } from '../common/auth.guard';
import { AuthService } from './auth.service';
import { JoinDto, RegisterDto } from './dto';

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('join')
  join(@Body() dto: JoinDto) {
    return this.auth.join(dto);
  }

  @Post('invites')
  @UseGuards(AuthGuard)
  createInvite(@CurrentUser() user: AuthUser) {
    requireRole(user, 'partner');
    return this.auth.createInvite();
  }
}
