import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

export const sql = postgres(process.env.DATABASE_URL, {
  // On Railway, SSL is required; locally it can be disabled
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  // Auto-convert snake_case columns to camelCase in result objects
  transform: postgres.camel,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30,
})

// ─── Schema init ─────────────────────────────────────────────────────────────

export async function initDb(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id              TEXT PRIMARY KEY,
      first_name      TEXT NOT NULL,
      last_name       TEXT NOT NULL,
      email           TEXT UNIQUE NOT NULL,
      password        TEXT NOT NULL,
      municipality    TEXT NOT NULL,
      consultant_id   TEXT NOT NULL DEFAULT 'c1',
      questionnaire_data JSONB,
      status          TEXT NOT NULL DEFAULT 'new',
      admin_note      TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token       TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  console.log('Database schema ready')
}
