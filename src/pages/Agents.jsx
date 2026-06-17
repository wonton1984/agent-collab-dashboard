import { useAgentTypes, useAgentInstances } from '../hooks/useAgents'
import AgentCard from '../components/AgentCard'
import { Bot } from 'lucide-react'

const typeGradients = [
  'from-indigo-500 to-blue-500',
  'from-violet-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
]

export default function Agents() {
  const { data: agentTypes } = useAgentTypes()
  const { data: instances, isLoading } = useAgentInstances()

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中…</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">Agent 管理</h2>
        <p className="text-sm text-gray-400 mt-1">查看接入 Dashboard 的所有 Agent 类型与实例</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {agentTypes?.map((type, idx) => (
          <div key={type.id} className="card p-5 text-center">
            <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${typeGradients[idx % typeGradients.length]} flex items-center justify-center text-white shadow-sm mb-3`}>
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900">{type.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {instances?.filter(i => i.agent_type_id === type.id).length ?? 0} 个实例
            </p>
            {type.capabilities?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2.5 justify-center">
                {type.capabilities.map((cap) => (
                  <span key={cap} className="text-[11px] px-2 py-0.5 rounded-md bg-gray-50 text-gray-500">
                    {cap}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <h3 className="section-title">所有实例</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {instances?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-300">
            <Bot className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm text-gray-400">暂无 Agent 实例</p>
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
