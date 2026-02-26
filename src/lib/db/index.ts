// In-memory database implementation for Vercel serverless compatibility
// Replaces better-sqlite3 (native module that cannot be compiled on Vercel)

interface User {
  id: number
  anonymous_id: string
  age_group: string
  mode: string
  cycle_phase: string
  created_at: string
}

interface Utterance {
  id: number
  user_id: number
  session_id: string
  role: string
  content: string
  created_at: string
}

interface SearchLog {
  id: number
  keyword: string
  searched_by: string
  searched_at: string
}

interface Store {
  users: User[]
  utterances: Utterance[]
  searchLogs: SearchLog[]
  userIdCounter: number
  utteranceIdCounter: number
  searchLogIdCounter: number
}

export const store: Store = {
  users: [],
  utterances: [],
  searchLogs: [],
  userIdCounter: 0,
  utteranceIdCounter: 0,
  searchLogIdCounter: 0,
}

function likeMatch(value: string, pattern: string): boolean {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regexStr = escaped.replace(/%/g, '.*').replace(/_/g, '.')
  return new RegExp('^' + regexStr + '$', 'i').test(value)
}

function executeSelect(sql: string, params: any[]): any[] {
  const s = sql.replace(/\s+/g, ' ').trim()

  // SELECT COUNT(*) as count FROM users
  if (/^SELECT COUNT\(\*\) as count FROM users$/i.test(s)) {
    return [{ count: store.users.length }]
  }

  // SELECT * FROM users WHERE anonymous_id = ?
  if (/SELECT \* FROM users WHERE anonymous_id = \?/i.test(s)) {
    const user = store.users.find(u => u.anonymous_id === params[0])
    return user ? [user] : []
  }

  // SELECT age_group, COUNT(*) as count FROM users WHERE id IN (...) GROUP BY age_group
  if (/SELECT age_group, COUNT\(\*\) as count FROM users WHERE id IN \([\?,\s]+\) GROUP BY age_group/i.test(s)) {
    const ids = params as number[]
    const groups: Record<string, number> = {}
    for (const u of store.users.filter(u => ids.includes(u.id))) {
      groups[u.age_group] = (groups[u.age_group] || 0) + 1
    }
    return Object.entries(groups).map(([age_group, count]) => ({ age_group, count }))
  }

  // SELECT mode, COUNT(*) as count FROM users WHERE id IN (...) GROUP BY mode
  if (/SELECT mode, COUNT\(\*\) as count FROM users WHERE id IN \([\?,\s]+\) GROUP BY mode/i.test(s)) {
    const ids = params as number[]
    const groups: Record<string, number> = {}
    for (const u of store.users.filter(u => ids.includes(u.id))) {
      groups[u.mode] = (groups[u.mode] || 0) + 1
    }
    return Object.entries(groups).map(([mode, count]) => ({ mode, count }))
  }

  // SELECT id FROM users WHERE id IN (...) AND cycle_phase = ?
  if (/SELECT id FROM users WHERE id IN \([\?,\s]+\) AND cycle_phase = \?/i.test(s)) {
    const phase = params[params.length - 1] as string
    const ids = params.slice(0, params.length - 1) as number[]
    return store.users
      .filter(u => ids.includes(u.id) && u.cycle_phase === phase)
      .map(u => ({ id: u.id }))
  }

  // SELECT DISTINCT u.user_id, u.created_at FROM utterances u WHERE u.role = 'user' AND u.content LIKE ?
  if (/SELECT DISTINCT u\.user_id, u\.created_at FROM utterances u WHERE u\.role = 'user' AND u\.content LIKE \?/i.test(s)) {
    const pattern = params[0] as string
    const seen = new Set<number>()
    const result: { user_id: number; created_at: string }[] = []
    for (const u of store.utterances) {
      if (u.role === 'user' && likeMatch(u.content, pattern) && !seen.has(u.user_id)) {
        seen.add(u.user_id)
        result.push({ user_id: u.user_id, created_at: u.created_at })
      }
    }
    return result
  }

  // SELECT created_at FROM utterances WHERE user_id IN (...) AND role = 'user' AND content LIKE ?
  if (/SELECT created_at FROM utterances\s+WHERE user_id IN \([\?,\s]+\) AND role = 'user' AND content LIKE \?/i.test(s)) {
    const pattern = params[params.length - 1] as string
    const ids = params.slice(0, params.length - 1) as number[]
    return store.utterances
      .filter(u => ids.includes(u.user_id) && u.role === 'user' && likeMatch(u.content, pattern))
      .map(u => ({ created_at: u.created_at }))
  }

  // Monthly trend: SELECT substr(created_at, 1, 7) as month, COUNT(*) ...
  if (/SELECT substr\(created_at, 1, 7\) as month/i.test(s)) {
    const pattern = params[0] as string
    const monthCounts: Record<string, number> = {}
    for (const u of store.utterances.filter(u => u.role === 'user' && likeMatch(u.content, pattern))) {
      const month = u.created_at.substring(0, 7)
      monthCounts[month] = (monthCounts[month] || 0) + 1
    }
    return Object.entries(monthCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(0, 12)
      .map(([month, count]) => ({ month, count }))
  }

  // SELECT COUNT(*) as count FROM utterances WHERE role = 'user' AND (conditions)
  if (/^SELECT COUNT\(\*\) as count FROM utterances\s+WHERE role = 'user' AND \(/i.test(s)) {
    const patterns = params as string[]
    const count = store.utterances.filter(u =>
      u.role === 'user' && patterns.some(p => likeMatch(u.content, p))
    ).length
    return [{ count }]
  }

  // SELECT u.*, us.* JOIN utterances with users
  if (/SELECT u\.\*, us\.anonymous_id.*FROM utterances u\s+JOIN users us ON u\.user_id = us\.id/i.test(s)) {
    const hasLimitOffset = /LIMIT \? OFFSET \?/i.test(s)
    let limit = 200
    let offset = 0
    let filterParams: string[] = []

    if (hasLimitOffset && params.length >= 2 &&
        typeof params[params.length - 1] === 'number' &&
        typeof params[params.length - 2] === 'number') {
      offset = params[params.length - 1] as number
      limit = params[params.length - 2] as number
      filterParams = params.slice(0, params.length - 2) as string[]
    } else {
      filterParams = params as string[]
    }

    let filtered = store.utterances.filter(u => {
      if (u.role !== 'user') return false
      if (filterParams.length === 0) return true
      return filterParams.some(p => typeof p === 'string' && likeMatch(u.content, p))
    })

    filtered = filtered.sort((a, b) => b.created_at.localeCompare(a.created_at))
    if (hasLimitOffset) {
      filtered = filtered.slice(offset, offset + limit)
    } else {
      filtered = filtered.slice(0, limit)
    }

    return filtered.map(u => {
      const user = store.users.find(us => us.id === u.user_id)
      return {
        ...u,
        anonymous_id: user?.anonymous_id || '',
        age_group: user?.age_group || '',
        mode: user?.mode || '',
        cycle_phase: user?.cycle_phase || '',
      }
    })
  }

  // SELECT u.id, u.content FROM utterances u WHERE u.role = 'user' AND u.content LIKE ? ORDER BY ... LIMIT 50
  if (/SELECT u\.id, u\.content FROM utterances u\s+WHERE u\.role = 'user' AND u\.content LIKE \?/i.test(s)) {
    const pattern = params[0] as string
    return store.utterances
      .filter(u => u.role === 'user' && likeMatch(u.content, pattern))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 50)
      .map(u => ({ id: u.id, content: u.content }))
  }

  // SELECT id, content FROM utterances WHERE role = 'user' AND content LIKE ? LIMIT 50
  if (/SELECT id, content FROM utterances WHERE role = 'user' AND content LIKE \?/i.test(s)) {
    const pattern = params[0] as string
    return store.utterances
      .filter(u => u.role === 'user' && likeMatch(u.content, pattern))
      .slice(0, 50)
      .map(u => ({ id: u.id, content: u.content }))
  }

  // SELECT content FROM utterances WHERE role = 'user'
  if (/^SELECT content FROM utterances WHERE role = 'user'$/i.test(s)) {
    return store.utterances
      .filter(u => u.role === 'user')
      .map(u => ({ content: u.content }))
  }

  // SELECT keyword, COUNT(*) as count FROM search_logs GROUP BY keyword ORDER BY count DESC LIMIT 10
  if (/SELECT keyword, COUNT\(\*\) as count\s+FROM search_logs/i.test(s)) {
    const groups: Record<string, number> = {}
    for (const log of store.searchLogs) {
      groups[log.keyword] = (groups[log.keyword] || 0) + 1
    }
    return Object.entries(groups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }))
  }

  // SELECT role, content, created_at FROM utterances WHERE user_id = ? AND session_id IN (...)
  if (/SELECT role, content, created_at FROM utterances\s+WHERE user_id = \? AND session_id IN/i.test(s)) {
    const userId = params[0] as number
    const sessionIds = params.slice(1) as string[]
    return store.utterances
      .filter(u => u.user_id === userId && sessionIds.includes(u.session_id))
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(u => ({ role: u.role, content: u.content, created_at: u.created_at }))
  }

  // SELECT role, content, created_at FROM utterances WHERE user_id = ? ORDER BY created_at ASC
  if (/SELECT role, content, created_at FROM utterances\s+WHERE user_id = \?/i.test(s)) {
    const userId = params[0] as number
    return store.utterances
      .filter(u => u.user_id === userId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(u => ({ role: u.role, content: u.content, created_at: u.created_at }))
  }

  // SELECT * FROM utterances WHERE user_id = ? ORDER BY session_id, created_at ASC
  if (/SELECT \* FROM utterances\s+WHERE user_id = \?/i.test(s)) {
    const userId = params[0] as number
    return store.utterances
      .filter(u => u.user_id === userId)
      .sort((a, b) => {
        if (a.session_id !== b.session_id) return a.session_id.localeCompare(b.session_id)
        return a.created_at.localeCompare(b.created_at)
      })
  }

  console.warn('[InMemoryDB] Unhandled SQL:', s.substring(0, 120))
  return []
}

