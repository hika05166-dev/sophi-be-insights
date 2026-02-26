'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/search', icon: Home, label: '検索トップ' },
  { href: '/dashboard', icon: BarChart2, label: 'キーワード分析' },
]

export default function Sidebar() {
  const pathname = usePathname()

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

      {/* ナビゲーション */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '?')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-3 border-t">
        <p className="text-xs text-muted-foreground">v0.1.0 プロトタイプ</p>
      </div>
    </aside>
  )
}
