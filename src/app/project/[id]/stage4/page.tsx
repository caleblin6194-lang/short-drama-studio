'use client'

import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import VideoPlayer from '@/components/stage4/VideoPlayer'
import SubtitleBGMPanel from '@/components/stage4/SubtitleBGMPanel'
import SubtitleStylePanel from '@/components/stage4/SubtitleStylePanel'
import SmartAudioPanel from '@/components/stage4/SmartAudioPanel'
import ExportPanel from '@/components/stage4/ExportPanel'
import VariantList from '@/components/stage4/VariantList'
import Button from '@/components/shared/Button'
import Spinner from '@/components/shared/Spinner'
import Tabs from '@/components/shared/Tabs'
import TalkToEdit from '@/components/stage-chat/TalkToEdit'
import CliffhangerPanel from '@/components/stage4/CliffhangerPanel'
import EmotionalBGMMapper from '@/components/stage4/EmotionalBGMMapper'

export default function Stage4Page() {
  const {
    project, renderMasterCut, cancelRender, isRendering,
    toggleSubtitles, toggleBgm, createVariant,
    setSubtitleStyle,
  } = useProjectStore()
  const [activeTab, setActiveTab] = useState('settings')

  if (!project) return null

  const mc = project.masterCut

  const tabs = [
    { key: 'settings', label: '设置' },
    { key: 'subtitle', label: '字幕样式' },
    { key: 'audio', label: 'AI 配乐' },
    { key: 'chat', label: '对话剪辑' },
    { key: 'cliffhanger', label: '悬念结尾' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">第四步：成片预览</h2>
        <p className="text-sm text-[#a0a0b8]">预览、调整字幕和 BGM，导出或生成地域变体</p>
      </div>

      {/* 渲染控制栏（常驻） */}
      <div className="flex items-center gap-3 flex-wrap">
        {!isRendering ? (
          <Button onClick={renderMasterCut} variant={mc ? 'ghost' : 'primary'} size={mc ? 'sm' : 'md'}>
            {mc ? '🔄 重新渲染' : '渲染成片'}
          </Button>
        ) : (
          <>
            <Spinner size={18} label="正在渲染成片..." />
            <Button onClick={cancelRender} variant="secondary" size="sm">⏸ 取消渲染</Button>
          </>
        )}
        {mc && !isRendering && (
          <span className="text-xs text-[#6a6a8e]">成片时长 {mc.durationSec}s · 点击重新渲染可更新</span>
        )}
      </div>

      {/* 主体布局：左侧播放器 + 右侧控制面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <VideoPlayer masterCut={mc} shots={project.shots} />

        <div className="space-y-4">
          {mc && (
            <>
              {/* Tab 切换 */}
              <Tabs items={tabs} activeKey={activeTab} onChange={setActiveTab} />

              {activeTab === 'settings' && (
                <>
                  <SubtitleBGMPanel
                    subtitlesEnabled={mc.subtitlesEnabled}
                    bgmEnabled={mc.bgmEnabled}
                    bgmTrack={mc.bgmTrack}
                    onToggleSubtitles={toggleSubtitles}
                    onToggleBgm={toggleBgm}
                  />
                  <ExportPanel />
                </>
              )}

              {activeTab === 'subtitle' && (
                <SubtitleStylePanel
                  style={mc.subtitleStyle}
                  onChange={setSubtitleStyle}
                />
              )}

              {activeTab === 'audio' && (
                <>
                  <SmartAudioPanel
                    currentBgmEnabled={mc.bgmEnabled}
                    currentBgmTrack={mc.bgmTrack}
                  />
                  <EmotionalBGMMapper />
                </>
              )}

              {activeTab === 'chat' && (
                <TalkToEdit projectId={project.id} />
              )}

              {activeTab === 'cliffhanger' && (
                <CliffhangerPanel />
              )}
            </>
          )}
        </div>
      </div>

      {/* 地域变体 */}
      {mc && (
        <VariantList variants={project.variants} onCreateVariant={createVariant} />
      )}
    </div>
  )
}
