import { config } from 'dotenv';
config({ path: '.env.test', override: true, quiet: true });

if (
  !process.env.DATABASE_URL ||
  process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL
) {
  throw new Error(
    'Set DATABASE_URL and matching TEST_DATABASE_URL in .env.test to a dedicated test branch',
  );
}
