'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { Utterance, UserAttribute } from '@/types'

interface UtteranceTableProps {
  utterances: (Utterance & { attribute?: UserAttribute })[]
  isLoading: boolean
  total: number
  currentPage: number
  limit: number
  onPageChange: (page: number) => void
  keyword: string
  selectedIds?: Set<number>
  onSelectionChange?: (ids: Set<number>) => void
}

function highlightKeyword(text: string, keyword: string): React.ReactNode {
  if (!keyword) return text
  const parts = text.split(new RegExp(`(${keyword})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase()
      ? <mark key={i} className="bg-yellow-100 text-yellow-900 rounded px-0.5">{part}</mark>
      : part
  )
}

export default function UtteranceTable({
  utterances, isLoading, total, currentPage, limit,
  onPageChange, keyword, selectedIds, onSelectionChange,
}: UtteranceTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(total / limit)
  const selectable = selectedIds !== undefined && onSelectionChange !== undefined

  const handleRowClick = (utterance: Utterance) => {
    const q = searchParams.get('q') || keyword
    router.push(`/users/${utterance.anonymous_id}?from=results&q=${encodeURIComponent(q)}`)
  }

  const toggleId = (id: number) => {
    if (!selectable) return
    const next = new Set(selectedIds)
    next.has(id) ? next.delete(id) : next.add(id)
    onSelectionChange!(next)
  }

  const handleSelectAll = () => {
    if (!selectable) return
    const allSelected = utterances.every(u => selectedIds!.has(u.id))
    onSelectionChange!(allSelected ? new Set() : new Set(utterances.map(u => u.id)))
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const allSelected = utterances.length > 0 && selectedIds !== undefined && utterances.every(u => selectedIds.has(u.id))
  const someSelected = selectedIds !== undefined && selectedIds.size > 0

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {selectable && (
            <Checkbox
              checked={allSelected ? true : someSelected ? 'indeterminate' : false}
              onCheckedChange={handleSelectAll}
              aria-label="全選択"
            />
          )}
          <div className="flex items-center gap-1.5">
            <MessageSquare size={14} className="text-muted-foreground" />
            <CardTitle>発話一覧</CardTitle>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {total}件中 {(currentPage - 1) * limit + 1}〜{Math.min(currentPage * limit, total)}件
        </span>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : utterances.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <MessageSquare size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">該当する発話が見つかりませんでした</p>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {utterances.map(utterance => {
                const isSelected = selectedIds?.has(utterance.id) ?? false
                return (
                  <div
                    key={utterance.id}
                    className={`flex items-start gap-3 px-5 py-3 hover:bg-accent/50 transition-colors cursor-pointer ${isSelected ? 'bg-accent/30' : ''}`}
                    onClick={() => handleRowClick(utterance)}
                  >
                    {selectable && (
                      <div onClick={e => { e.stopPropagation(); toggleId(utterance.id) }} className="mt-1">
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleId(utterance.id)} aria-label="選択" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground">{utterance.anonymous_id}</span>
                        {utterance.age_group && <Badge variant="outline">{utterance.age_group}</Badge>}
                        {utterance.cycle_phase && <Badge variant="outline">{utterance.cycle_phase}</Badge>}
                        {utterance.attribute === 'detailed' && <Badge variant="destructive">深刻な悩み</Badge>}
                        {utterance.attribute === 'self_solving' && <Badge variant="secondary">自己解決型</Badge>}
                      </div>
                      <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                        {highlightKeyword(utterance.content, keyword)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(utterance.created_at)}</p>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground shrink-0 mt-2" />
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="px-5 py-3 border-t flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                  <ChevronLeft size={14} className="mr-1" />前へ
                </Button>
                <span className="text-xs text-muted-foreground">{currentPage} / {totalPages}</span>
                <Button variant="ghost" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                  次へ<ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
