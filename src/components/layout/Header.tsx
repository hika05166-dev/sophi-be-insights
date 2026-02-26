'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LogOut, Menu, X, Home, Search, BarChart2 } from 'lucide-react'

interface HeaderProps {
  user?: {
    name?: string | null
    email?: string | null
  } | null
}

const NAV_ITEMS = [
  { href: '/search', icon: Home, label: '検索トップ' },
  { href: '/results', icon: Search, label: '発話検索' },
  { href: '/dashboard', icon: BarChart2, label: 'キーワード分析' },
]

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-pink-100 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 h-14">
        {/* モバイル: ロゴ + ハンバーガー */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-pink-50"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-bold text-gray-800 text-sm">インサイトツール</span>
        </div>

        {/* デスクトップ: ページタイトル */}
        <div className="hidden md:block" />

        {/* ユーザー情報 + ログアウト */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:inline">
            {user?.name || user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">ログアウト</span>
          </button>
        </div>
      </div>

      {/* モバイルメニュー */}
      {menuOpen && (
        <div className="md:hidden border-t border-pink-50 bg-white px-3 py-2 space-y-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'text-white' : 'text-gray-600 hover:bg-pink-50'
                }`}
                style={isActive ? { background: 'linear-gradient(135deg, #ff6b9d, #c084fc)' } : {}}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
