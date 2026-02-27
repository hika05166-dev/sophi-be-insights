'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import type { ChatSession } from '@/types'

interface ChatHistoryProps {
  session: ChatSession
  isSelected: boolean
  onToggle: (sessionId: string) => void
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('ja-JP', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function ChatHistory({ session, isSelected, onToggle }: ChatHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const firstUserMessage = session.messages.find(m => m.role === 'user')?.content || ''

  return (
    <div className={`p-4 transition-colors ${isSelected ? 'bg-accent/30' : ''}`}>
      <div className="flex items-start gap-2.5 mb-2">
        <div className="mt-0.5" onClick={() => onToggle(session.session_id)}>
          <Checkbox checked={isSelected} onCheckedChange={() => onToggle(session.session_id)} aria-label="セッションを選択" />
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="flex-1 flex items-center justify-between text-left group">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs text-muted-foreground">{formatDate(session.created_at)}</span>
              <Badge variant="outline">{session.messages.length}件</Badge>
            </div>
            {!isExpanded && (
              <p className="text-sm text-foreground line-clamp-4 pr-4">{firstUserMessage}</p>
            )}
          </div>
          <div className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-2 pl-7 animate-fade-in">
          {session.messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            return (
              <div key={msg.id || i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-6 h-6 rounded-full shrink-0 mr-2 flex items-center justify-center text-xs font-bold text-primary-foreground bg-primary mt-1">
                    び
                  </div>
                )}
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  isUser ? 'bg-foreground/10 text-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'
                }`}>
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
