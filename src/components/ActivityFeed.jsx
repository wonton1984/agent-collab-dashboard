import { Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

const eventIcons = {
  status_change: '🔄',
  task_complete: '✅',
  note: '📝',
  manual_edit: '✏️',
  agent_report: '🤖',
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

export default function ActivityFeed({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <Clock className="w-8 h-8 mb-2" />
        <p className="text-sm">暂无活动记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 text-sm">
          <span className="text-lg">{eventIcons[log.event_type] || '📌'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-gray-700">
              {log.agent_instance ? (
                <span className="font-medium">{log.agent_instance.instance_name}</span>
              ) : (
                <span className="font-medium">你</span>
              )}
              {' '}{log.message}
            </p>
            {log.project && (
              <Link to={`/projects/${log.project.id}`} className="text-blue-600 hover:underline text-xs">
                {log.project.name}
              </Link>
            )}
          </div>
          <span className="text-gray-400 text-xs whitespace-nowrap">{timeAgo(log.created_at)}</span>
        </div>
      ))}
    </div>
  )
}
