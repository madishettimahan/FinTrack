import EmbeddedPostgres from 'embedded-postgres';
import path from 'path';

const dbDir = path.resolve(process.cwd(), '.embedded-pg-data');

async function start() {
  console.log('[DB-Runner] Starting local PostgreSQL server on port 5432...');
  const pg = new EmbeddedPostgres({
    databaseDir: dbDir,
    port: 5432,
    user: 'postgres',
    password: 'password',
    initialDatabase: 'personal_finance',
  });

  // Data dir already exists from a previous init — just start the server
  await pg.start();
  console.log('[DB-Runner] PostgreSQL is ready and listening on port 5432! Database: personal_finance');
}

start().catch((err) => {
  console.error('[DB-Runner Error]:', err);
});
