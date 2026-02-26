'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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

  useEffect(() => { setValue(defaultValue) }, [defaultValue])
  useEffect(() => { if (autoFocus) inputRef.current?.focus() }, [autoFocus])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-8 h-11 bg-card"
        />
        {value && (
          <button
            type="button"
            onClick={() => { setValue(''); inputRef.current?.focus() }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <Button type="submit" className="h-11 px-5">検索</Button>
    </form>
  )
}
