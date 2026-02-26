'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SearchBar from '@/components/ui/SearchBar'
import TrendSection from '@/components/ui/TrendSection'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { TrendTopic } from '@/types'

interface TrendsData { userTrends: TrendTopic[]; searchTrends: TrendTopic[] }

export default function SearchPage() {
  const router = useRouter()
  const [trends, setTrends] = useState<TrendsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trends').then(r => r.json()).then(setTrends).catch(console.error).finally(() => setIsLoading(false))
  }, [])

  const handleSearch = (keyword: string) => {
    if (keyword.trim()) router.push(`/results?q=${encodeURIComponent(keyword.trim())}`)
  }

  return (
    <div className="min-h-full bg-background">
      <div className="flex flex-col items-center justify-center px-6 pt-20 pb-12">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">Insight Lens</h1>
          <p className="text-muted-foreground">ユーザーの声から、次の一手を見つけよう</p>
        </div>

        <div className="w-full max-w-2xl animate-fade-in">
          <SearchBar onSearch={handleSearch} autoFocus />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 justify-center animate-fade-in">
          {['生理痛', 'PMS', '妊活', '睡眠', '経血量', 'ストレス'].map(kw => (
            <Button key={kw} variant="outline" size="sm" onClick={() => handleSearch(kw)}>
              {kw}
            </Button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        ) : trends ? (
          <TrendSection userTrends={trends.userTrends} searchTrends={trends.searchTrends} onKeywordClick={handleSearch} />
        ) : null}
      </div>
    </div>
  )
}
