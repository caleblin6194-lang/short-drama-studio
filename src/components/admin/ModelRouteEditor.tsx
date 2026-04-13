'use client'

import { useState } from 'react'
import type { ModelRoute, ModelStage, ModelAuthType } from '@/types'
import Badge from '@/components/shared/Badge'
import Button from '@/components/shared/Button'
import Modal from '@/components/shared/Modal'

interface ModelRouteEditorProps {
  routes: ModelRoute[]
  onUpdate: (id: string, patch: Partial<ModelRoute>) => void
  onAdd: (route: Omit<ModelRoute, 'id' | 'testStatus'>) => void
  onDelete: (id: string) => void
  onTest: (id: string) => Promise<void>
}

const STAGE_LABELS: Record<ModelStage, { label: string; color: string }> = {
  image: { label: '图像', color: '#6c5ce7' },
  video: { label: '视频', color: '#e17055' },
  audio: { label: '音频', color: '#00b894' },
  script: { label: '文本', color: '#0984e3' },
}

const STAGE_OPTIONS: ModelStage[] = ['image', 'video', 'audio', 'script']

const AUTH_TYPE_LABELS: Record<ModelAuthType, string> = {
  bearer: 'Bearer Token',
  api_key_header: 'API Key Header',
  custom_header: '自定义 Header',
  query_param: 'Query 参数',
  none: '无认证',
}

const TEST_STATUS_MAP = {
  untested: { label: '未测试', variant: 'gray' as const },
  testing: { label: '测试中...', variant: 'yellow' as const },
  success: { label: '已连通', variant: 'green' as const },
  failed: { label: '连接失败', variant: 'red' as const },
}

function maskKey(key: string): string {
  if (!key) return '(未配置)'
  if (key.length <= 12) return '****'
  return key.slice(0, 6) + '****' + key.slice(-4)
}

const INPUT_CLS = 'w-full bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6c5ce7]'
const MONO_INPUT_CLS = INPUT_CLS + ' font-mono'
const LABEL_CLS = 'text-xs text-[#a0a0b8] mb-1 block'

// ─── Form Data ───
interface ModelFormData {
  stage: ModelStage
  isCustom: boolean
  provider: string
  model: string
  baseUrl: string
  apiKey: string
  apiVersion: string
  authType: ModelAuthType
  authHeaderName: string
  authQueryParam: string
  customHeaders: string   // JSON string
  requestTemplate: string
  responseMapping: string
  httpMethod: 'POST' | 'GET'
  contentType: string
  costPerCall: string
  priority: string
  timeout: string
  maxRetries: string
  maxTokens: string
  temperature: string
  description: string
}

const EMPTY_FORM: ModelFormData = {
  stage: 'script', isCustom: false, provider: '', model: '', baseUrl: '', apiKey: '', apiVersion: '',
  authType: 'bearer', authHeaderName: '', authQueryParam: '',
  customHeaders: '', requestTemplate: '', responseMapping: '', httpMethod: 'POST', contentType: 'application/json',
  costPerCall: '0.01', priority: '1', timeout: '60', maxRetries: '2',
  maxTokens: '', temperature: '', description: '',
}

const EMPTY_CUSTOM_FORM: ModelFormData = {
  ...EMPTY_FORM, isCustom: true, authType: 'custom_header', provider: '', model: '',
  requestTemplate: '{\n  "model": "{{model}}",\n  "prompt": "{{prompt}}",\n  "image_url": "{{image_url}}"\n}',
  responseMapping: 'data.output.url',
}

