'use client'

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Sparkles, Users, TrendingUp, MessageCircle, Search } from 'lucide-react'
import SearchBar from '@/components/ui/SearchBar'
import GroupingSummary from '@/components/ui/GroupingSummary'
import UserAttributeFilter from '@/components/ui/UserAttributeFilter'
import UtteranceTable from '@/components/ui/UtteranceTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Utterance, Group } from '@/types'

type FilterType = 'all' | 'detailed' | 'self_solving'
type UserAttribute = 'detailed' | 'self_solving' | 'none'
interface UtteranceWithAttr extends Utterance { attribute?: UserAttribute; matchedQueries?: string[] }

function ResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const keyword = searchParams.get('q') || ''
  const activeFilter = (searchParams.get('filter') || 'all') as FilterType
  const activeGroupIds = searchParams.get('group_ids')?.split(',').map(Number).filter(Boolean) || []
  const activeGroupIdsStr = activeGroupIds.join(',')

  const [utterances, setUtterances] = useState<UtteranceWithAttr[]>([])
  const [total, setTotal] = useState(0)
  const [groups, setGroups] = useState<Group[]>([])
  const [relatedQueries, setRelatedQueries] = useState<string[]>([])
  const [isLoadingUtterances, setIsLoadingUtterances] = useState(false)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [isLoadingRelated, setIsLoadingRelated] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const LIMIT = 20
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const relatedQueriesStr = relatedQueries.join(',')

  const fetchUtterances = useCallback(async (page = 1, related = relatedQueriesStr) => {
    if (!keyword) return
    setIsLoadingUtterances(true)
    try {
      const params = new URLSearchParams({ q: keyword, filter: activeFilter, page: String(page), limit: String(LIMIT) })
      if (activeGroupIds.length > 0) params.set('group_ids', activeGroupIds.join(','))
      if (related) params.set('related', related)
      const res = await fetch(`/api/utterances?${params}`)
      const data = await res.json()
      setUtterances(data.utterances || [])
      setTotal(data.total || 0)
    } catch (err) { console.error(err) }
    finally { setIsLoadingUtterances(false) }
  }, [keyword, activeFilter, activeGroupIdsStr, relatedQueriesStr])

  const fetchRelatedQueries = useCallback(async () => {
    if (!keyword) return
    setIsLoadingRelated(true)
    try {
      const res = await fetch(`/api/related-queries?q=${encodeURIComponent(keyword)}`)
      const data = await res.json()
      const queries: string[] = data.queries || []
      setRelatedQueries(queries)
      // 関連クエリが取得できたら即座に再検索
      await fetchUtterances(1, queries.join(','))
    } catch (err) { console.error(err) }
    finally { setIsLoadingRelated(false) }
  }, [keyword])

  const fetchGroups = useCallback(async () => {
    if (!keyword) return
    setIsLoadingGroups(true)
    try {
      const res = await fetch('/api/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword }) })
      const data = await res.json()
      setGroups(data.groups || [])
    } catch (err) { console.error(err) }
    finally { setIsLoadingGroups(false) }
  }, [keyword])

  useEffect(() => {
    setCurrentPage(1)
    setSelectedIds(new Set())
    setRelatedQueries([])
    // まず元KWで即時検索、その後関連クエリを取得して再検索
    fetchUtterances(1, '')
    fetchRelatedQueries()
    fetchGroups()
    if (keyword) {
      const stored = JSON.parse(localStorage.getItem('il_search_history') || '[]') as string[]
      const updated = [keyword, ...stored.filter(k => k !== keyword)].slice(0, 15)
      localStorage.setItem('il_search_history', JSON.stringify(updated))
      window.dispatchEvent(new Event('il_history_updated'))
    }
  }, [keyword, activeFilter])

  useEffect(() => { setCurrentPage(1); setSelectedIds(new Set()); fetchUtterances(1) }, [activeGroupIdsStr])
  useEffect(() => { fetchUtterances(currentPage) }, [currentPage])

  const setFilter = (filter: FilterType) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('filter', filter); params.delete('group_ids')
    router.push(`/results?${params}`)
  }
  const setGroupFilter = (groupIds: number[]) => {
    const params = new URLSearchParams(searchParams.toString())
    groupIds.length > 0 ? params.set('group_ids', groupIds.join(',')) : params.delete('group_ids')
    router.push(`/results?${params}`)
  }
  const handleSearch = (kw: string) => { if (kw.trim()) router.push(`/results?q=${encodeURIComponent(kw.trim())}`) }
  const goToInsights = () => {
    if (selectedIds.size === 0) return
    router.push(`/insights?ids=${Array.from(selectedIds).join(',')}&q=${encodeURIComponent(keyword)}`)
  }

  const attrStats = useMemo(() => {
    const counts = { detailed: 0, self_solving: 0, none: 0 }
    utterances.forEach(u => { const a = (u.attribute || 'none') as keyof typeof counts; counts[a]++ })
    return counts
  }, [utterances])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-5"><SearchBar defaultValue={keyword} onSearch={handleSearch} /></div>

      {keyword && (
        <>
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">「{keyword}」</span>
              <span className="text-muted-foreground text-sm">の検索結果</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{total}件</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard?q=${encodeURIComponent(keyword)}`)}>
              📊 キーワード分析
            </Button>
          </div>

          {/* 関連クエリ表示 */}
          <div className="mb-4 flex flex-wrap items-center gap-2 min-h-[28px]">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
              <Search size={12} />
              <span>関連クエリも検索中:</span>
            </div>
            {isLoadingRelated ? (
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(i => (
                  <span key={i} className="h-5 w-16 rounded-md bg-muted animate-pulse inline-block" />
                ))}
              </div>
            ) : relatedQueries.length > 0 ? (
              relatedQueries.map(q => (
                <span
                  key={q}
                  className="inline-flex items-center text-xs px-2 py-0.5 rounded-md bg-accent text-accent-foreground border border-border/60"
                >
                  {q}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">生成中...</span>
            )}
          </div>

          {utterances.length > 0 && (
            <Card className="mb-5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={14} className="text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">ユーザー属性の分布</p>
                  <span className="text-xs text-muted-foreground">（このページの{utterances.length}件）</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {[
                    { key: 'detailed', label: '深刻な悩み', icon: MessageCircle },
                    { key: 'self_solving', label: '自己解決型', icon: TrendingUp },
                    { key: 'none', label: 'その他', icon: Users },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center gap-2 px-3 py-2 rounded-md border bg-background flex-1 min-w-[110px]">
                      <Icon size={13} className="text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-semibold text-foreground">
                          {attrStats[key as keyof typeof attrStats]}件
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            ({utterances.length > 0 ? Math.round(attrStats[key as keyof typeof attrStats] / utterances.length * 100) : 0}%)
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex h-1.5 rounded-full overflow-hidden gap-0.5">
                  {attrStats.detailed > 0 && <div className="rounded-full bg-destructive" style={{ width: `${attrStats.detailed / utterances.length * 100}%` }} />}
                  {attrStats.self_solving > 0 && <div className="rounded-full bg-primary/60" style={{ width: `${attrStats.self_solving / utterances.length * 100}%` }} />}
                  {attrStats.none > 0 && <div className="rounded-full bg-muted" style={{ width: `${attrStats.none / utterances.length * 100}%` }} />}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-1 space-y-4">
              <GroupingSummary groups={groups} isLoading={isLoadingGroups} activeGroupIds={activeGroupIds} onGroupSelect={setGroupFilter} />
              <UserAttributeFilter activeFilter={activeFilter} onFilterChange={setFilter} />
            </div>
            <div className="lg:col-span-2 space-y-3">
              {selectedIds.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border bg-card animate-fade-in">
                  <span className="text-sm text-foreground">
                    <span className="font-semibold">{selectedIds.size}件</span>の発話を選択中
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>選択解除</Button>
                    <Button size="sm" onClick={goToInsights}>
                      <Sparkles size={13} className="mr-1.5" />インサイトを生成
                    </Button>
                  </div>
                </div>
              )}
              <UtteranceTable
                utterances={utterances} isLoading={isLoadingUtterances} total={total}
                currentPage={currentPage} limit={LIMIT} onPageChange={setCurrentPage}
                keyword={keyword} relatedQueries={relatedQueries}
                selectedIds={selectedIds} onSelectionChange={setSelectedIds}
              />
            </div>
          </div>
        </>
      )}

      {!keyword && (
        <div className="text-center py-20 text-muted-foreground">
          <p>キーワードを入力して検索してください</p>
        </div>
      )}
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center py-20"><div className="loading-spinner" /></div>}>
      <ResultsContent />
    </Suspense>
  )
}
