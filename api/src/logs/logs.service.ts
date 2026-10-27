import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../common/auth.guard';
import { sql } from '../common/db';
import { LogDto } from './dto';

export type Log = Omit<LogDto, 'note'> & { date: string; note: string | null };
type LogRow = Omit<Log, 'date'> & {
  date: string | null;
  sharing_enabled: boolean;
};

@Injectable()
export class LogsService {
  async upsert(userId: string, date: string, dto: LogDto): Promise<boolean> {
    const rows = await sql`
      insert into sleep_logs (user_id, date, bed_time, wake_time, latency_min, awakenings, awake_min, rating, note, updated_at)
      values (${userId}, ${date}, ${dto.bed_time}, ${dto.wake_time}, ${dto.latency_min}, ${dto.awakenings}, ${dto.awake_min}, ${dto.rating}, ${dto.note ?? null}, ${dto.updated_at})
      on conflict (user_id, date) do update set
        bed_time = excluded.bed_time, wake_time = excluded.wake_time,
        latency_min = excluded.latency_min, awakenings = excluded.awakenings,
        awake_min = excluded.awake_min, rating = excluded.rating,
        note = excluded.note, updated_at = excluded.updated_at
      where sleep_logs.updated_at < excluded.updated_at
      returning 1
    `;
    return rows.length > 0;
  }

  async list(user: AuthUser, from: string, to: string): Promise<Log[]> {
    // Read consent and logs in one database snapshot, including an empty range.
    const rows = (await sql`
      select u.sharing_enabled, l.date::text as date, l.bed_time, l.wake_time,
        l.latency_min, l.awakenings, l.awake_min, l.rating, l.note, l.updated_at
      from users u left join sleep_logs l on l.user_id = u.id
        and l.date between ${from}::date and ${to}::date
        and (${user.role} = 'sleeper' or u.sharing_enabled)
      where u.role = 'sleeper' and (${user.role} = 'partner' or u.id = ${user.id}::uuid)
      order by l.date
    `) as LogRow[];
    if (!rows.length) throw new NotFoundException('no sleeper yet');
    if (user.role === 'partner' && !rows[0].sharing_enabled) {
      throw new ForbiddenException('sharing disabled');
    }
    return rows.flatMap((row) =>
      row.date === null
        ? []
        : [
            {
              date: row.date,
              bed_time: new Date(row.bed_time).toISOString(),
              wake_time: new Date(row.wake_time).toISOString(),
              latency_min: row.latency_min,
              awakenings: row.awakenings,
              awake_min: row.awake_min,
              rating: row.rating,
              note: row.note,
              updated_at: new Date(row.updated_at).toISOString(),
            },
          ],
    );
  }
}
