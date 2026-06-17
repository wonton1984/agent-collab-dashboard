// 负责人头像组件：圆形 + 渐变背景 + 首字母（或首字符）
// 颜色按 agent_type 名称分配，相同 type 同色，便于辨识。

const AGENT_TYPE_GRADIENTS = {
  'Zcode':       'from-blue-500 to-indigo-500',
  'Codex':       'from-emerald-500 to-teal-500',
  'Claude Code': 'from-orange-500 to-amber-500',
  'Kimi CLI':    'from-violet-500 to-purple-500',
  'Cloud Code':  'from-rose-500 to-pink-500',
}

// 兜底色：从中性配色循环挑一个
const FALLBACK_GRADIENTS = [
  'from-slate-500 to-gray-500',
  'from-cyan-500 to-blue-500',
  'from-fuchsia-500 to-pink-500',
  'from-lime-500 to-emerald-500',
]

function getGradient(agentTypeName) {
  if (!agentTypeName) return FALLBACK_GRADIENTS[0]
  if (AGENT_TYPE_GRADIENTS[agentTypeName]) return AGENT_TYPE_GRADIENTS[agentTypeName]
  // 用 hash 选 fallback，使同名 type 始终同色
  let h = 0
  for (const c of agentTypeName) h = (h * 31 + c.charCodeAt(0)) | 0
  return FALLBACK_GRADIENTS[Math.abs(h) % FALLBACK_GRADIENTS.length]
}

// 取首字符（英文取首字母大写，中文/其他直接取第 1 个 grapheme）
function getInitial(name) {
  if (!name) return '?'
  const s = name.trim()
  if (!s) return '?'
  // 英文优先取首字母
  const match = s.match(/[A-Za-z]/)
  if (match) return match[0].toUpperCase()
  // 中文/其他取第一个字符
  return [...s][0]
}

const SIZE = {
  xs: { wh: 'w-5 h-5',  text: 'text-[10px]' },
  sm: { wh: 'w-6 h-6',  text: 'text-[11px]' },
  md: { wh: 'w-7 h-7',  text: 'text-xs' },
}

export function AgentAvatar({ instance, size = 'sm', ringColor = 'ring-white' }) {
  const typeName = instance?.agent_type?.name || instance?.type_name
  const gradient = getGradient(typeName)
  const initial = getInitial(instance?.instance_name || typeName || '?')
  const { wh, text } = SIZE[size] || SIZE.sm

  return (
    <span
      className={`inline-flex ${wh} rounded-full bg-gradient-to-br ${gradient} text-white font-semibold ${text} items-center justify-center ring-2 ${ringColor} shadow-sm`}
      title={`${instance?.instance_name || ''}${typeName ? ` · ${typeName}` : ''}`}
    >
      {initial}
    </span>
  )
}

// 头像叠加组，多人叠加，超过 max 显示 +N
export function AgentAvatarGroup({ collaborators, size = 'sm', max = 3, label = '负责人' }) {
  const items = (collaborators || []).filter(c => c?.agent_instance)
  if (items.length === 0) return null

  const visible = items.slice(0, max)
  const overflow = items.length - visible.length
  const tooltip = items.map(c => c.agent_instance.instance_name).filter(Boolean).join('、')
  const { wh, text } = SIZE[size] || SIZE.sm

  return (
    <div className="inline-flex items-center gap-1.5" title={`${label}：${tooltip}`}>
      <div className="flex -space-x-1.5">
        {visible.map((c) => (
          <AgentAvatar key={c.id} instance={c.agent_instance} size={size} />
        ))}
        {overflow > 0 && (
          <span
            className={`inline-flex ${wh} rounded-full bg-gray-200 text-gray-600 font-semibold ${text} items-center justify-center ring-2 ring-white shadow-sm`}
          >
            +{overflow}
          </span>
        )}
      </div>
    </div>
  )
}

export default AgentAvatar
