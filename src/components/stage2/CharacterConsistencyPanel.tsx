'use client'

import { useProjectStore } from '@/store/useProjectStore'
import Button from '@/components/shared/Button'

export default function CharacterConsistencyPanel() {
  const { project, lockCharacter, unlockCharacter } = useProjectStore()

  if (!project) return null

  const characters = project.assetLibrary.characters

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-1">🔒 角色一致性</h3>
        <p className="text-xs text-[#6a6a8e]">
          锁定角色形象后，后续镜头中该角色将保持相同外貌
        </p>
      </div>

      {characters.length === 0 && (
        <div className="text-center py-4 text-[#6a6a8e] text-sm">
          暂无角色，请先生成剧本和资产
        </div>
      )}

      <div className="space-y-3">
        {characters.map((char) => (
          <div
            key={char.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              char.isLocked
                ? 'border-[#6c5ce7]/50 bg-[#6c5ce7]/5'
                : 'border-[#2a2a3e] bg-[#12121e]'
            }`}
          >
            {/* Avatar */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#1a1a2e]">
              {char.imageUrl && (
                <img
                  src={char.imageUrl}
                  alt={char.name}
                  className="w-full h-full object-cover"
                />
              )}
              {char.isLocked && (
                <div className="absolute top-0 right-0 bg-[#6c5ce7] text-white text-[8px] px-1 rounded-bl" title="已集成拍摄参考">
                  🔒
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white truncate">{char.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  char.tier === 'lead'
                    ? 'bg-[#6c5ce7]/20 text-[#6c5ce7]'
                    : char.tier === 'antagonist'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-[#2a2a3e] text-[#a0a0b8]'
                }`}>
                  {char.tier === 'lead' ? '主角' : char.tier === 'antagonist' ? '反派' : '配角'}
                </span>
              </div>
              <p className="text-xs text-[#6a6a8e] truncate mt-0.5">{char.description}</p>
              {char.isLocked && char.lockedImageUrl && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <img
                    src={char.lockedImageUrl}
                    alt="参考图"
                    className="w-7 h-7 rounded object-cover border border-[#6c5ce7]/40"
                    title="第三步拍摄时将使用此形象作为参考"
                  />
                  <span className="text-[10px] text-[#6c5ce7]" title="锁定角色后，第三步拍摄时将使用此形象作为参考">
                    参考图已锁定
                  </span>
                </div>
              )}
            </div>

            {/* Lock/Unlock button */}
            <Button
              size="sm"
              variant={char.isLocked ? 'ghost' : 'primary'}
              onClick={() =>
                char.isLocked ? unlockCharacter(char.id) : lockCharacter(char.id)
              }
              className="flex-shrink-0"
              title={char.isLocked ? '解锁角色形象' : '锁定角色后，第三步拍摄时将使用此形象作为参考'}
            >
              {char.isLocked ? '解锁' : '锁定'}
            </Button>
          </div>
        ))}
      </div>

      {/* Stats */}
      {characters.length > 0 && (
        <div className="pt-2 border-t border-[#2a2a3e] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#6a6a8e]">
              {characters.filter((c) => c.isLocked).length} / {characters.length} 已锁定
            </span>
            {characters.filter((c) => c.isLocked).length === characters.length && characters.length > 0 && (
              <span className="text-[#00b894]">✓ 所有角色已锁定</span>
            )}
          </div>
          {characters.some(c => c.isLocked) && (
            <div className="text-[10px] text-[#6c5ce7] bg-[#6c5ce7]/10 rounded-lg px-2 py-1.5">
              ✓ 已集成拍摄 — 第三步生成镜头时将以锁定图像为参考，保持角色外貌一致
            </div>
          )}
        </div>
      )}
    </div>
  )
}
