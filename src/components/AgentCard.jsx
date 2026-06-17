import { Bot, Monitor, Clock, FolderKanban } from 'lucide-react'

function timeAgo(dateStr) {
  if (!dateStr) return '从未上线'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

export default function AgentCard({ instance }) {
  const online = instance.is_online
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${online ? 'bg-emerald-500' : 'bg-gray-300'}`}
              title={online ? '在线' : '离线'}
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 leading-tight">{instance.instance_name}</h3>
            <p className="text-xs text-gray-400">{instance.agent_type?.name}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-gray-400" />
          <span>{instance.platform || '未知平台'}</span>
          {instance.hostname && <span className="text-gray-300">· {instance.hostname}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className={online ? 'text-emerald-600' : ''}>{timeAgo(instance.last_active_at)}</span>
        </div>
        {instance.project_paths && (
          <div className="flex items-center gap-2">
            <FolderKanban className="w-3.5 h-3.5 text-gray-400" />
            <span>{instance.project_paths.length} 个项目</span>
          </div>
        )}
      </div>

      {instance.api_key && (
        <div className="mt-3.5 pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide font-medium">API Key</p>
          <code className="text-xs bg-gray-50 px-2 py-1 rounded-md text-gray-500 block truncate font-mono">
            {instance.api_key.substring(0, 12)}…
          </code>
        </div>
      )}
    </div>
  )
}
