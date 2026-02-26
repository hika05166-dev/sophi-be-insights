'use client'

import { Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Group } from '@/types'

interface GroupingSummaryProps {
  groups: Group[]
  isLoading: boolean
  activeGroupIds: number[]
  onGroupSelect: (ids: number[]) => void
}

export default function GroupingSummary({ groups, isLoading, activeGroupIds, onGroupSelect }: GroupingSummaryProps) {
  const handleClick = (group: Group) => {
    const isActive = activeGroupIds.length > 0 && group.utterance_ids.every(id => activeGroupIds.includes(id))
    onGroupSelect(isActive ? [] : group.utterance_ids)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-muted-foreground" />
          <CardTitle>グルーピング</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)
        ) : groups.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">グループを生成できませんでした</p>
        ) : (
          <>
            {groups.map((group) => {
              const isActive = activeGroupIds.length > 0 && group.utterance_ids.some(id => activeGroupIds.includes(id))
              return (
                <button
                  key={group.id}
                  onClick={() => handleClick(group)}
                  className={cn(
                    'w-full text-left p-3 rounded-md border text-sm transition-colors hover:bg-accent',
                    isActive ? 'bg-accent border-border font-medium' : 'bg-background border-border/50'
                  )}
                >
                  <p className="text-foreground leading-snug line-clamp-2">{group.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {group.count}件{isActive && ' · フィルター中'}
                  </p>
                </button>
              )
            })}
            {activeGroupIds.length > 0 && (
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => onGroupSelect([])}>
                フィルターを解除
              </Button>
            )}
          </>
        )}
        <p className="text-xs text-muted-foreground pt-1">※ AIによる自動分類</p>
      </CardContent>
    </Card>
  )
}
