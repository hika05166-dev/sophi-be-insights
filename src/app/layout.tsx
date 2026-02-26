'use client'

import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from 'next-auth/react'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
