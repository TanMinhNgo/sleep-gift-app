import 'dotenv/config';
import { Pool } from '@neondatabase/serverless';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function migrate(connectionString: string): Promise<void> {
  const pool = new Pool({ connectionString });
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(73102625)');
      await client.query(
        'CREATE TABLE IF NOT EXISTS schema_migrations (name text primary key)',
      );
      const directory = join(__dirname, '..', 'migrations');
      for (const name of (await readdir(directory))
        .filter((name) => name.endsWith('.sql'))
        .sort()) {
        const applied = await client.query(
          'SELECT name FROM schema_migrations WHERE name = $1',
          [name],
        );
        if (applied.rowCount) continue;
        await client.query(await readFile(join(directory, name), 'utf8'));
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
          name,
        ]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  void migrate(url)
    .then(() => console.log('Migrations applied'))
    .catch(() => {
      console.error('Migration failed; database transaction rolled back');
      process.exitCode = 1;
    });
}