function routeToForm(r: ModelRoute): ModelFormData {
  return {
    stage: r.stage, isCustom: !!r.isCustom, provider: r.provider, model: r.model,
    baseUrl: r.baseUrl, apiKey: r.apiKey, apiVersion: r.apiVersion || '',
    authType: r.authType || 'bearer',
    authHeaderName: r.authHeaderName || '',
    authQueryParam: r.authQueryParam || '',
    customHeaders: r.customHeaders ? JSON.stringify(r.customHeaders, null, 2) : '',
    requestTemplate: r.requestTemplate || '',
    responseMapping: r.responseMapping || '',
    httpMethod: r.httpMethod || 'POST',
    contentType: r.contentType || 'application/json',
    costPerCall: String(r.costPerCall), priority: String(r.priority),
    timeout: String(r.timeout), maxRetries: String(r.maxRetries),
    maxTokens: r.maxTokens ? String(r.maxTokens) : '',
    temperature: r.temperature !== undefined ? String(r.temperature) : '',
    description: r.description || '',
  }
}

function formToRoute(form: ModelFormData): Omit<ModelRoute, 'id' | 'testStatus'> {
  let customHeaders: Record<string, string> | undefined
  if (form.customHeaders.trim()) {
    try { customHeaders = JSON.parse(form.customHeaders) } catch { /* ignore */ }
  }
  return {
    stage: form.stage, isCustom: form.isCustom, provider: form.provider, model: form.model,
    baseUrl: form.baseUrl, apiKey: form.apiKey,
    apiVersion: form.apiVersion || undefined,
    authType: form.authType,
    authHeaderName: (form.authType === 'api_key_header' || form.authType === 'custom_header') ? form.authHeaderName : undefined,
    authQueryParam: form.authType === 'query_param' ? form.authQueryParam : undefined,
    customHeaders,
    requestTemplate: form.requestTemplate || undefined,
    responseMapping: form.responseMapping || undefined,
    httpMethod: form.httpMethod,
    contentType: form.contentType || undefined,
    costPerCall: parseFloat(form.costPerCall) || 0,
    priority: parseInt(form.priority) || 1,
    timeout: parseInt(form.timeout) || 60,
    maxRetries: parseInt(form.maxRetries) || 2,
    maxTokens: form.maxTokens ? parseInt(form.maxTokens) : undefined,
    temperature: form.temperature ? parseFloat(form.temperature) : undefined,
    description: form.description || undefined,
    isActive: false,
  }
}

