'use client'

import { useState } from 'react'
import { useAdminStore } from '@/store/useAdminStore'
import ModelRouteEditor from '@/components/admin/ModelRouteEditor'
import FeatureFlagToggle from '@/components/admin/FeatureFlagToggle'
import Button from '@/components/shared/Button'

export default function AdminSystemPage() {
  const {
    systemConfig, updateModelRoute, addModelRoute, deleteModelRoute,
    testModelConnection, toggleFeatureFlag, updateCreditPrice,
  } = useAdminStore()
  const [price, setPrice] = useState(String(systemConfig.creditPriceYuan))

  const handlePriceUpdate = () => {
    const p = parseFloat(price)
    if (!isNaN(p) && p > 0) updateCreditPrice(p)
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold text-white">系统配置</h2>

      {/* Model routes — full management */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-white">模型管理</h3>
            <p className="text-xs text-[#a0a0b8] mt-0.5">配置各阶段 AI 模型的 API 对接、优先级和费用</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#a0a0b8]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 已启用 {systemConfig.modelRoutes.filter(r => r.isActive).length}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2a2a3e]" /> 已停用 {systemConfig.modelRoutes.filter(r => !r.isActive).length}</span>
          </div>
        </div>
        <ModelRouteEditor
          routes={systemConfig.modelRoutes}
          onUpdate={updateModelRoute}
          onAdd={addModelRoute}
          onDelete={deleteModelRoute}
          onTest={testModelConnection}
        />
      </div>

      {/* Credit pricing */}
      <div className="card p-5">
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-4">积分单价</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white">¥</span>
            <input type="number" step="0.001" value={price} onChange={e => setPrice(e.target.value)} className="w-32 bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#6c5ce7]" />
            <span className="text-sm text-[#a0a0b8]">/ 积分</span>
          </div>
          <Button size="sm" onClick={handlePriceUpdate}>更新</Button>
        </div>
      </div>

      {/* Feature flags */}
      <div className="card p-5">
        <h3 className="text-sm font-medium text-[#a0a0b8] mb-4">功能开关</h3>
        <FeatureFlagToggle flags={systemConfig.featureFlags} onToggle={toggleFeatureFlag} />
      </div>
    </div>
  )
}
