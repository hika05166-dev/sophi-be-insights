'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { LogOut, Menu, X, Home, Search, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HeaderProps {
  user?: { name?: string | null; email?: string | null } | null
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
    <header className="bg-background border-b sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
          <span className="font-semibold text-foreground text-sm">Insight Lens</span>
        </div>
        <div className="hidden md:block" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name || user?.email}</span>
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/login' })} className="text-muted-foreground">
            <LogOut size={14} className="mr-1" />
            <span className="hidden sm:inline">ログアウト</span>
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-background px-2 py-2 space-y-0.5">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </header>
  )
}
