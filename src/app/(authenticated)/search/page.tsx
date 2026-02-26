'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SearchBar from '@/components/ui/SearchBar'
import TrendSection from '@/components/ui/TrendSection'
import type { TrendTopic } from '@/types'

interface TrendsData {
  userTrends: TrendTopic[]
  searchTrends: TrendTopic[]
}

export default function SearchPage() {
  const router = useRouter()
  const [trends, setTrends] = useState<TrendsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/trends')
      .then(r => r.json())
      .then(data => setTrends(data))
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const handleSearch = (keyword: string) => {
    if (keyword.trim()) {
      router.push(`/results?q=${encodeURIComponent(keyword.trim())}`)
    }
  }

  return (
    <div className="min-h-full" style={{ background: 'linear-gradient(160deg, #fff0f5 0%, #f5f0ff 60%, #f0f4ff 100%)' }}>
      {/* ヒーローセクション */}
      <div className="flex flex-col items-center justify-center px-6 pt-24 pb-16">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3"
            style={{ background: 'linear-gradient(135deg, #ff6b9d, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            びい インサイト
          </h1>
          <p className="text-gray-500 text-lg">
            ユーザーの声から、次の一手を見つけよう
          </p>
        </div>

        {/* 検索バー */}
        <div className="w-full max-w-2xl animate-fade-in">
          <SearchBar onSearch={handleSearch} autoFocus />
        </div>

        {/* ヒント */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center animate-fade-in">
          {['生理痛', 'PMS', '妊活', '睡眠', '経血量', 'ストレス'].map(kw => (
            <button
              key={kw}
              onClick={() => handleSearch(kw)}
              className="px-3 py-1 rounded-full text-sm border transition-all hover:shadow-sm"
              style={{
                borderColor: '#ffc2d8',
                color: '#ff6b9d',
                backgroundColor: 'rgba(255, 194, 216, 0.15)',
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.backgroundColor = 'rgba(255, 107, 157, 0.1)'
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.backgroundColor = 'rgba(255, 194, 216, 0.15)'
              }}
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      {/* トレンドセクション */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="loading-spinner" />
          </div>
        ) : trends ? (
          <TrendSection
            userTrends={trends.userTrends}
            searchTrends={trends.searchTrends}
            onKeywordClick={handleSearch}
          />
        ) : null}
      </div>

      {/* 波形デコレーション */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none overflow-hidden h-40 opacity-20">
        <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z"
            fill="url(#waveGradient)"
          />
          <defs>
            <linearGradient id="waveGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ff6b9d" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}
