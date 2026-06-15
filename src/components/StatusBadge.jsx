import clsx from 'clsx'

const statusConfig = {
  planning:     { label: '计划中', color: 'bg-gray-100 text-gray-700' },
  in_progress:  { label: '进行中', color: 'bg-blue-100 text-blue-700' },
  paused:       { label: '暂停中', color: 'bg-yellow-100 text-yellow-700' },
  completed:    { label: '已完成', color: 'bg-green-100 text-green-700' },
  abandoned:    { label: '已放弃', color: 'bg-red-100 text-red-700' },
  todo:         { label: '待开始', color: 'bg-gray-100 text-gray-600' },
  review:       { label: '审核中', color: 'bg-purple-100 text-purple-700' },
  done:         { label: '已完成', color: 'bg-green-100 text-green-700' },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' }
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.color)}>
      {config.label}
    </span>
  )
}
