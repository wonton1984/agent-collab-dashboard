import { Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

const eventConfig = {
  status_change: { icon: '🔄', ring: 'bg-gray-100' },
  task_complete: { icon: '✅', ring: 'bg-emerald-100' },
  note:          { icon: '📝', ring: 'bg-amber-100' },
  manual_edit:   { icon: '✏️', ring: 'bg-blue-100' },
  agent_report:  { icon: '🤖', ring: 'bg-violet-100' },
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
      <div className="flex flex-col items-center justify-center py-10 text-gray-300">
        <Clock className="w-10 h-10 mb-2" />
        <p className="text-sm text-gray-400">暂无活动记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {logs.map((log, idx) => {
        const cfg = eventConfig[log.event_type] || { icon: '📌', ring: 'bg-gray-100' }
        return (
          <div key={log.id} className="flex items-start gap-3 text-sm py-2 relative">
            {/* 图标圆 */}
            <span className={`w-8 h-8 rounded-full ${cfg.ring} flex items-center justify-center flex-shrink-0 text-sm`}>
              {cfg.icon}
            </span>
            {/* 连接线 */}
            {idx < logs.length - 1 && (
              <span className="absolute left-4 top-10 bottom-0 w-px bg-gray-100" />
            )}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-gray-600 leading-relaxed">
                {log.agent_instance ? (
                  <span className="font-semibold text-gray-800">{log.agent_instance.instance_name}</span>
                ) : (
                  <span className="font-semibold text-gray-800">你</span>
                )}
                {' '}
                <span className="text-gray-500">{log.message}</span>
              </p>
              {log.project && (
                <Link to={`/projects/${log.project.id}`} className="inline-block mt-1 text-xs text-indigo-500 hover:text-indigo-700 hover:underline">
                  {log.project.name}
                </Link>
              )}
            </div>
            <span className="text-gray-300 text-xs whitespace-nowrap tabular-nums pt-0.5">{timeAgo(log.created_at)}</span>
          </div>
        )
      })}
    </div>
  )
}
