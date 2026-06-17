import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { AgentAvatarGroup } from './AgentAvatar'

const typeLabels = {
  engineering: '工程', paper: '论文', research: '研究', learning: '学习', literature: '文献',
}

const typeStyles = {
  engineering: { badge: 'bg-blue-50 text-blue-600',     bar: 'bg-blue-400' },
  paper:       { badge: 'bg-violet-50 text-violet-600', bar: 'bg-violet-400' },
  research:    { badge: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-400' },
  learning:    { badge: 'bg-amber-50 text-amber-600',   bar: 'bg-amber-400' },
  literature:  { badge: 'bg-rose-50 text-rose-600',     bar: 'bg-rose-400' },
}

// 网格视图用的紧凑卡片：只显示核心信息，点击进入详情
export default function ProjectCardCompact({ project }) {
  const ts = typeStyles[project.project_type] || { badge: 'bg-gray-50 text-gray-600', bar: 'bg-gray-300' }

  return (
    <Link
      to={`/projects/${project.id}`}
      className="card card-hover block p-4 relative overflow-hidden h-full flex flex-col"
    >
      <span className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${ts.bar}`} />

      <div className="pl-2 flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">
            {project.name}
          </h3>
          <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium flex-shrink-0 ${ts.badge}`}>
            {typeLabels[project.project_type] || project.project_type}
          </span>
        </div>

        {project.description && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">
            {project.description}
          </p>
        )}
      </div>

      <div className="pl-2 mt-auto space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="progress-bar h-1.5" style={{ width: `${project.progress}%` }} />
          </div>
          <span className="text-[11px] text-gray-400 tabular-nums whitespace-nowrap">
            {project.progress}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <StatusBadge status={project.status} />
          <span className="text-[11px] text-gray-400 tabular-nums">
            {project.done_tasks}/{project.total_tasks} 任务
          </span>
        </div>
        {project.project_collaborators?.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <AgentAvatarGroup collaborators={project.project_collaborators} size="sm" max={3} />
            <span className="text-[11px] text-gray-500 truncate">
              {project.project_collaborators.map(c => c.agent_instance?.instance_name).filter(Boolean).join('、')}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