function executeInsert(sql: string, params: any[]): { lastInsertRowid: number } {
  const s = sql.replace(/\s+/g, ' ').trim()

  if (/INSERT INTO users/i.test(s)) {
    const [anonymous_id, age_group, mode, cycle_phase, created_at] = params
    store.userIdCounter++
    store.users.push({ id: store.userIdCounter, anonymous_id, age_group, mode, cycle_phase, created_at })
    return { lastInsertRowid: store.userIdCounter }
  }

  if (/INSERT INTO utterances/i.test(s)) {
    const [user_id, session_id, role, content, created_at] = params
    store.utteranceIdCounter++
    store.utterances.push({ id: store.utteranceIdCounter, user_id, session_id, role, content, created_at })
    return { lastInsertRowid: store.utteranceIdCounter }
  }

  if (/INSERT INTO search_logs/i.test(s)) {
    const [keyword, searched_by, searched_at] = params
    store.searchLogIdCounter++
    store.searchLogs.push({ id: store.searchLogIdCounter, keyword, searched_by, searched_at })
    return { lastInsertRowid: store.searchLogIdCounter }
  }

  return { lastInsertRowid: 0 }
}

class FakeStatement {
  constructor(private sql: string) {}

  all(...args: any[]): any[] {
    return executeSelect(this.sql, args.flat())
  }

  get(...args: any[]): any {
    const results = executeSelect(this.sql, args.flat())
    return results.length > 0 ? results[0] : undefined
  }

  run(...args: any[]): { lastInsertRowid: number } {
    return executeInsert(this.sql, args.flat())
  }
}

class InMemoryDatabase {
  prepare(sql: string) {
    return new FakeStatement(sql)
  }

  exec(_sql: string): void {
    // no-op: CREATE TABLE / CREATE INDEX not needed for in-memory store
  }

  pragma(_pragma: string): void {
    // no-op
  }
}

let dbInstance: InMemoryDatabase | null = null

export function getDb(): InMemoryDatabase {
  if (!dbInstance) {
    dbInstance = new InMemoryDatabase()
  }
  return dbInstance
}
