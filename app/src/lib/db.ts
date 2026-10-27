import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('sleep.db');

// Chỉ thêm vào cuối mảng; chỉ số = phiên bản schema (PRAGMA user_version).
const MIGRATIONS: string[] = [
  'create table settings (key text primary key, value text not null)',
  `create table logs (date text primary key, bed_time text not null, wake_time text not null,
     latency_min int not null, awakenings int not null, awake_min int not null, rating int not null,
     note text, updated_at text not null, dirty int not null default 1);
   create table notes (id text primary key, kind text not null, text text not null, show_on_date text);
   create table brain_dump (date text primary key, text text not null);`,
];

export function migrate() {
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const from = row?.user_version ?? 0;
  if (from >= MIGRATIONS.length) return;
  db.withTransactionSync(() => {
    for (const sql of MIGRATIONS.slice(from)) db.execSync(sql);
    db.execSync(`PRAGMA user_version = ${MIGRATIONS.length}`);
  });
}
