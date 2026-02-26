'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Home } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/search', icon: Home, label: '検索トップ' },
  { href: '/dashboard', icon: BarChart2, label: 'キーワード分析' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-pink-100 min-h-screen">
      {/* ロゴ */}
      <div className="px-4 py-5 border-b border-pink-50">
        <Link href="/search" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ff6b9d, #c084fc)' }}>
            <span className="text-white text-sm font-bold">び</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 leading-tight">インサイト</p>
            <p className="text-xs text-gray-400 leading-tight">ソフィBe</p>
          </div>
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '?')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:bg-pink-50 hover:text-pink-600'
              }`}
              style={isActive ? { background: 'linear-gradient(135deg, #ff6b9d, #c084fc)' } : {}}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* バージョン表示 */}
      <div className="px-4 py-3 border-t border-pink-50">
        <p className="text-xs text-gray-400">v0.1.0 プロトタイプ</p>
      </div>
    </aside>
  )
}
