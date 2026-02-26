'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import SearchBar from '@/components/ui/SearchBar'
import GroupingSummary from '@/components/ui/GroupingSummary'
import UserAttributeFilter from '@/components/ui/UserAttributeFilter'
import UtteranceTable from '@/components/ui/UtteranceTable'
import type { Utterance, Group } from '@/types'

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

            <div className="lg:col-span-2">
              {/* 発話一覧 */}
              <UtteranceTable
                utterances={utterances}
                isLoading={isLoadingUtterances}
                total={total}
                currentPage={currentPage}
                limit={LIMIT}
                onPageChange={setCurrentPage}
                keyword={keyword}
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
