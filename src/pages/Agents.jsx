import { useAgentTypes, useAgentInstances } from '../hooks/useAgents'
import AgentCard from '../components/AgentCard'
import { Bot } from 'lucide-react'

export default function Agents() {
  const { data: agentTypes } = useAgentTypes()
  const { data: instances, isLoading } = useAgentInstances()

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">🤖 Agent 管理</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {agentTypes?.map((type) => (
          <div key={type.id} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <Bot className="w-8 h-8 mx-auto text-purple-500 mb-2" />
            <h3 className="font-semibold text-gray-900">{type.name}</h3>
            <p className="text-xs text-gray-400 mt-1">
              {instances?.filter(i => i.agent_type_id === type.id).length ?? 0} 个实例
            </p>
            {type.capabilities?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 justify-center">
                {type.capabilities.map((cap) => (
                  <span key={cap} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {cap}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-gray-900">所有实例</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {instances?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            <p>暂无 Agent 实例</p>
            <p className="text-sm mt-1">在 Supabase 中插入种子数据后即可看到实例</p>
          </div>
        ) : (
          instances?.map((instance) => (
            <AgentCard key={instance.id} instance={instance} />
          ))
        )}
      </div>
    </div>
  )
}
