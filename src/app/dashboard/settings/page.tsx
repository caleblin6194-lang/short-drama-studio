'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import Button from '@/components/shared/Button'
import UserAvatar from '@/components/shared/UserAvatar'
import LanguageSwitcher from '@/components/shared/LanguageSwitcher'
import { LOCALES, useLocale, useSetLocale } from '@/i18n/I18nProvider'

export default function SettingsPage() {
  const { currentUser, updateProfile } = useAuthStore()
  const [name, setName] = useState(currentUser?.name || '')
  const [email] = useState(currentUser?.email || '')
  const [saved, setSaved] = useState(false)
  const [notifications, setNotifications] = useState({ email: true, credits: true, marketing: false })
  const currentLocale = useLocale()
  const setLocale = useSetLocale()

  const handleSave = () => {
    updateProfile({ name })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!currentUser) return null

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-white">账户设置</h2>

      {/* Profile */}
      <div className="card p-6">
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-4">个人信息</h3>
        <div className="flex items-start gap-6">
          <UserAvatar name={currentUser.name} size={64} />
          <div className="flex-1 space-y-4">
            <div>
              <label className="text-sm text-[#a0a0b8] block mb-1">昵称</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full max-w-sm bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#6c5ce7]" />
            </div>
            <div>
              <label className="text-sm text-[#a0a0b8] block mb-1">邮箱</label>
              <input value={email} disabled className="w-full max-w-sm bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-[#a0a0b8] text-sm opacity-60" />
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleSave}>保存</Button>
              {saved && <span className="text-sm text-emerald-400">已保存</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="card p-6">
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-4">修改密码</h3>
        <div className="space-y-4 max-w-sm">
          <input type="password" placeholder="当前密码" className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#6c5ce7]" />
          <input type="password" placeholder="新密码" className="w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#6c5ce7]" />
          <Button variant="secondary">更新密码</Button>
        </div>
      </div>

      {/* Language */}
      <div className="card p-6">
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-4">语言 / Language</h3>
        <p className="text-xs text-[#6b6b8a] mb-4">选择界面显示语言 / Select interface display language</p>
        <div className="flex flex-wrap gap-2">
          {LOCALES.map(l => (
            <button
              key={l.key}
              onClick={() => setLocale(l.key)}
              className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                currentLocale === l.key
                  ? 'border-[#6c5ce7] bg-[#6c5ce7]/10 text-white'
                  : 'border-[#2a2a3e] bg-[#1a1a2e] text-[#a0a0b8] hover:border-[#6c5ce7]/50'
              }`}
            >
              <span className="block text-white font-medium">{l.nativeLabel}</span>
              <span className="block text-[10px] text-[#6b6b8a]">{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-4">通知偏好</h3>
        <div className="space-y-3">
          {[
            { key: 'email' as const, label: '邮件通知', desc: '接收项目进度和系统通知' },
            { key: 'credits' as const, label: '积分提醒', desc: '积分不足时发送提醒' },
            { key: 'marketing' as const, label: '营销邮件', desc: '接收新功能和优惠信息' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-white">{item.label}</p>
                <p className="text-xs text-[#a0a0b8]">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}
                className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${notifications[item.key] ? 'bg-[#6c5ce7]' : 'bg-[#2a2a3e]'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${notifications[item.key] ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
