'use client'

import { useState, useRef, useEffect } from 'react'

/* ─── 数据定义 ─── */
const STEPS = [
  { label: '作品筛选', title: '作品分类与筛选', sub: '选择目标受众、类型等（可跳过）' },
  { label: '剧本策划', title: '剧本策划', sub: '填写故事核心设定（可跳过）' },
  { label: 'AI写剧本', title: 'AI 剧本生成', sub: '根据筛选条件自动生成剧本' },
  { label: '分镜生成', title: 'AI 分镜板', sub: '自动生成分镜脚本与画面描述' },
  { label: '制作配置', title: '制作配置', sub: '主角、道具、场景各需至少上传一张图片' },
  { label: '导出发布', title: '导出与发布', sub: '一键导出制作包' },
]

const CATS: Record<string, { icon: string; tags: string[] }> = {
  类型: { icon: '📚', tags: ['穿越','逆袭','重生','爱情','玄幻','现代言情','总裁','虐恋','甜宠','神豪','女性成长','古风权谋','家庭伦理','复仇','悬疑推理','古风言情','生活','刑侦','恐怖'] },
  受众: { icon: '👥', tags: ['男频','女频'] },
  设定: { icon: '🎭', tags: ['大女主','马甲','小人物','无敌神医','草根','扮猪吃虎','青梅竹马','打脸虐渣','先婚后爱','都市修仙','闪婚','萌宝','豪门恩怨','强者回归','破镜重圆','欢喜冤家','赘婿逆袭','暗恋成真','亲情','传承觉醒'] },
  背景: { icon: '🌍', tags: ['古风','架空','民国','乡村','现代','星际','都市'] },
}

interface ConceptData {
  title?: string; eps?: string; synopsis?: string; lead?: string; antag?: string
}

interface ProductionImages {
  actor: string[]; prop: string[]; scene: string[]
}

