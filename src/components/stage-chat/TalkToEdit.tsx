'use client'

import { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface EditAction {
  type: 'update_dialogue' | 'update_description' | 'add_transition' | 'change_bgm' | 'toggle_subtitles' | 'generic'
  description: string
  shotIndex?: number
  value?: string
  status: 'pending' | 'applied'
}

interface TalkToEditProps {
  projectId: string
}

export default function TalkToEdit({ projectId }: TalkToEditProps) {
  const {
    project, updateShotDialogue, updateShotDescription, setShotTransition,
    setBgmTrack, toggleSubtitles,
  } = useProjectStore()

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 你好！我是你的视频编辑助手。告诉我你想如何修改这个短剧，我会帮你完成编辑。\n\n比如：「把第二段台词改为你好世界」或「给第3镜头加淡入转场」。',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingActions, setPendingActions] = useState<EditAction[]>([])
  const [appliedActions, setAppliedActions] = useState<EditAction[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const applyAction = (action: EditAction) => {
    const shots = project?.shots ?? []

    switch (action.type) {
      case 'update_dialogue': {
        const shot = shots[action.shotIndex ?? 0]
        if (shot && action.value) updateShotDialogue(shot.id, action.value)
        break
      }
      case 'update_description': {
        const shot = shots[action.shotIndex ?? 0]
        if (shot && action.value) updateShotDescription(shot.id, action.value)
        break
      }
      case 'add_transition': {
        const shot = shots[action.shotIndex ?? 0]
        if (shot && action.value) setShotTransition(shot.id, action.value)
        break
      }
      case 'change_bgm': {
        if (action.value) setBgmTrack(action.value)
        break
      }
      case 'toggle_subtitles': {
        toggleSubtitles()
        break
      }
      default:
        break
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          projectId,
          shotCount: project?.shots.length ?? 0,
        }),
      })

      const data = await res.json()

      setMessages(prev => [...prev, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      }])

      if (data.actions?.length > 0) {
        const realActions = data.actions.filter((a: EditAction) => a.type !== 'generic')
        if (realActions.length > 0) setPendingActions(realActions)
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，出了点问题，请稍后再试。',
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyAction = (action: EditAction, index: number) => {
    applyAction(action)
    setAppliedActions(prev => [...prev, { ...action, status: 'applied' }])
    setPendingActions(prev => prev.filter((_, i) => i !== index))
  }

  const handleApplyAll = () => {
    pendingActions.forEach(a => applyAction(a))
    setAppliedActions(prev => [...prev, ...pendingActions.map(a => ({ ...a, status: 'applied' as const }))])
    setPendingActions([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-white">🎙️ Talk-to-Edit</h3>
          <p className="text-xs text-[#a0a0b8] mt-0.5">用自然语言描述你的编辑需求</p>
        </div>
        {messages.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setMessages([messages[0]]); setPendingActions([]); setAppliedActions([]) }}
          >
            清空对话
          </Button>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-[#2a2a3e] bg-[#0f0f18] p-4 space-y-4 mb-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-[#6c5ce7] text-white rounded-br-md'
                : 'bg-[#1a1a2e] text-[#c5d1ff] border border-[#2a2a3e] rounded-bl-md'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-[#a0a0b8] text-sm">
                <div className="flex gap-1">
                  {[0, 150, 300].map(delay => (
                    <span key={delay} className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
                AI 正在分析你的需求...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <div className="mb-4 p-4 rounded-xl border border-[#6c5ce7]/30 bg-[#1a1a2e]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium text-[#6c5ce7]">📋 待执行的操作</div>
            {pendingActions.length > 1 && (
              <Button size="sm" variant="primary" onClick={handleApplyAll}>全部执行</Button>
            )}
          </div>
          <div className="space-y-2">
            {pendingActions.map((action, index) => (
              <div key={index} className="flex items-center justify-between gap-3 bg-[#12121e] rounded-lg px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[#a0a0b8] bg-[#2a2a3e] px-2 py-0.5 rounded mr-2">{action.type}</span>
                  <span className="text-sm text-white">{action.description}</span>
                </div>
                <Button size="sm" onClick={() => handleApplyAction(action, index)}>执行</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applied Actions */}
      {appliedActions.length > 0 && (
        <div className="mb-4 p-3 rounded-xl border border-[#00b894]/30 bg-[#0f1f1a]">
          <div className="text-xs font-medium text-[#00b894] mb-2">✅ 已执行 ({appliedActions.length})</div>
          <div className="space-y-0.5">
            {appliedActions.slice(-3).map((action, index) => (
              <div key={index} className="text-xs text-[#00b894]/80">✓ {action.description}</div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="描述你想如何编辑...（例如：把第2段台词改为...）"
          rows={1}
          className="w-full bg-[#12121e] border border-[#2a2a3e] rounded-xl px-4 py-3 pr-14 text-sm text-white placeholder-[#6a6a8e] resize-none focus:outline-none focus:border-[#6c5ce7] transition-colors"
          style={{ minHeight: '48px', maxHeight: '120px' }}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!input.trim() || isLoading}
          className="absolute right-2 bottom-1.5"
        >
          发送
        </Button>
      </form>

      <div className="mt-2 text-center text-xs text-[#6a6a8e]">
        按 Enter 发送，Shift + Enter 换行
      </div>
    </div>
  )
}
