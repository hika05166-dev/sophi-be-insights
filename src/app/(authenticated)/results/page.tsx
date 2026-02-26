'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { Sparkles, X, AlertCircle, Lightbulb, TrendingUp } from 'lucide-react'
import SearchBar from '@/components/ui/SearchBar'
import GroupingSummary from '@/components/ui/GroupingSummary'
import UserAttributeFilter from '@/components/ui/UserAttributeFilter'
import UtteranceTable from '@/components/ui/UtteranceTable'
import type { Utterance, Group, Insight } from '@/types'

type FilterType = 'all' | 'detailed' | 'self_solving'

function ResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const keyword = searchParams.get('q') || ''
  const activeFilter = (searchParams.get('filter') || 'all') as FilterType
  const activeGroupIds = searchParams.get('group_ids')?.split(',').map(Number).filter(Boolean) || []

  const [utterances, setUtterances] = useState<Utterance[]>([])
  const [total, setTotal] = useState(0)
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoadingUtterances, setIsLoadingUtterances] = useState(false)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const LIMIT = 20

  // 発話選択・インサイト関連
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [insight, setInsight] = useState<Insight | null>(null)
  const [isAiGenerated, setIsAiGenerated] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)

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
  }, [keyword, activeFilter, activeGroupIds.join(',')])

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

  useEffect(() => {
    setCurrentPage(1)
    setSelectedIds(new Set())
    fetchUtterances(1)
    fetchGroups()
  }, [keyword, activeFilter])

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

  const generateInsight = async () => {
    if (selectedIds.size === 0) return
    setIsGenerating(true)
    setShowModal(true)
    setInsight(null)
    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utteranceIds: Array.from(selectedIds) }),
      })
      const data = await res.json()
      setInsight(data.insights)
      setIsAiGenerated(data.aiGenerated)
    } catch (err) {
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 検索バー */}
      <div className="mb-6">
        <SearchBar defaultValue={keyword} onSearch={handleSearch} />
      </div>

      {keyword && (
        <>
          {/* 件数表示 */}
          <div className="mb-4 flex items-center justify-between">
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
                      onClick={generateInsight}
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

      {/* インサイトモーダル */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => !isGenerating && setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-pink-50 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: '#ff6b9d' }} />
                <h2 className="font-semibold text-gray-700 text-sm">
                  インサイト
                  {!isGenerating && (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      （{selectedIds.size}件の発話から生成）
                    </span>
                  )}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {!isGenerating && insight && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={isAiGenerated
                      ? { background: 'rgba(192, 132, 252, 0.12)', color: '#7700e8' }
                      : { background: '#f3f4f6', color: '#9ca3af' }}>
                    {isAiGenerated ? 'AI生成' : 'サンプル'}
                  </span>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {isGenerating ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <div className="loading-spinner" />
                    インサイトを生成中...
                  </div>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : insight ? (
                <>
                  {/* サマリー */}
                  <div className="p-3 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(255, 107, 157, 0.06), rgba(192, 132, 252, 0.06))' }}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">主な悩み・関心事</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{insight.summary}</p>
                  </div>

                  {/* 感情の変化 */}
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp size={13} className="text-amber-500" />
                      <h3 className="text-xs font-semibold text-amber-600">感情の変化</h3>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{insight.emotionTrend}</p>
                  </div>

                  {/* 未解決の課題 */}
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertCircle size={13} className="text-red-400" />
                      <h3 className="text-xs font-semibold text-red-500">未解決の課題・潜在ニーズ</h3>
                    </div>
                    <ul className="space-y-1">
                      {insight.unresolvedIssues.map((issue, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                          <span className="text-red-300 shrink-0 mt-0.5">•</span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 商品開発ヒント */}
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Lightbulb size={13} className="text-purple-400" />
                      <h3 className="text-xs font-semibold text-purple-600">商品開発へのヒント</h3>
                    </div>
                    <ul className="space-y-1">
                      {insight.productHints.map((hint, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                          <span className="text-purple-300 shrink-0 mt-0.5">•</span>
                          {hint}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={generateInsight}
                    className="w-full text-xs text-gray-400 hover:text-pink-500 transition-colors text-center py-1"
                  >
                    再生成する
                  </button>
                </>
              ) : null}
            </div>
          </div>
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
