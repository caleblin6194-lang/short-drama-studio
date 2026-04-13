'use client'

import { useState, useRef, useEffect } from 'react'
import Button from '@/components/shared/Button'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface EditAction {
  type: string
  description: string
  status: 'pending' | 'applied'
}

interface TalkToEditProps {
  projectId: string
}

export default function TalkToEdit({ projectId }: TalkToEditProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 你好！我是你的视频编辑助手。告诉我你想如何修改这个短剧，我会帮你完成编辑。比如：「把第二段的节奏加快」或「给高潮部分加上配乐」。',
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
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim(), projectId }),
      })

      const data = await res.json()

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])

      if (data.actions && data.actions.length > 0) {
        setPendingActions(data.actions.map((a: EditAction, i: number) => ({ ...a, id: `action-${Date.now()}-${i}` } as EditAction)))
      }
    } catch {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '抱歉，出了点问题，请稍后再试。',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplyAction = (action: EditAction, index: number) => {
    setAppliedActions(prev => [...prev, action])
    setPendingActions(prev => prev.filter((_, i) => i !== index))
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
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#6c5ce7] text-white rounded-br-md'
                  : 'bg-[#1a1a2e] text-[#c5d1ff] border border-[#2a2a3e] rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2 text-[#a0a0b8] text-sm">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7] animate-bounce" style={{ animationDelay: '300ms' }} />
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
          <div className="text-xs font-medium text-[#6c5ce7] mb-3">📋 待执行的操作</div>
          <div className="space-y-2">
            {pendingActions.map((action, index) => (
              <div key={index} className="flex items-center justify-between gap-3 bg-[#12121e] rounded-lg px-3 py-2.5">
                <div>
                  <span className="text-xs text-[#a0a0b8] bg-[#2a2a3e] px-2 py-0.5 rounded mr-2">{action.type}</span>
                  <span className="text-sm text-white">{action.description}</span>
                </div>
                <Button size="sm" onClick={() => handleApplyAction(action, index)}>
                  执行
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Applied Actions */}
      {appliedActions.length > 0 && (
        <div className="mb-4 p-4 rounded-xl border border-[#00b894]/30 bg-[#0f1f1a]">
          <div className="text-xs font-medium text-[#00b894] mb-2">✅ 已执行</div>
          {appliedActions.map((action, index) => (
            <div key={index} className="text-sm text-[#00b894]/80">
              ✓ {action.description}
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="描述你想如何编辑..."
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

      {/* Hint */}
      <div className="mt-2 text-center text-xs text-[#6a6a8e]">
        按 Enter 发送，Shift + Enter 换行
      </div>
    </div>
  )
}
