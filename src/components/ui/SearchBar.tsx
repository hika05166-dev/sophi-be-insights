'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  defaultValue?: string
  onSearch: (keyword: string) => void
  placeholder?: string
  autoFocus?: boolean
}

export default function SearchBar({
  defaultValue = '',
  onSearch,
  placeholder = 'キーワードで検索（例：生理痛、PMS、睡眠不足）',
  autoFocus = false,
}: SearchBarProps) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onSearch(value.trim())
    }
  }

  const handleClear = () => {
    setValue('')
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="relative group">
      <div className="relative flex items-center">
        <Search
          size={20}
          className="absolute left-4 text-gray-400 pointer-events-none transition-colors group-focus-within:text-pink-400"
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-24 py-4 rounded-2xl text-gray-800 text-base bg-white
            border-2 border-pink-100
            focus:outline-none focus:border-pink-300 focus:shadow-lg
            transition-all placeholder-gray-400"
          style={{
            boxShadow: '0 4px 20px rgba(255, 107, 157, 0.08)',
          }}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 rounded-xl font-medium text-white text-sm transition-all"
            style={{ background: 'linear-gradient(135deg, #ff6b9d, #c084fc)' }}
          >
            検索
          </button>
        </div>
      </div>
    </form>
  )
}
