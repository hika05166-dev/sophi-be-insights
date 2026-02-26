'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { Sparkles, Users, TrendingUp, MessageCircle } from 'lucide-react'
import SearchBar from '@/components/ui/SearchBar'
import GroupingSummary from '@/components/ui/GroupingSummary'
import UserAttributeFilter from '@/components/ui/UserAttributeFilter'
import UtteranceTable from '@/components/ui/UtteranceTable'
import type { Utterance, Group } from '@/types'

type FilterType = 'all' | 'detailed' | 'self_solving'
type UserAttribute = 'detailed' | 'self_solving' | 'none'

interface UtteranceWithAttr extends Utterance {
  attribute?: UserAttribute
}

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
  const [isLoadingUtterances, setIsLoadingUtterances] = useState(false)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const LIMIT = 20

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const fetchUtterances = useCallback(async (page = 1) => {
    if (!keyword) return
    setIsLoadingUtterances(true)
    try {
      const params = new URLSearchParams({
        q: keyword,
        filter: activeFilter,
        page: String(page),
        limit: String(LIMIT),
      })
      if (activeGroupIds.length > 0) {
        params.set('group_ids', activeGroupIds.join(','))
      }
      const res = await fetch(`/api/utterances?${params}`)
      const data = await res.json()
      setUtterances(data.utterances || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingUtterances(false)
    }
  }, [keyword, activeFilter, activeGroupIdsStr])

  const fetchGroups = useCallback(async () => {
    if (!keyword) return
    setIsLoadingGroups(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      })
      const data = await res.json()
      setGroups(data.groups || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingGroups(false)
    }
  }, [keyword])

  // キーワード/属性フィルター変更時: 発話とグループを再取得
  useEffect(() => {
    setCurrentPage(1)
    setSelectedIds(new Set())
    fetchUtterances(1)
    fetchGroups()
  }, [keyword, activeFilter])

  // グループフィルター変更時: 発話のみ再取得
  useEffect(() => {
    setCurrentPage(1)
    setSelectedIds(new Set())
    fetchUtterances(1)
  }, [activeGroupIdsStr])

  useEffect(() => {
    fetchUtterances(currentPage)
  }, [currentPage])

  const setFilter = (filter: FilterType) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('filter', filter)
    params.delete('group_ids')
    router.push(`/results?${params}`)
  }

  const setGroupFilter = (groupIds: number[]) => {
    const params = new URLSearchParams(searchParams.toString())
    if (groupIds.length > 0) {
      params.set('group_ids', groupIds.join(','))
    } else {
      params.delete('group_ids')
    }
    router.push(`/results?${params}`)
  }

  const handleSearch = (kw: string) => {
    if (kw.trim()) {
      router.push(`/results?q=${encodeURIComponent(kw.trim())}`)
    }
  }

  // インサイトページへ遷移
  const goToInsights = () => {
    if (selectedIds.size === 0) return
    const ids = Array.from(selectedIds).join(',')
    router.push(`/insights?ids=${ids}&q=${encodeURIComponent(keyword)}`)
  }

  // ユーザー属性統計（現在ページの発話から集計）
  const attrStats = useMemo(() => {
    const counts = { detailed: 0, self_solving: 0, none: 0 }
    utterances.forEach(u => {
      const attr = u.attribute || 'none'
      counts[attr] = (counts[attr] || 0) + 1
    })
    return counts
  }, [utterances])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 検索バー */}
      <div className="mb-6">
        <SearchBar defaultValue={keyword} onSearch={handleSearch} />
      </div>

      {keyword && (
        <>
          {/* 件数 + ダッシュボードリンク */}
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-semibold text-gray-700">「{keyword}」</span>
              <span className="text-gray-500 ml-1">の検索結果</span>
              <span className="ml-2 text-sm font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255, 107, 157, 0.12)', color: '#ff6b9d' }}>
                {total}件
              </span>
            </div>
            <button
              onClick={() => router.push(`/dashboard?q=${encodeURIComponent(keyword)}`)}
              className="text-sm px-4 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: 'linear-gradient(135deg, #ff6b9d22, #c084fc22)',
                color: '#9333ea',
                border: '1px solid #c084fc44',
              }}
            >
              📊 キーワード分析を見る
            </button>
          </div>

          {/* ユーザー属性統計バー */}
          {utterances.length > 0 && (
            <div className="mb-5 bg-white rounded-2xl shadow-sm border border-pink-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={15} style={{ color: '#ff6b9d' }} />
                <h3 className="text-sm font-semibold text-gray-700">ユーザー属性の分布</h3>
                <span className="text-xs text-gray-400">（このページの{utterances.length}件）</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {/* 深刻な悩み */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[120px]"
                  style={{ background: 'rgba(255, 107, 157, 0.07)', border: '1px solid rgba(255, 107, 157, 0.2)' }}>
                  <MessageCircle size={14} style={{ color: '#ff6b9d' }} />
                  <div>
                    <p className="text-xs text-gray-500">深刻な悩み</p>
                    <p className="text-sm font-bold" style={{ color: '#e8005a' }}>
                      {attrStats.detailed}件
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        ({utterances.length > 0 ? Math.round(attrStats.detailed / utterances.length * 100) : 0}%)
                      </span>
                    </p>
                  </div>
                </div>
                {/* 自己解決型 */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[120px]"
                  style={{ background: 'rgba(192, 132, 252, 0.07)', border: '1px solid rgba(192, 132, 252, 0.2)' }}>
                  <TrendingUp size={14} style={{ color: '#c084fc' }} />
                  <div>
                    <p className="text-xs text-gray-500">自己解決型</p>
                    <p className="text-sm font-bold" style={{ color: '#7700e8' }}>
                      {attrStats.self_solving}件
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        ({utterances.length > 0 ? Math.round(attrStats.self_solving / utterances.length * 100) : 0}%)
                      </span>
                    </p>
                  </div>
                </div>
                {/* その他 */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[120px]"
                  style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <Users size={14} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">その他</p>
                    <p className="text-sm font-bold text-gray-600">
                      {attrStats.none}件
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        ({utterances.length > 0 ? Math.round(attrStats.none / utterances.length * 100) : 0}%)
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              {/* 比率バー */}
              {utterances.length > 0 && (
                <div className="mt-3 flex h-2 rounded-full overflow-hidden gap-0.5">
                  {attrStats.detailed > 0 && (
                    <div
                      className="rounded-full"
                      style={{
                        width: `${attrStats.detailed / utterances.length * 100}%`,
                        background: 'linear-gradient(90deg, #ff6b9d, #ff8fb3)',
                      }}
                    />
                  )}
                  {attrStats.self_solving > 0 && (
                    <div
                      className="rounded-full"
                      style={{
                        width: `${attrStats.self_solving / utterances.length * 100}%`,
                        background: 'linear-gradient(90deg, #c084fc, #d8b4fe)',
                      }}
                    />
                  )}
                  {attrStats.none > 0 && (
                    <div
                      className="rounded-full"
                      style={{
                        width: `${attrStats.none / utterances.length * 100}%`,
                        background: '#e5e7eb',
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              {/* グルーピングサマリー */}
              <GroupingSummary
                groups={groups}
                isLoading={isLoadingGroups}
                activeGroupIds={activeGroupIds}
                onGroupSelect={setGroupFilter}
              />

              {/* 属性フィルター */}
              <UserAttributeFilter
                activeFilter={activeFilter}
                onFilterChange={setFilter}
              />
            </div>

            <div className="lg:col-span-2 space-y-3">
              {/* 発話選択時のインサイト生成ボタン */}
              {selectedIds.size > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 rounded-xl animate-fade-in"
                  style={{ background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.08), rgba(192, 132, 252, 0.08))', border: '1px solid rgba(255, 107, 157, 0.2)' }}>
                  <span className="text-sm text-gray-600">
                    <span className="font-semibold" style={{ color: '#ff6b9d' }}>{selectedIds.size}件</span>の発話を選択中
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      選択解除
                    </button>
                    <button
                      onClick={goToInsights}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #ff6b9d, #c084fc)',
                        boxShadow: '0 4px 12px rgba(255, 107, 157, 0.3)',
                      }}
                    >
                      <Sparkles size={14} />
                      インサイトを生成
                    </button>
                  </div>
                </div>
              )}

              {/* 発話一覧 */}
              <UtteranceTable
                utterances={utterances}
                isLoading={isLoadingUtterances}
                total={total}
                currentPage={currentPage}
                limit={LIMIT}
                onPageChange={setCurrentPage}
                keyword={keyword}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            </div>
          </div>
        </>
      )}

      {!keyword && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">キーワードを入力して検索してください</p>
        </div>
      )}
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <div className="loading-spinner" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}
