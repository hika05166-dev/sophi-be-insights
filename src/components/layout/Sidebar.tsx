'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BarChart2, Plus, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    const load = () => {
      const stored = JSON.parse(localStorage.getItem('il_search_history') || '[]') as string[]
      setHistory(stored)
    }
    load()
    window.addEventListener('storage', load)
    window.addEventListener('il_history_updated', load)
    return () => {
      window.removeEventListener('storage', load)
      window.removeEventListener('il_history_updated', load)
    }
  }, [pathname])

  const removeHistory = (kw: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const stored = JSON.parse(localStorage.getItem('il_search_history') || '[]') as string[]
    const updated = stored.filter(k => k !== kw)
    localStorage.setItem('il_search_history', JSON.stringify(updated))
    setHistory(updated)
  }

  const currentKeyword = (() => {
    try { return new URLSearchParams(window.location.search).get('q') || '' }
    catch { return '' }
  })()

  return (
    <aside
      className="hidden md:flex flex-col w-56 shrink-0 border-r h-screen sticky top-0"
      style={{ background: 'hsl(var(--sidebar))' }}
    >
      {/* ロゴ */}
      <div className="px-4 py-5 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <Link href="/search" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-foreground flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.8"/>
              <circle cx="8" cy="8" r="2.5" stroke="white" strokeWidth="1.4" strokeDasharray="2 1.5"/>
              <line x1="12" y1="12" x2="16" y2="16" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground leading-tight">Insight Lens</p>
            <p className="text-xs text-muted-foreground leading-tight">ソフィBe</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* 新しい検索ボタン */}
        <button
          onClick={() => router.push('/search')}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors"
        >
          <Plus size={13} />
          新しい検索
        </button>

        {/* クイックアクセス */}
        <div>
          <p className="px-3 mb-1 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">クイックアクセス</p>
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors',
              pathname.startsWith('/dashboard')
                ? 'bg-black/8 text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-black/5'
            )}
          >
            <BarChart2 size={13} />
            キーワード分析
          </Link>
        </div>

        {/* 分析履歴 */}
        {history.length > 0 && (
          <div>
            <p className="px-3 mb-1 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">分析履歴</p>
            <div className="space-y-0.5">
              {history.map(kw => {
                const isActive = pathname.startsWith('/results') && currentKeyword === kw
                return (
                  <Link
                    key={kw}
                    href={`/results?q=${encodeURIComponent(kw)}`}
                    className={cn(
                      'group flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors',
                      isActive
                        ? 'bg-black/8 text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-black/5'
                    )}
                  >
                    <Search size={11} className="shrink-0 opacity-40" />
                    <span className="flex-1 truncate">{kw}</span>
                    <button
                      onClick={e => removeHistory(kw, e)}
                      className="shrink-0 opacity-0 group-hover:opacity-40 hover:!opacity-70 transition-opacity"
                      aria-label="履歴を削除"
                    >
                      <X size={10} />
                    </button>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
        <p className="text-[11px] text-muted-foreground/60">v0.1.0 プロトタイプ</p>
      </div>
    </aside>
  )
}
