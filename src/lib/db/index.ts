import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

function getDbPath(): string {
  const dbDir = path.join(process.cwd(), '.data')
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }
  return path.join(dbDir, 'sophi-be.db')
}

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(getDbPath())
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}
