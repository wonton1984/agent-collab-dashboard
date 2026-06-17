import { useState } from 'react'
import { useActivityLog } from '../hooks/useActivityLog'
import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'

const eventConfig = {
  status_change: { icon: '🔄', label: '状态变更', ring: 'bg-gray-100' },
  task_complete: { icon: '✅', label: '任务完成', ring: 'bg-emerald-100' },
  note:          { icon: '📝', label: '备注',     ring: 'bg-amber-100' },
  manual_edit:   { icon: '✏️', label: '手动编辑', ring: 'bg-blue-100' },
  agent_report:  { icon: '🤖', label: 'Agent 上报', ring: 'bg-violet-100' },
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return '今天'
  if (d.toDateString() === yesterday.toDateString()) return '昨天'
  return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export default function ActivityLog() {
  const [eventFilter, setEventFilter] = useState('')
  const { data: logs, isLoading } = useActivityLog({ event_type: eventFilter || undefined }, 100)

  const grouped = {}
  logs?.forEach((log) => {
    const key = formatDate(log.created_at)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(log)
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中…</div>
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">活动日志</h2>
          <p className="text-sm text-gray-400 mt-1">所有 Agent 与项目的操作历史</p>
        </div>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="input !w-auto !py-1.5 text-sm"
        >
          <option value="">全部类型</option>
          {Object.entries(eventConfig).map(([value, cfg]) => (
            <option key={value} value={value}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-gray-300">
          <CalendarDays className="w-12 h-12 mx-auto mb-3" />
          <p className="text-sm text-gray-400">暂无活动记录</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, dayLogs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{date}</h3>
                <span className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-300">{dayLogs.length} 条</span>
              </div>
              <div className="space-y-2">
                {dayLogs.map((log) => {
                  const cfg = eventConfig[log.event_type] || { icon: '📌', label: log.event_type, ring: 'bg-gray-100' }
                  return (
                    <div key={log.id} className="card p-4">
                      <div className="flex items-start gap-3">
                        <span className={`w-8 h-8 rounded-full ${cfg.ring} flex items-center justify-center text-sm flex-shrink-0`}>
                          {cfg.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 tabular-nums">{formatTime(log.created_at)}</span>
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-500">
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            {log.agent_instance ? (
                              <span className="font-semibold text-gray-800">{log.agent_instance.instance_name}</span>
                            ) : (
                              <span className="font-semibold text-gray-800">你</span>
                            )}
                            {' '}{log.message}
                          </p>
                          {log.project && (
                            <Link to={`/projects/${log.project.id}`} className="inline-block text-xs text-indigo-500 hover:text-indigo-700 hover:underline mt-1">
                              {log.project.name}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