// ─── Form Modal ───
function ModelFormModal({ open, onClose, initial, onSubmit, title }: {
  open: boolean; onClose: () => void; initial: ModelFormData; onSubmit: (data: ModelFormData) => void; title: string
}) {
  const [form, setForm] = useState(initial)
  const set = <K extends keyof ModelFormData>(k: K, v: ModelFormData[K]) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = () => {
    if (!form.provider || !form.model || !form.baseUrl) return
    onSubmit(form)
    onClose()
  }

  const needsHeaderName = form.authType === 'api_key_header' || form.authType === 'custom_header'

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {/* 模式切换 */}
        <div className="flex gap-2">
          <button onClick={() => set('isCustom', false)} className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${!form.isCustom ? 'bg-[#6c5ce7] text-white' : 'bg-[#1a1a2e] text-[#a0a0b8] hover:text-white'}`}>
            标准模型
          </button>
          <button onClick={() => set('isCustom', true)} className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${form.isCustom ? 'bg-[#e17055] text-white' : 'bg-[#1a1a2e] text-[#a0a0b8] hover:text-white'}`}>
            自定义接口
          </button>
        </div>

        {/* 基础信息 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLS}>类型 *</label>
            <select value={form.stage} onChange={e => set('stage', e.target.value as ModelStage)} className={INPUT_CLS}>
              {STAGE_OPTIONS.map(s => <option key={s} value={s}>{STAGE_LABELS[s].label}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>优先级</label>
            <input type="number" min={1} max={99} value={form.priority} onChange={e => set('priority', e.target.value)} className={INPUT_CLS} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLS}>{form.isCustom ? '接口名称' : '提供商'} *</label>
            <input value={form.provider} onChange={e => set('provider', e.target.value)} placeholder={form.isCustom ? '如 自建 ComfyUI, 内部 API' : '如 Anthropic, OpenAI'} className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>{form.isCustom ? '接口标识' : '模型名称'} *</label>
            <input value={form.model} onChange={e => set('model', e.target.value)} placeholder={form.isCustom ? '如 my-sdxl-workflow' : '如 claude-sonnet-4'} className={INPUT_CLS} />
          </div>
        </div>

        {/* API 对接 */}
        <div className="border-t border-[#2a2a3e] pt-3">
          <h4 className="text-xs font-medium text-white mb-3">API 对接配置</h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>请求地址 *</label>
                <input value={form.baseUrl} onChange={e => set('baseUrl', e.target.value)} placeholder="https://api.example.com/v1/generate" className={MONO_INPUT_CLS} />
              </div>
              {form.isCustom && (
                <div>
                  <label className={LABEL_CLS}>HTTP 方法</label>
                  <select value={form.httpMethod} onChange={e => set('httpMethod', e.target.value as 'POST' | 'GET')} className={INPUT_CLS}>
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                  </select>
                </div>
              )}
            </div>

            {/* 认证方式 */}
            <div>
              <label className={LABEL_CLS}>认证方式</label>
              <select value={form.authType} onChange={e => set('authType', e.target.value as ModelAuthType)} className={INPUT_CLS}>
                {(Object.keys(AUTH_TYPE_LABELS) as ModelAuthType[]).map(k => (
                  <option key={k} value={k}>{AUTH_TYPE_LABELS[k]}</option>
                ))}
              </select>
            </div>

            {form.authType !== 'none' && (
              <div>
                <label className={LABEL_CLS}>
                  {form.authType === 'bearer' ? 'Bearer Token' : form.authType === 'query_param' ? 'API Key 值' : 'API Key'}
                </label>
                <input type="password" value={form.apiKey} onChange={e => set('apiKey', e.target.value)} placeholder="sk-xxxxxxxx" className={MONO_INPUT_CLS} />
              </div>
            )}

            {needsHeaderName && (
              <div>
                <label className={LABEL_CLS}>Header 名称</label>
                <input value={form.authHeaderName} onChange={e => set('authHeaderName', e.target.value)} placeholder="如 X-API-Key, Authorization" className={MONO_INPUT_CLS} />
              </div>
            )}

            {form.authType === 'query_param' && (
              <div>
                <label className={LABEL_CLS}>参数名</label>
                <input value={form.authQueryParam} onChange={e => set('authQueryParam', e.target.value)} placeholder="如 api_key, token" className={MONO_INPUT_CLS} />
              </div>
            )}

            {!form.isCustom && (
              <div>
                <label className={LABEL_CLS}>API Version</label>
                <input value={form.apiVersion} onChange={e => set('apiVersion', e.target.value)} placeholder="可选，如 2024-06-01" className={MONO_INPUT_CLS} />
              </div>
            )}
          </div>
        </div>

        {/* 自定义接口高级配置 */}
        {form.isCustom && (
          <div className="border-t border-[#2a2a3e] pt-3">
            <h4 className="text-xs font-medium text-[#e17055] mb-3">自定义请求配置</h4>
            <div className="space-y-3">
              <div>
                <label className={LABEL_CLS}>Content-Type</label>
                <input value={form.contentType} onChange={e => set('contentType', e.target.value)} placeholder="application/json" className={MONO_INPUT_CLS} />
              </div>
              <div>
                <label className={LABEL_CLS}>
                  自定义 Headers <span className="text-[#a0a0b8]/50">(JSON 格式)</span>
                </label>
                <textarea rows={3} value={form.customHeaders} onChange={e => set('customHeaders', e.target.value)}
                  placeholder={'{\n  "X-Custom-Header": "value"\n}'}
                  className={MONO_INPUT_CLS + ' resize-y min-h-[60px]'} />
              </div>
              <div>
                <label className={LABEL_CLS}>
                  请求体模板 <span className="text-[#a0a0b8]/50">(JSON，支持 {'{{prompt}} {{image_url}} {{model}}'} 占位符)</span>
                </label>
                <textarea rows={6} value={form.requestTemplate} onChange={e => set('requestTemplate', e.target.value)}
                  placeholder={'{\n  "model": "{{model}}",\n  "prompt": "{{prompt}}",\n  "image_url": "{{image_url}}",\n  "width": 1024,\n  "height": 1024\n}'}
                  className={MONO_INPUT_CLS + ' resize-y min-h-[100px]'} />
              </div>
              <div>
                <label className={LABEL_CLS}>
                  响应结果路径 <span className="text-[#a0a0b8]/50">(从 JSON 响应中提取结果的路径)</span>
                </label>
                <input value={form.responseMapping} onChange={e => set('responseMapping', e.target.value)}
                  placeholder="如 data.output.url 或 images[0].url" className={MONO_INPUT_CLS} />
              </div>
            </div>
          </div>
        )}

        {/* 参数 */}
        <div className="border-t border-[#2a2a3e] pt-3">
          <h4 className="text-xs font-medium text-white mb-3">运行参数</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>单次费用 ($)</label>
              <input type="number" step="0.001" value={form.costPerCall} onChange={e => set('costPerCall', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>超时 (秒)</label>
              <input type="number" value={form.timeout} onChange={e => set('timeout', e.target.value)} className={INPUT_CLS} />
            </div>
            <div>
              <label className={LABEL_CLS}>最大重试次数</label>
              <input type="number" min={0} max={5} value={form.maxRetries} onChange={e => set('maxRetries', e.target.value)} className={INPUT_CLS} />
            </div>
            {(form.stage === 'script' && !form.isCustom) && (
              <>
                <div>
                  <label className={LABEL_CLS}>Max Tokens</label>
                  <input type="number" value={form.maxTokens} onChange={e => set('maxTokens', e.target.value)} placeholder="如 8192" className={INPUT_CLS} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Temperature</label>
                  <input type="number" step="0.1" min={0} max={2} value={form.temperature} onChange={e => set('temperature', e.target.value)} placeholder="如 0.7" className={INPUT_CLS} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* 描述 */}
        <div>
          <label className={LABEL_CLS}>描述</label>
          <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="接口用途说明" className={INPUT_CLS + ' resize-none'} />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#2a2a3e]">
        <Button variant="secondary" size="sm" onClick={onClose}>取消</Button>
        <Button size="sm" onClick={handleSubmit} disabled={!form.provider || !form.model || !form.baseUrl}>保存</Button>
      </div>
    </Modal>
  )
}

// ─── Main Component ───
export default function ModelRouteEditor({ routes, onUpdate, onAdd, onDelete, onTest }: ModelRouteEditorProps) {
  const [filterStage, setFilterStage] = useState<ModelStage | 'all'>('all')
  const [showCustomOnly, setShowCustomOnly] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const customCount = routes.filter(r => r.isCustom).length
  let filtered = filterStage === 'all' ? routes : routes.filter(r => r.stage === filterStage)
  if (showCustomOnly) filtered = filtered.filter(r => r.isCustom)

  const grouped = STAGE_OPTIONS.map(stage => ({
    stage,
    ...STAGE_LABELS[stage],
    routes: filtered.filter(r => r.stage === stage).sort((a, b) => a.priority - b.priority),
  })).filter(g => g.routes.length > 0)

  const editRoute = editId ? routes.find(r => r.id === editId) : null

  const handleSaveEdit = (form: ModelFormData) => {
    if (!editId) return
    const data = formToRoute(form)
    onUpdate(editId, data)
  }

  const handleAdd = (form: ModelFormData) => {
    onAdd(formToRoute(form))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => { setFilterStage('all'); setShowCustomOnly(false) }} className={`px-3 py-1 rounded-md text-xs cursor-pointer transition-colors ${filterStage === 'all' && !showCustomOnly ? 'bg-[#6c5ce7] text-white' : 'text-[#a0a0b8] hover:text-white'}`}>
            全部 ({routes.length})
          </button>
          {STAGE_OPTIONS.map(s => {
            const count = routes.filter(r => r.stage === s).length
            return (
              <button key={s} onClick={() => { setFilterStage(s); setShowCustomOnly(false) }} className={`px-3 py-1 rounded-md text-xs cursor-pointer transition-colors ${filterStage === s && !showCustomOnly ? 'bg-[#6c5ce7] text-white' : 'text-[#a0a0b8] hover:text-white'}`}>
                {STAGE_LABELS[s].label} ({count})
              </button>
            )
          })}
          {customCount > 0 && (
            <button onClick={() => { setFilterStage('all'); setShowCustomOnly(true) }} className={`px-3 py-1 rounded-md text-xs cursor-pointer transition-colors ${showCustomOnly ? 'bg-[#e17055] text-white' : 'text-[#a0a0b8] hover:text-white'}`}>
              自定义 ({customCount})
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowAddCustom(true)}>+ 自定义接口</Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>+ 添加模型</Button>
        </div>
      </div>

      {/* Model cards grouped by stage */}
      {grouped.map(group => (
        <div key={group.stage}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full" style={{ background: group.color }} />
            <span className="text-xs font-medium text-[#a0a0b8]">{group.label}模型</span>
            <span className="text-xs text-[#a0a0b8]/50">({group.routes.length})</span>
          </div>

          <div className="space-y-2">
            {group.routes.map(route => {
              const isExpanded = expandedId === route.id
              const ts = TEST_STATUS_MAP[route.testStatus]

              return (
                <div key={route.id} className={`bg-[#1a1a2e] rounded-lg border transition-colors ${route.isActive ? 'border-[#2a2a3e]' : 'border-[#2a2a3e]/50 opacity-60'}`}>
                  {/* Row header */}
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : route.id)}>
                    <span className="text-xs w-5 text-[#a0a0b8]">P{route.priority}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{route.provider}</span>
                        <span className="text-xs text-[#a0a0b8] font-mono">{route.model}</span>
                        {route.isCustom && <Badge variant="yellow">自定义</Badge>}
                      </div>
                      {route.description && <p className="text-xs text-[#a0a0b8]/70 mt-0.5 truncate">{route.description}</p>}
                    </div>
                    <Badge variant={ts.variant}>{ts.label}</Badge>
                    <span className="text-xs text-[#a0a0b8] w-20 text-right">${route.costPerCall}/次</span>
                    <button
                      onClick={e => { e.stopPropagation(); onUpdate(route.id, { isActive: !route.isActive }) }}
                      className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer shrink-0 ${route.isActive ? 'bg-emerald-500' : 'bg-[#2a2a3e]'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${route.isActive ? 'left-5.5' : 'left-0.5'}`} />
                    </button>
                    <span className={`text-[#a0a0b8] text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-[#2a2a3e] pt-3">
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-xs">
                        <div>
                          <span className="text-[#a0a0b8]">请求地址</span>
                          <p className="text-white font-mono mt-0.5 break-all">{route.baseUrl}</p>
                        </div>
                        <div>
                          <span className="text-[#a0a0b8]">认证方式</span>
                          <p className="text-white mt-0.5">{AUTH_TYPE_LABELS[route.authType || 'bearer']}</p>
                        </div>
                        <div>
                          <span className="text-[#a0a0b8]">API Key</span>
                          <p className="text-white font-mono mt-0.5">{maskKey(route.apiKey)}</p>
                        </div>
                        {route.authHeaderName && (
                          <div>
                            <span className="text-[#a0a0b8]">Header 名</span>
                            <p className="text-white font-mono mt-0.5">{route.authHeaderName}</p>
                          </div>
                        )}
                        {route.apiVersion && (
                          <div>
                            <span className="text-[#a0a0b8]">API Version</span>
                            <p className="text-white font-mono mt-0.5">{route.apiVersion}</p>
                          </div>
                        )}
                        {route.httpMethod && route.isCustom && (
                          <div>
                            <span className="text-[#a0a0b8]">HTTP 方法</span>
                            <p className="text-white mt-0.5">{route.httpMethod}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-[#a0a0b8]">超时 / 重试</span>
                          <p className="text-white mt-0.5">{route.timeout}s / {route.maxRetries} 次</p>
                        </div>
                        {route.maxTokens && (
                          <div>
                            <span className="text-[#a0a0b8]">Max Tokens</span>
                            <p className="text-white mt-0.5">{route.maxTokens.toLocaleString()}</p>
                          </div>
                        )}
                        {route.temperature !== undefined && (
                          <div>
                            <span className="text-[#a0a0b8]">Temperature</span>
                            <p className="text-white mt-0.5">{route.temperature}</p>
                          </div>
                        )}
                        {route.lastTestedAt && (
                          <div>
                            <span className="text-[#a0a0b8]">上次测试</span>
                            <p className="text-white mt-0.5">
                              {new Date(route.lastTestedAt).toLocaleString('zh-CN')}
                              {route.testLatencyMs && <span className="text-emerald-400 ml-1">{route.testLatencyMs}ms</span>}
                            </p>
                          </div>
                        )}
                        {route.testError && (
                          <div className="col-span-2">
                            <span className="text-[#a0a0b8]">错误信息</span>
                            <p className="text-red-400 mt-0.5">{route.testError}</p>
                          </div>
                        )}
                      </div>

                      {/* 自定义接口额外展示 */}
                      {route.isCustom && (
                        <div className="mt-3 pt-3 border-t border-[#2a2a3e] space-y-3 text-xs">
                          {route.customHeaders && Object.keys(route.customHeaders).length > 0 && (
                            <div>
                              <span className="text-[#e17055]">自定义 Headers</span>
                              <pre className="mt-1 text-white font-mono bg-[#0a0a15] rounded px-3 py-2 overflow-x-auto">{JSON.stringify(route.customHeaders, null, 2)}</pre>
                            </div>
                          )}
                          {route.requestTemplate && (
                            <div>
                              <span className="text-[#e17055]">请求体模板</span>
                              <pre className="mt-1 text-white font-mono bg-[#0a0a15] rounded px-3 py-2 overflow-x-auto whitespace-pre-wrap">{route.requestTemplate}</pre>
                            </div>
                          )}
                          {route.responseMapping && (
                            <div>
                              <span className="text-[#e17055]">响应结果路径</span>
                              <p className="text-white font-mono mt-0.5">{route.responseMapping}</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#2a2a3e]">
                        <Button size="sm" variant="secondary" onClick={() => onTest(route.id)} disabled={route.testStatus === 'testing'}>
                          {route.testStatus === 'testing' ? '测试中...' : '测试连接'}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditId(route.id)}>编辑配置</Button>
                        <div className="flex-1" />
                        {deleteConfirmId === route.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-400">确认删除？</span>
                            <Button size="sm" variant="danger" onClick={() => { onDelete(route.id); setDeleteConfirmId(null); setExpandedId(null) }}>删除</Button>
                            <Button size="sm" variant="secondary" onClick={() => setDeleteConfirmId(null)}>取消</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="danger" onClick={() => setDeleteConfirmId(route.id)}>删除</Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[#a0a0b8]">暂无模型配置</div>
      )}

      {/* Edit modal */}
      {editRoute && (
        <ModelFormModal
          open={!!editId}
          onClose={() => setEditId(null)}
          initial={routeToForm(editRoute)}
          onSubmit={handleSaveEdit}
          title={`编辑：${editRoute.provider} / ${editRoute.model}`}
        />
      )}

      {/* Add standard model */}
      <ModelFormModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        initial={EMPTY_FORM}
        onSubmit={handleAdd}
        title="添加标准模型"
      />

      {/* Add custom interface */}
      <ModelFormModal
        open={showAddCustom}
        onClose={() => setShowAddCustom(false)}
        initial={EMPTY_CUSTOM_FORM}
        onSubmit={handleAdd}
        title="添加自定义接口"
      />
    </div>
  )
}
