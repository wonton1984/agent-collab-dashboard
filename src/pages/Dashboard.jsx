import { useProjects } from '../hooks/useProjects'
import { useAgentTypes } from '../hooks/useAgents'
import { useActivityLog } from '../hooks/useActivityLog'
import StatsCard from '../components/StatsCard'
import ActivityFeed from '../components/ActivityFeed'
import { FolderKanban, Activity, PauseCircle, Bot } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4']

export default function Dashboard() {
  const { data: projects, isLoading } = useProjects()
  const { data: agentTypes } = useAgentTypes()
  const { data: recentLogs } = useActivityLog({}, 8)

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中…</div>
  }

  const inProgress = projects?.filter(p => p.status === 'in_progress').length ?? 0
  const paused = projects?.filter(p => p.status === 'paused').length ?? 0

  const typeCount = {}
  projects?.forEach(p => {
    typeCount[p.project_type] = (typeCount[p.project_type] || 0) + 1
  })
  const pieData = Object.entries(typeCount).map(([name, value]) => ({
    name: { engineering: '工程', paper: '论文', research: '研究', learning: '学习', literature: '文献' }[name] || name,
    value,
  }))

  const agentProjectCount = {}
  projects?.forEach(p => {
    if (p.leader_agent_type?.name) {
      agentProjectCount[p.leader_agent_type.name] = (agentProjectCount[p.leader_agent_type.name] || 0) + 1
    }
  })
  const agentRanking = Object.entries(agentProjectCount)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="page-title">概览</h2>
        <p className="text-sm text-gray-400 mt-1">实时追踪所有 Agent 的协作进度</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={FolderKanban} label="总项目" value={projects?.length ?? 0} color="blue" />
        <StatsCard icon={Activity} label="进行中" value={inProgress} color="green" />
        <StatsCard icon={PauseCircle} label="暂停中" value={paused} color="yellow" />
        <StatsCard icon={Bot} label="Agent 种类" value={agentTypes?.length ?? 0} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="section-title mb-4">项目类型分布</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #f0f1f3',
                    boxShadow: '0 4px 12px -2px rgb(17 24 39 / 0.1)',
                    fontSize: 12,
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-300 text-sm text-center py-8">暂无项目数据</p>
          )}
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">Agent 负责项目数</h3>
          {agentRanking.length > 0 ? (
            <div className="space-y-3.5">
              {agentRanking.map((agent) => {
                const max = Math.max(...agentRanking.map(a => a.count))
                return (
                  <div key={agent.name} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 w-16 truncate">{agent.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="progress-bar h-2"
                        style={{ width: `${(agent.count / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-400 w-6 text-right tabular-nums">{agent.count}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-300 text-sm text-center py-8">暂无 Agent 数据</p>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="section-title mb-4">近期活动</h3>
        <ActivityFeed logs={recentLogs} />
      </div>
    </div>
  )
}
