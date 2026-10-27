import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { sql } from './db';
import { hashToken } from './token';

export type AuthUser = {
  id: string;
  role: 'sleeper' | 'partner';
  name: string;
  sharing_enabled: boolean;
};
type AuthRequest = Request & { user: AuthUser };

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const match = /^Bearer ([A-Za-z0-9_-]{43})$/i.exec(
      request.headers.authorization ?? '',
    );
    if (!match) throw new UnauthorizedException('unauthorized');
    const [user] = (await sql`
      select id, role, name, sharing_enabled from users where token_hash = ${hashToken(match[1])}
    `) as AuthUser[];
    if (!user) throw new UnauthorizedException('unauthorized');
    request.user = user;
    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser =>
    context.switchToHttp().getRequest<AuthRequest>().user,
);

export function requireRole(user: AuthUser, role: AuthUser['role']): void {
  if (user.role !== role) throw new ForbiddenException('forbidden');
}
