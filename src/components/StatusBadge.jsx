import clsx from 'clsx'

const statusConfig = {
  planning:    { label: '计划中', dot: 'bg-gray-400',   bg: 'bg-gray-50',   text: 'text-gray-600' },
  in_progress: { label: '进行中', dot: 'bg-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  paused:      { label: '暂停中', dot: 'bg-amber-400',  bg: 'bg-amber-50',  text: 'text-amber-700' },
  completed:   { label: '已完成', dot: 'bg-emerald-500',bg: 'bg-emerald-50',text: 'text-emerald-700' },
  abandoned:   { label: '已放弃', dot: 'bg-rose-400',   bg: 'bg-rose-50',   text: 'text-rose-600' },
  todo:        { label: '待开始', dot: 'bg-gray-300',   bg: 'bg-gray-50',   text: 'text-gray-500' },
  review:      { label: '审核中', dot: 'bg-violet-400', bg: 'bg-violet-50', text: 'text-violet-700' },
  done:        { label: '已完成', dot: 'bg-emerald-500',bg: 'bg-emerald-50',text: 'text-emerald-700' },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, dot: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-600' }
  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', config.bg, config.text)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}
