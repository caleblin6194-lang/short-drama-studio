'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import Button from '@/components/shared/Button'
import Modal from '@/components/shared/Modal'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('123456')
  const [name, setName] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const { login, register, isLoading, error } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    let success: boolean
    if (mode === 'login') {
      success = await login(email, password)
    } else {
      success = await register(email, name, password)
    }
    if (success) {
      const user = useAuthStore.getState().currentUser
      router.push(user?.role === 'admin' ? '/admin/overview' : '/dashboard/overview')
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">短剧创作工具</h1>
          <p className="text-[#a0a0b8]">AI 驱动的短剧全流程创作平台</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          {/* Tab */}
          <div className="flex mb-6 bg-[#1a1a2e] rounded-lg p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${mode === 'login' ? 'bg-[#6c5ce7] text-white' : 'text-[#a0a0b8]'}`}
            >
              登录
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${mode === 'register' ? 'bg-[#6c5ce7] text-white' : 'text-[#a0a0b8]'}`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-sm text-[#a0a0b8] block mb-1">昵称</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#6c5ce7]"
                  placeholder="你的昵称"
                />
              </div>
            )}

            <div>
              <label className="text-sm text-[#a0a0b8] block mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#6c5ce7]"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-[#a0a0b8]">密码</label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-[#6c5ce7] hover:text-[#8b7cf0] cursor-pointer"
                >
                  忘记密码？
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#6c5ce7]"
                placeholder="••••••"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button type="submit" className="w-full" size="lg" loading={isLoading}>
              {mode === 'login' ? '登录' : '注册'}
            </Button>
          </form>

          {/* 忘记密码弹窗 */}
          <Modal open={showForgot} onClose={() => { setShowForgot(false); setForgotSent(false) }} title="重置密码">
            {forgotSent ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">📧</div>
                <p className="text-white mb-2">发送成功！</p>
                <p className="text-sm text-[#a0a0b8]">
                  密码重置链接已发送到 <span className="text-white">{forgotEmail}</span>
                </p>
                <p className="text-xs text-[#666] mt-3">请查收邮件并按提示重置密码</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[#a0a0b8]">输入你的注册邮箱，我们会发送重置链接</p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#6c5ce7]"
                  placeholder="your@email.com"
                />
                <Button className="w-full" onClick={() => { if (forgotEmail) setForgotSent(true) }}>
                  发送重置链接
                </Button>
              </div>
            )}
          </Modal>

          {/* Demo hint */}
          <div className="mt-6 p-3 bg-[#1a1a2e] rounded-lg text-xs text-[#a0a0b8] space-y-1">
            <p className="font-medium text-white">Demo 账号：</p>
            <p>会员：demo@example.com / 123456</p>
            <p>管理员：admin@example.com / 123456</p>
          </div>
        </div>
      </div>
    </div>
  )
}
