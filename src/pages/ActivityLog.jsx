import { useState } from 'react'
import { useActivityLog } from '../hooks/useActivityLog'
import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'

const eventIcons = {
  status_change: '🔄',
  task_complete: '✅',
  note: '📝',
  manual_edit: '✏️',
  agent_report: '🤖',
}

const eventLabels = {
  status_change: '状态变更',
  task_complete: '任务完成',
  note: '备注',
  manual_edit: '手动编辑',
  agent_report: 'Agent 上报',
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
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">📋 活动日志</h2>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white"
        >
          <option value="">全部类型</option>
          {Object.entries(eventLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3" />
          <p>暂无活动记录</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, dayLogs]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-500 mb-3 sticky top-0 bg-gray-50 py-2">{date}</h3>
              <div className="space-y-2">
                {dayLogs.map((log) => (
                  <div key={log.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{eventIcons[log.event_type] || '📌'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{formatTime(log.created_at)}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                            {eventLabels[log.event_type] || log.event_type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {log.agent_instance ? (
                            <span className="font-medium">{log.agent_instance.instance_name}</span>
                          ) : (
                            <span className="font-medium">你</span>
                          )}
                          {' '}{log.message}
                        </p>
                        {log.project && (
                          <Link to={`/projects/${log.project.id}`} className="text-blue-600 hover:underline text-xs mt-1 inline-block">
                            {log.project.name}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
