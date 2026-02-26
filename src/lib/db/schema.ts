import { getDb } from './index'

export function initSchema(): void {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anonymous_id TEXT UNIQUE NOT NULL,
      age_group TEXT NOT NULL,
      mode TEXT NOT NULL,
      cycle_phase TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS utterances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS search_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      searched_by TEXT NOT NULL,
      searched_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_utterances_user_id ON utterances(user_id);
    CREATE INDEX IF NOT EXISTS idx_utterances_session_id ON utterances(session_id);
    CREATE INDEX IF NOT EXISTS idx_utterances_content ON utterances(content);
    CREATE INDEX IF NOT EXISTS idx_search_logs_keyword ON search_logs(keyword);
  `)
}

export function isSeeded(): boolean {
  const db = getDb()
  const row = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  return row.count > 0
}
