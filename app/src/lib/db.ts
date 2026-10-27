import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('sleep.db');

// Chỉ thêm vào cuối mảng; chỉ số = phiên bản schema (PRAGMA user_version).
const MIGRATIONS: string[] = ['create table settings (key text primary key, value text not null)'];

export function migrate() {
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  const from = row?.user_version ?? 0;
  if (from >= MIGRATIONS.length) return;
  db.withTransactionSync(() => {
    for (const sql of MIGRATIONS.slice(from)) db.execSync(sql);
    db.execSync(`PRAGMA user_version = ${MIGRATIONS.length}`);
  });
}
