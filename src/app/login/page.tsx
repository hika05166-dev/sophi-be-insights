import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import LoginForm from '@/components/auth/LoginForm'

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect('/search')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#f5f5f3]"
      style={{
        backgroundImage: 'radial-gradient(circle, #c8c8c4 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 bg-neutral-900">
            <span className="text-white text-lg font-bold">び</span>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900">ソフィBe インサイトツール</h1>
          <p className="text-sm text-neutral-500 mt-1">びいのユーザー発話を検索・分析する社内ツール</p>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-neutral-400 mt-6">
          社内利用限定のツールです。ログイン情報の共有はご遠慮ください。
        </p>
      </div>
    </div>
  )
}
