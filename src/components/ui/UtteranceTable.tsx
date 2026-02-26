'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react'
import type { Utterance, UserAttribute } from '@/types'

interface UtteranceTableProps {
  utterances: (Utterance & { attribute?: UserAttribute })[]
  isLoading: boolean
  total: number
  currentPage: number
  limit: number
  onPageChange: (page: number) => void
  keyword: string
}

function highlightKeyword(text: string, keyword: string): React.ReactNode {
  if (!keyword) return text
  const parts = text.split(new RegExp(`(${keyword})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase() ? (
      <mark key={i} className="bg-yellow-100 text-yellow-800 rounded px-0.5">
        {part}
      </mark>
    ) : part
  )
}

const ATTRIBUTE_BADGES: Record<string, { label: string; style: React.CSSProperties }> = {
  detailed: {
    label: '深刻な悩み',
    style: { background: 'rgba(255, 107, 157, 0.12)', color: '#e8005a' },
  },
  self_solving: {
    label: '自己解決型',
    style: { background: 'rgba(192, 132, 252, 0.12)', color: '#7700e8' },
  },
  none: { label: '', style: {} },
}

const AGE_COLORS: Record<string, string> = {
  '10代': 'bg-blue-100 text-blue-600',
  '20代': 'bg-green-100 text-green-600',
  '30代': 'bg-orange-100 text-orange-600',
  '40代〜': 'bg-red-100 text-red-600',
}

const PHASE_COLORS: Record<string, string> = {
  '月経期': 'bg-pink-100 text-pink-600',
  '卵胞期': 'bg-purple-100 text-purple-600',
  '排卵期': 'bg-yellow-100 text-yellow-600',
  '黄体期': 'bg-indigo-100 text-indigo-600',
}

export default function UtteranceTable({
  utterances,
  isLoading,
  total,
  currentPage,
  limit,
  onPageChange,
  keyword,
}: UtteranceTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(total / limit)

  const handleRowClick = (utterance: Utterance) => {
    const q = searchParams.get('q') || keyword
    router.push(`/users/${utterance.anonymous_id}?from=results&q=${encodeURIComponent(q)}`)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-pink-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-pink-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} style={{ color: '#ff6b9d' }} />
          <h2 className="font-semibold text-gray-700 text-sm">発話一覧</h2>
        </div>
        <span className="text-xs text-gray-400">{total}件中 {(currentPage - 1) * limit + 1}〜{Math.min(currentPage * limit, total)}件を表示</span>
      </div>

      {isLoading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : utterances.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p>該当する発話が見つかりませんでした</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-pink-50">
            {utterances.map(utterance => {
              const badge = utterance.attribute ? ATTRIBUTE_BADGES[utterance.attribute] : null
              return (
                <button
                  key={utterance.id}
                  onClick={() => handleRowClick(utterance)}
                  className="w-full text-left px-4 py-3 hover:bg-pink-50 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, #ff6b9d, #c084fc)' }}>
                        {utterance.anonymous_id?.replace('user_', '')}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-xs font-medium text-gray-700">
                          {utterance.anonymous_id}
                        </span>
                        {utterance.age_group && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${AGE_COLORS[utterance.age_group] || 'bg-gray-100 text-gray-600'}`}>
                            {utterance.age_group}
                          </span>
                        )}
                        {utterance.cycle_phase && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${PHASE_COLORS[utterance.cycle_phase] || 'bg-gray-100 text-gray-600'}`}>
                            {utterance.cycle_phase}
                          </span>
                        )}
                        {badge && badge.label && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={badge.style}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                        {highlightKeyword(utterance.content, keyword)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(utterance.created_at)}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0 mt-2 group-hover:text-pink-400 transition-colors" />
                  </div>
                </button>
              )
            })}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-pink-50 flex items-center justify-between">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-pink-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
                前へ
              </button>
              <span className="text-xs text-gray-500">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-pink-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                次へ
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
