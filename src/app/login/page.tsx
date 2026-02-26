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
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #fff0f5 0%, #f5f0ff 100%)' }}>
      <div className="w-full max-w-md px-6">
        {/* ロゴ */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #ff6b9d, #c084fc)' }}>
            <span className="text-white text-2xl font-bold">び</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">ソフィBe インサイトツール</h1>
          <p className="text-sm text-gray-500 mt-1">びいのユーザー発話を検索・分析する社内ツール</p>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-gray-400 mt-6">
          社内利用限定のツールです。ログイン情報の共有はご遠慮ください。
        </p>
      </div>
    </div>
  )
}
