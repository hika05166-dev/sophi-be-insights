'use client'

import { Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

type FilterType = 'all' | 'detailed' | 'self_solving'

interface UserAttributeFilterProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

const FILTERS: { value: FilterType; label: string; description: string }[] = [
  { value: 'all', label: 'すべて', description: '全ての発話を表示' },
  { value: 'detailed', label: '深刻な悩み', description: '長文で深刻な悩みを相談しているユーザー' },
  { value: 'self_solving', label: '自己解決型', description: '対処法を自分なりに実践・共有しているユーザー' },
]

export default function UserAttributeFilter({ activeFilter, onFilterChange }: UserAttributeFilterProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-muted-foreground" />
          <CardTitle>属性フィルター</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {FILTERS.map(filter => {
          const isActive = activeFilter === filter.value
          return (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                'w-full text-left p-3 rounded-md border text-sm transition-colors hover:bg-accent',
                isActive ? 'bg-accent border-border font-medium' : 'bg-background border-border/50'
              )}
            >
              <p className="text-foreground font-medium text-xs">{filter.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{filter.description}</p>
            </button>
          )
        })}
        <p className="text-xs text-muted-foreground pt-1">※ AI + ヒューリスティックで自動判定</p>
      </CardContent>
    </Card>
  )
}