/* ─── 主组件 ─── */
export default function CreatePage() {
  const [cur, setCur] = useState(0)
  const [done, setDone] = useState<Set<number>>(new Set())
  const [sel, setSel] = useState<Record<string, Set<string>>>(
    () => Object.fromEntries(Object.keys(CATS).map(k => [k, new Set<string>()]))
  )
  const [concept, setConcept] = useState<ConceptData>({})
  const [script, setScript] = useState('')
  const [scriptTab, setScriptTab] = useState<'ai' | 'manual' | 'import'>('ai')
  const [boardContent, setBoardContent] = useState('')
  const [images, setImages] = useState<ProductionImages>({ actor: [], prop: [], scene: [] })
  const [mounted, setMounted] = useState(false)
  const [genLoading, setGenLoading] = useState(false)
  const [boardLoading, setBoardLoading] = useState(false)
  const [manualSaved, setManualSaved] = useState(false)
  const [prodError, setProdError] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const uploadTarget = useRef<keyof ProductionImages | null>(null)
  const txtFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const progress = Math.round((done.size / STEPS.length) * 100)
  const allTags = Object.entries(sel).flatMap(([, s]) => [...s])
  const imgValid = images.actor.length > 0 && images.prop.length > 0 && images.scene.length > 0

  function go(i: number) { setCur(i) }

  function prev() {
    if (cur > 0) { setDone(d => new Set([...d, cur])); setCur(c => c - 1) }
  }

  function next() {
    if (cur === 4 && !imgValid) { setProdError(true); setTimeout(() => setProdError(false), 3000); return }
    setDone(d => new Set([...d, cur]))
    if (cur < STEPS.length - 1) setCur(c => c + 1)
  }

  function toggleTag(cat: string, tag: string) {
    setSel(prev => {
      const next = { ...prev, [cat]: new Set(prev[cat]) }
      next[cat].has(tag) ? next[cat].delete(tag) : next[cat].add(tag)
      return next
    })
  }

  async function genScript() {
    setGenLoading(true)
    try {
      const res = await fetch('/api/title/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tags: allTags,
          title: concept.title,
          synopsis: concept.synopsis,
          lead: concept.lead,
          antag: concept.antag,
          mode: 'script',
        }),
      })
      const data = await res.json()
      setScript(data.text || data.title || '生成失败，请重试')
    } catch {
      setScript('生成失败，请切换到手动输入')
    } finally {
      setGenLoading(false)
    }
  }

  async function genBoard() {
    setBoardLoading(true)
    try {
      const res = await fetch('/api/shots/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptText: script || '通用短剧', count: 6 }),
      })
      const data = await res.json()
      if (data.shots) {
        setBoardContent(data.shots.map((s: { number: string; description: string; dialogue: string; durationSec: number; cameraDirection?: string }) =>
          `镜${s.number} | ${s.cameraDirection || '固定'} | ${s.description} | ${s.dialogue} | ${s.durationSec}s`
        ).join('\n'))
      } else {
        setBoardContent('生成失败')
      }
    } catch {
      setBoardContent('生成失败')
    } finally {
      setBoardLoading(false)
    }
  }

  function openUpload(target: keyof ProductionImages) {
    uploadTarget.current = target
    if (fileRef.current) { fileRef.current.value = ''; fileRef.current.click() }
  }

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const target = uploadTarget.current
    if (!files.length || !target) return
    files.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => {
        setImages(prev => ({ ...prev, [target]: [...prev[target], ev.target?.result as string] }))
      }
      reader.readAsDataURL(f)
    })
  }

  function removeImg(target: keyof ProductionImages, idx: number) {
    setImages(prev => ({ ...prev, [target]: prev[target].filter((_, i) => i !== idx) }))
  }

  function importTxt(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = ev => { setScript(ev.target?.result as string || ''); setScriptTab('manual') }
    r.readAsText(f, 'UTF-8')
  }

  /* ─── 样式常量 ─── */
  const s = {
    pill: 'inline-flex items-center gap-1 bg-[#14532d] text-[#86efac] text-xs font-medium px-3 py-1 rounded-full mb-2',
    tag: (active: boolean) =>
      `px-3 py-1 rounded-full text-sm cursor-pointer border transition-all select-none ${
        active ? 'bg-[#14532d] text-[#86efac] border-[#166534]' : 'border-[#2a2a2a] text-[#aaa] hover:border-[#22c55e] hover:text-[#22c55e]'
      }`,
    card: 'bg-[#161616] rounded-lg p-4 border border-[#2a2a2a]',
    input: 'w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#e5e5e5] outline-none focus:border-[#166534] font-sans',
    label: 'text-xs text-[#555] block mb-1.5',
    note: 'text-xs text-[#666] p-2 px-3 bg-[#161616] rounded-lg border border-[#2a2a2a] mb-4',
    warn: 'text-xs text-[#b45309] p-2 px-3 bg-[#1c1500] rounded-lg border border-[#3d2e00] mb-4',
    btnGreen: 'px-5 py-2 rounded-lg text-sm cursor-pointer border bg-[#166534] text-[#dcfce7] border-[#166534] hover:bg-[#14532d] transition-all font-sans',
    btnGhost: 'px-5 py-2 rounded-lg text-sm cursor-pointer border border-[#2a2a2a] bg-transparent text-[#aaa] hover:bg-[#1e1e1e] hover:text-[#e5e5e5] transition-all font-sans',
    tab: (active: boolean) =>
      `flex-1 py-2 text-sm cursor-pointer border-none font-sans transition-all ${
        active ? 'bg-[#14532d] text-[#86efac] font-medium' : 'bg-[#161616] text-[#666] hover:bg-[#1e1e1e] hover:text-[#aaa]'
      }`,
  }

  /* ─── 步骤内容渲染 ─── */
  function renderStep() {
    switch (cur) {
      /* 步骤1：作品筛选 */
      case 0: return (
        <div className="animate-[fadeIn_0.2s_ease]">
          <p className={s.note}>每个分类均可跳过，直接点击"下一步"继续</p>
          {Object.entries(CATS).map(([cat, { icon, tags }]) => (
            <div key={cat}>
              <span className={s.pill}>{icon} {cat}</span>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {tags.map(t => (
                  <button key={t} className={s.tag(sel[cat].has(t))} onClick={() => toggleTag(cat, t)}>{t}</button>
                ))}
              </div>
            </div>
          ))}
          <div className={s.card}>
            <p className="text-xs text-[#444] mb-2">已选标签</p>
            <div className="flex flex-wrap gap-1.5">
              {allTags.length > 0
                ? allTags.map(t => <span key={t} className="text-xs px-2 py-0.5 bg-[#1e1e1e] rounded-lg text-[#666] border border-[#2a2a2a]">{t}</span>)
                : <span className="text-xs text-[#444]">暂未选择</span>
              }
            </div>
          </div>
        </div>
      )

      /* 步骤2：剧本策划 */
      case 1: return (
        <div className="animate-[fadeIn_0.2s_ease]">
          <p className={s.note}>填写越详细 AI 生成越贴近；也可直接跳过</p>
          <div className="grid grid-cols-2 gap-3">
            <div className={s.card}>
              <label className={s.label}>剧集标题</label>
              <input className={s.input} placeholder="例：《重生千金归来》" value={concept.title || ''} onChange={e => setConcept(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className={s.card}>
              <label className={s.label}>集数 / 时长</label>
              <input className={s.input} placeholder="例：100集，每集1分钟" value={concept.eps || ''} onChange={e => setConcept(p => ({ ...p, eps: e.target.value }))} />
            </div>
            <div className={`${s.card} col-span-2`}>
              <label className={s.label}>故事简介</label>
              <textarea className={s.input} rows={3} placeholder="核心冲突和人物弧线…" value={concept.synopsis || ''} onChange={e => setConcept(p => ({ ...p, synopsis: e.target.value }))} />
            </div>
            <div className={s.card}>
              <label className={s.label}>主角设定</label>
              <textarea className={s.input} rows={3} placeholder="性格、背景、特殊能力…" value={concept.lead || ''} onChange={e => setConcept(p => ({ ...p, lead: e.target.value }))} />
            </div>
            <div className={s.card}>
              <label className={s.label}>反派 / 障碍</label>
              <textarea className={s.input} rows={3} placeholder="对立面人物或核心障碍…" value={concept.antag || ''} onChange={e => setConcept(p => ({ ...p, antag: e.target.value }))} />
            </div>
          </div>
        </div>
      )

      /* 步骤3：AI写剧本 */
      case 2: return (
        <div className="animate-[fadeIn_0.2s_ease]">
          <div className="flex border border-[#2a2a2a] rounded-lg overflow-hidden mb-4">
            {(['ai', 'manual', 'import'] as const).map((t, i) => (
              <button key={t} className={s.tab(scriptTab === t)}
                style={{ borderRight: i < 2 ? '1px solid #2a2a2a' : 'none' }}
                onClick={() => setScriptTab(t)}>
                {t === 'ai' ? '✨ AI 生成' : t === 'manual' ? '✏️ 手动输入' : '📄 导入文件'}
              </button>
            ))}
          </div>

          {scriptTab === 'ai' && (
            <div>
              {allTags.length > 0
                ? <div className="flex flex-wrap gap-1.5 mb-3">{allTags.map(t => <span key={t} className="text-xs px-2 py-0.5 bg-[#1e1e1e] rounded-lg text-[#666] border border-[#2a2a2a]">{t}</span>)}</div>
                : <p className={s.note}>未选标签，将生成通用剧本</p>
              }
              <button className={`${s.btnGreen} w-full py-3 text-sm`} onClick={genScript} disabled={genLoading}>
                {genLoading ? '生成中…' : '✨ 开始 AI 生成剧本'}
              </button>
              <div className="mt-3">
                {genLoading
                  ? <div className="text-center py-12 text-[#555] text-sm">AI 生成中...</div>
                  : script
                    ? <><pre className="bg-[#161616] rounded-lg p-4 border border-[#2a2a2a] text-sm leading-relaxed whitespace-pre-wrap text-[#ccc] max-h-72 overflow-y-auto">{script}</pre>
                        <button className={`${s.btnGhost} w-full mt-2`} onClick={genScript}>↺ 重新生成</button></>
                    : <div className="text-center py-12 text-[#444] text-sm">点击上方按钮开始生成</div>
                }
              </div>
            </div>
          )}

          {scriptTab === 'manual' && (
            <div>
              <p className="text-xs text-[#555] mb-2">直接输入或粘贴剧本内容，完成后点击"保存剧本"</p>
              <textarea className={`${s.input} resize-y`} rows={14} placeholder={'在此粘贴或输入剧本内容…\n\n例：\n【剧名】《重生千金归来》\n【第一集】初遇风云…'} value={script} onChange={e => { setScript(e.target.value); setManualSaved(false) }} style={{ lineHeight: '1.8' }} />
              <div className="flex gap-2 mt-2">
                <button className={`${s.btnGreen} flex-1 py-2.5`} onClick={() => setManualSaved(true)}>💾 保存剧本</button>
                <button className={`${s.btnGhost} px-4`} onClick={() => { setScript(''); setManualSaved(false) }}>清空</button>
              </div>
              {manualSaved && <div className="mt-2 text-xs text-[#22c55e] p-2 px-3 bg-[#0d2918] rounded-lg border border-[#166534]">✓ 剧本已保存，可继续下一步</div>}
            </div>
          )}

          {scriptTab === 'import' && (
            <div>
              <p className="text-xs text-[#555] mb-2">支持 .txt 文本文件，导入后可在"手动输入"标签中编辑</p>
              <div className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-10 text-center cursor-pointer hover:border-[#166534] hover:bg-[#0d1f0d] transition-all"
                onClick={() => txtFileRef.current?.click()}>
                <div className="text-3xl mb-2">📄</div>
                <p className="text-sm text-[#666] mb-1">点击选择文件，或将文件拖拽到此处</p>
                <span className="text-xs text-[#444]">支持 .txt 格式</span>
              </div>
              <input ref={txtFileRef} type="file" accept=".txt,text/plain" className="hidden" onChange={importTxt} />
              {script && (
                <div className="mt-4">
                  <p className="text-xs text-[#555] mb-1.5">当前已有剧本内容：</p>
                  <pre className="bg-[#161616] rounded-lg p-4 border border-[#2a2a2a] text-sm text-[#ccc] max-h-44 overflow-y-auto whitespace-pre-wrap">{script}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )

      /* 步骤4：分镜生成 */
      case 3: return (
        <div className="animate-[fadeIn_0.2s_ease]">
          <p className={s.note}>AI 将根据剧本拆解分镜；可跳过</p>
          {!script && <div className="p-5 text-center text-[#444] text-sm bg-[#161616] rounded-lg">请先完成"AI写剧本"步骤</div>}
          {script && (
            <>
              <button className={`${s.btnGreen} w-full py-3 text-sm mb-3`} onClick={genBoard} disabled={boardLoading}>
                {boardLoading ? '拆解分镜中...' : '🎬 生成分镜脚本'}
              </button>
              {boardLoading && <div className="text-center py-12 text-[#555] text-sm">拆解分镜中...</div>}
              {boardContent && !boardLoading && (
                <>
                  <div className="bg-[#161616] rounded-lg p-4 border border-[#2a2a2a] text-sm max-h-72 overflow-y-auto">
                    {boardContent.split('\n').filter(l => l.trim()).map((l, i) => (
                      <div key={i} className="py-1.5 border-b border-[#222] text-[#ccc] last:border-0">{l}</div>
                    ))}
                  </div>
                  <button className={`${s.btnGhost} w-full mt-2`} onClick={genBoard}>↺ 重新生成</button>
                </>
              )}
            </>
          )}
        </div>
      )

      /* 步骤5：制作配置 */
      case 4: return (
        <div className="animate-[fadeIn_0.2s_ease]">
          <p className={imgValid ? s.note : s.warn}>
            {imgValid ? '✓ 三类图片均已上传，可继续下一步' : '主角、道具、场景各需至少上传一张图片才能进入下一步'}
          </p>
          {([['actor','主角','🧑'], ['prop','道具','🗡️'], ['scene','场景','🏯']] as const).map(([k, l, icon]) => (
            <div key={k} className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className={s.pill} style={{ marginBottom: 0 }}>{icon} {l}</span>
                <span className={`text-xs px-2 py-0.5 rounded-lg border ${images[k].length > 0 ? 'bg-[#0d2918] text-[#22c55e] border-[#166534]' : 'bg-[#1c1500] text-[#b45309] border-[#3d2e00]'}`}>
                  {images[k].length > 0 ? `✓ 已上传 ${images[k].length} 张` : '必填'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {images[k].map((src, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#2a2a2a]">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button className="absolute top-1 right-1 w-4.5 h-4.5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center leading-none border-none cursor-pointer"
                      onClick={() => removeImg(k, idx)}>✕</button>
                  </div>
                ))}
                <button className="w-20 h-20 rounded-lg border border-dashed border-[#333] bg-transparent cursor-pointer flex flex-col items-center justify-center gap-1 text-[#444] text-xs hover:border-[#22c55e] hover:text-[#22c55e] transition-all"
                  onClick={() => openUpload(k)}>
                  <span className="text-2xl font-light leading-none">+</span>
                  <span>添加</span>
                </button>
              </div>
            </div>
          ))}
          {prodError && <div className="text-xs text-[#dc2626] p-3 bg-[#1c0000] rounded-lg border border-[#3d0000] mt-3">请为主角、道具、场景各上传至少一张图片后再继续</div>}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className={s.card}>
              <label className={s.label}>画面比例</label>
              <select className={s.input}>
                <option>竖版 9:16（推荐）</option>
                <option>横版 16:9</option>
                <option>方形 1:1</option>
              </select>
            </div>
            <div className={s.card}>
              <label className={s.label}>画面风格</label>
              <select className={s.input}>
                <option>写实真人</option>
                <option>古风国漫</option>
                <option>AI插画</option>
                <option>赛博朋克</option>
              </select>
            </div>
          </div>
        </div>
      )

      /* 步骤6：导出发布 */
      case 5: {
        const tagCount = Object.values(sel).reduce((n, s) => n + s.size, 0)
        const imgCount = Object.values(images).reduce((n, a) => n + a.length, 0)
        const items = [
          ['📚', '分类标签', tagCount ? `${tagCount} 个标签已选` : '未选择'],
          ['📝', '剧本策划', concept.title || '通用设定'],
          ['✨', 'AI剧本', script ? '已生成（3集大纲）' : '未生成'],
          ['🎬', '分镜脚本', boardContent ? '已生成' : '按需生成'],
          ['🖼', '参考图片', `共 ${imgCount} 张（主角/道具/场景）`],
        ]
        return (
          <div className="animate-[fadeIn_0.2s_ease]">
            <div className="text-center py-6 pb-5">
              <div className="w-14 h-14 rounded-full bg-[#14532d] text-[#86efac] flex items-center justify-center text-3xl mx-auto mb-3">✓</div>
              <p className="text-base font-medium mb-1">制作包已就绪</p>
              <p className="text-sm text-[#555]">以下内容已生成，可一键导出</p>
            </div>
            {items.map(([icon, name, desc]) => (
              <div key={name} className="flex items-center gap-3 p-3 bg-[#161616] rounded-lg mb-2 border border-[#2a2a2a]">
                <div className="w-9 h-9 rounded-lg bg-[#14532d] text-[#86efac] flex items-center justify-center text-base flex-shrink-0">{icon}</div>
                <div>
                  <div className="text-sm font-medium text-[#e5e5e5]">{name}</div>
                  <div className="text-xs text-[#555]">{desc}</div>
                </div>
              </div>
            ))}
            <button className={`${s.btnGreen} w-full py-3 mt-4 text-sm`}>⬇ 导出制作包</button>
          </div>
        )
      }

      default: return null
    }
  }

  return (
    <div className="flex w-full min-h-screen" style={{ background: '#0f0f0f', color: '#e5e5e5' }}>
      {/* 侧边栏 */}
      <div className="w-[220px] flex-shrink-0 flex flex-col" style={{ background: '#161616', borderRight: '1px solid #2a2a2a' }}>
        <div className="px-4 py-5 text-xs font-semibold tracking-widest uppercase" style={{ color: '#555', borderBottom: '1px solid #2a2a2a' }}>
          制作流水线
        </div>
        <div className="flex-1 p-2 overflow-y-auto">
          {STEPS.map((step, i) => (
            <div key={i} onClick={() => go(i)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer mb-0.5 transition-colors"
              style={{
                background: i === cur ? '#1a2e1a' : 'transparent',
                border: i === cur ? '1px solid #2a4a2a' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (i !== cur) (e.currentTarget as HTMLDivElement).style.background = '#1e1e1e' }}
              onMouseLeave={e => { if (i !== cur) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                style={{
                  background: done.has(i) ? '#14532d' : i === cur ? '#166534' : '#222',
                  color: done.has(i) ? '#86efac' : i === cur ? '#dcfce7' : '#555',
                }}>
                {done.has(i) ? '✓' : i + 1}
              </div>
              <span className="text-sm" style={{ color: i === cur ? '#e5e5e5' : done.has(i) ? '#555' : '#888', fontWeight: i === cur ? 500 : 400 }}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
        {/* 进度 */}
        <div className="p-3.5" style={{ borderTop: '1px solid #2a2a2a' }}>
          <div className="text-xs mb-1.5" style={{ color: '#444' }}>整体进度</div>
          <div className="h-0.5 rounded-full overflow-hidden" style={{ background: '#2a2a2a' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: '#166534' }} />
          </div>
          <div className="text-xs mt-1.5" style={{ color: '#555' }}>{done.size} / {STEPS.length} 步骤</div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #2a2a2a', background: '#0f0f0f' }}>
          <div>
            <h2 className="text-base font-medium" style={{ color: '#e5e5e5' }}>{STEPS[cur].title}</h2>
            <p className="text-xs mt-0.5" style={{ color: '#555' }}>{STEPS[cur].sub}</p>
          </div>
          <div className="flex gap-2">
            {cur > 0 && <button className={s.btnGhost} onClick={prev}>← 上一步</button>}
            <button className={s.btnGreen} onClick={next}>
              {cur === STEPS.length - 1 ? '完成 ✓' : '下一步 →'}
            </button>
          </div>
        </div>
        {/* 进度条线 */}
        <div className="h-0.5" style={{ background: '#1a1a1a' }}>
          <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, background: '#166534' }} />
        </div>
        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStep()}
        </div>
      </div>

      {/* 隐藏 input */}
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
    </div>
  )
}
