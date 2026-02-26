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
    // results ページ遷移後に更新するため、popstate/pushstate も監視
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
    try {
      const params = new URLSearchParams(window.location.search)
      return params.get('q') || ''
    } catch { return '' }
  })()

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-card border-r h-screen sticky top-0">
      {/* ロゴ */}
      <div className="px-4 py-5 border-b">
        <Link href="/search" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <circle cx="8" cy="8" r="5.5" stroke="white" strokeWidth="1.8"/>
              <circle cx="8" cy="8" r="2.5" stroke="white" strokeWidth="1.4" strokeDasharray="2 1.5"/>
              <line x1="12" y1="12" x2="16" y2="16" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">Insight Lens</p>
            <p className="text-xs text-muted-foreground leading-tight">ソフィBe</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* 新しい検索ボタン */}
        <button
          onClick={() => router.push('/search')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-dashed text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-accent transition-colors"
        >
          <Plus size={14} />
          新しい検索
        </button>

        {/* ショートカット：キーワード分析 */}
        <div>
          <p className="px-3 mb-1 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">クイックアクセス</p>
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === '/dashboard' || pathname.startsWith('/dashboard')
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <BarChart2 size={14} />
            キーワード分析
          </Link>
        </div>

        {/* 分析履歴 */}
        {history.length > 0 && (
          <div>
            <p className="px-3 mb-1 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">分析履歴</p>
            <div className="space-y-0.5">
              {history.map(kw => {
                const isActive = pathname.startsWith('/results') && currentKeyword === kw
                return (
                  <Link
                    key={kw}
                    href={`/results?q=${encodeURIComponent(kw)}`}
                    className={cn(
                      'group flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Search size={12} className="shrink-0 opacity-50" />
                    <span className="flex-1 truncate">{kw}</span>
                    <button
                      onClick={e => removeHistory(kw, e)}
                      className="shrink-0 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                      aria-label="履歴を削除"
                    >
                      <X size={11} />
                    </button>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t">
        <p className="text-xs text-muted-foreground">v0.1.0 プロトタイプ</p>
      </div>
    </aside>
  )
}
