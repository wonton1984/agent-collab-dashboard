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
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <Bot className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{instance.instance_name}</h3>
            <p className="text-xs text-gray-400">{instance.agent_type?.name}</p>
          </div>
        </div>
        <span className={`w-2.5 h-2.5 rounded-full ${instance.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
      </div>

      <div className="space-y-2 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5" />
          <span>{instance.platform || '未知平台'}</span>
          {instance.hostname && <span>· {instance.hostname}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeAgo(instance.last_active_at)}</span>
        </div>
        {instance.project_paths && (
          <div className="flex items-center gap-2">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>{instance.project_paths.length} 个项目</span>
          </div>
        )}
      </div>

      {instance.api_key && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">API Key</p>
          <code className="text-xs bg-gray-50 px-2 py-1 rounded text-gray-600 block truncate">
            {instance.api_key.substring(0, 12)}...
          </code>
        </div>
      )}
    </div>
  )
}
