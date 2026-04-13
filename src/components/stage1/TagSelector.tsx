'use client'

import { useProjectStore } from '@/store/useProjectStore'
import { TYPE_TAGS, SETTING_TAGS, WORLD_TAGS, REGION_TAGS } from '@/lib/constants'
import type { TagSet } from '@/types'
import Pill from '@/components/shared/Pill'

const TAG_GROUPS = [
  { key: 'type' as keyof TagSet, label: '题材类型', tags: TYPE_TAGS, color: 'green' as const },
  { key: 'setting' as keyof TagSet, label: '场景设定', tags: SETTING_TAGS, color: 'green' as const },
  { key: 'world' as keyof TagSet, label: '世界观', tags: WORLD_TAGS, color: 'purple' as const },
  { key: 'region' as keyof TagSet, label: '目标地域', tags: REGION_TAGS, color: 'blue' as const },
]

export default function TagSelector() {
  const { project, setTag } = useProjectStore()
  if (!project) return null

  const tagSet = project.tagSet

  return (
    <div className="space-y-5">
      {TAG_GROUPS.map(group => (
        <div key={group.key}>
          <label className="text-sm font-medium text-[#a0a0b8] mb-2 block">{group.label}</label>
          <div className="flex flex-wrap gap-2">
            {group.tags.map(tag => (
              <Pill
                key={tag}
                label={tag}
                active={tagSet[group.key] === tag}
                color={group.color}
                size="sm"
                onClick={() => setTag(group.key, tag as any)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
