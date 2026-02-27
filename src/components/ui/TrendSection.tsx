'use client'

import { TrendingUp, Search } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import type { TrendTopic } from '@/types'

interface TrendSectionProps {
  userTrends: TrendTopic[]
  searchTrends: TrendTopic[]
  onKeywordClick: (keyword: string) => void
}

function TrendList({
  topics, onKeywordClick, icon: Icon, title, description,
}: {
  topics: TrendTopic[]
  onKeywordClick: (keyword: string) => void
  icon: typeof TrendingUp
  title: string
  description: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-muted-foreground" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-0.5">
        {topics.map((topic, i) => (
          <button
            key={topic.keyword}
            onClick={() => onKeywordClick(topic.keyword)}
            className="w-full text-left flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors group"
          >
            <span className="text-xs font-bold w-5 shrink-0 text-center text-muted-foreground">{i + 1}</span>
            <span className="flex-1 min-w-0 text-sm text-foreground group-hover:text-foreground/80 leading-snug line-clamp-2">
              {topic.sample || topic.keyword}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground w-8 text-right">{topic.count}件</span>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  )
}

export default function TrendSection({ userTrends, searchTrends, onKeywordClick }: TrendSectionProps) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">トレンド</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TrendList topics={userTrends} onKeywordClick={onKeywordClick} icon={TrendingUp} title="ユーザートレンド" description="よく話されているトピック TOP10" />
        <TrendList topics={searchTrends} onKeywordClick={onKeywordClick} icon={Search} title="検索トレンド" description="社内でよく検索されているキーワード TOP10" />
      </div>
    </div>
  )
}
