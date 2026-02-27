'use client'

import { Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

type FilterType = 'all' | 'detailed' | 'self_solving'

interface UserAttributeFilterProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'detailed', label: '深刻な悩み' },
  { value: 'self_solving', label: '自己解決型' },
]

export default function UserAttributeFilter({ activeFilter, onFilterChange }: UserAttributeFilterProps) {
  return (
    <Card>
      <CardHeader className="px-3 py-2 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-muted-foreground" />
          <CardTitle className="text-xs font-semibold">属性フィルター</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-2 space-y-1">
        {FILTERS.map(filter => {
          const isActive = activeFilter === filter.value
          return (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                'w-full text-left px-2 py-1.5 rounded border text-xs transition-colors hover:bg-accent',
                isActive ? 'bg-accent border-border font-semibold' : 'bg-background border-border/50'
              )}
            >
              {filter.label}
            </button>
          )
        })}
        <p className="text-[10px] text-muted-foreground pt-0.5">※ AI + ヒューリスティックで自動判定</p>
      </CardContent>
    </Card>
  )
}
