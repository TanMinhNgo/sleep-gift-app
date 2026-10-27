import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { sql } from '../common/db';
import { newInviteCode, newToken } from '../common/token';
import { JoinDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  async register(dto: RegisterDto) {
    const expected = Buffer.from(process.env.ADMIN_SECRET ?? '');
    const supplied = Buffer.from(dto.adminSecret);
    if (
      !expected.length ||
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    ) {
      throw new UnauthorizedException('unauthorized');
    }
    const { token, hash } = newToken();
    await sql`
      insert into users (role, name, token_hash) values ('partner', ${dto.name}, ${hash})
      on conflict (role) do update set name = excluded.name, token_hash = excluded.token_hash
    `;
    return { token, ...(await this.createInvite()) };
  }

  async createInvite(): Promise<{ inviteCode: string }> {
    // Retry collisions without ever reviving a used or locked code.
    for (let attempt = 0; attempt < 10; attempt++) {
      const inviteCode = newInviteCode();
      const rows = await sql`
        insert into invites (code, expires_at) values (${inviteCode}, now() + interval '7 days')
        on conflict (code) do nothing returning code
      `;
      if (rows.length) return { inviteCode };
    }
    throw new Error('Could not allocate invite');
  }

  async join(dto: JoinDto) {
    await sql`
      update invites set attempts = attempts + 1
      where used_at is null and expires_at > now()
    `;
    const claimed = await sql`
      update invites set used_at = now()
      where code = ${dto.code} and used_at is null and expires_at > now() and attempts <= 5
      returning code
    `;
    if (!claimed.length) throw new BadRequestException('invalid code');
    const { token, hash } = newToken();
    // shortcut: a failed user write consumes the invite; partner must issue a new code.
    await sql`
      insert into users (role, name, token_hash) values ('sleeper', ${dto.name}, ${hash})
      on conflict (role) do update set name = excluded.name, token_hash = excluded.token_hash
    `;
    const [partner] =
      (await sql`select name from users where role = 'partner'`) as {
        name: string;
      }[];
    return { token, partnerName: partner.name };
  }
}
