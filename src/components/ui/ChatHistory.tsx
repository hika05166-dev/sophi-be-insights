'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ChatSession } from '@/types'

interface ChatHistoryProps {
  session: ChatSession
  isSelected: boolean
  onToggle: (sessionId: string) => void
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ChatHistory({ session, isSelected, onToggle }: ChatHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const userMessages = session.messages.filter(m => m.role === 'user')
  const firstUserMessage = userMessages[0]?.content || ''

  return (
    <div className={`p-4 transition-colors ${isSelected ? 'bg-pink-50/50' : ''}`}>
      {/* セッションヘッダー */}
      <div className="flex items-start gap-2 mb-3">
        {/* チェックボックス */}
        <button
          onClick={() => onToggle(session.session_id)}
          className="shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
          style={{
            borderColor: isSelected ? '#ff6b9d' : '#d1d5db',
            background: isSelected ? 'linear-gradient(135deg, #ff6b9d, #c084fc)' : 'white',
          }}
          aria-label="セッションを選択"
        >
          {isSelected && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-center justify-between text-left group"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-400">
                {formatDate(session.created_at)}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-50 text-pink-500">
                {session.messages.length}件
              </span>
            </div>
            {!isExpanded && (
              <p className="text-sm text-gray-600 line-clamp-1 pr-4">{firstUserMessage}</p>
            )}
          </div>
          <div className="text-gray-400 group-hover:text-pink-400 transition-colors shrink-0">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>
      </div>

      {/* メッセージ一覧 */}
      {isExpanded && (
        <div className="space-y-3 animate-fade-in pl-6">
          {session.messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={msg.id || i}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full shrink-0 mr-2 flex items-center justify-center text-xs font-bold text-white mt-1"
                    style={{ background: 'linear-gradient(135deg, #c084fc, #818cf8)' }}>
                    び
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  isUser
                    ? 'rounded-tr-sm text-white'
                    : 'rounded-tl-sm bg-gray-100 text-gray-700'
                }`}
                  style={isUser ? { background: 'linear-gradient(135deg, #ff6b9d, #c084fc)' } : {}}>
                  {msg.content}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
