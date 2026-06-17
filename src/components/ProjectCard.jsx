import { Link } from 'react-router-dom'
import { Folder, MapPin } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { AgentAvatarGroup } from './AgentAvatar'

const typeLabels = {
  engineering: '工程',
  paper: '论文',
  research: '研究',
  learning: '学习',
  literature: '文献',
}

const typeStyles = {
  engineering: { badge: 'bg-blue-50 text-blue-600', bar: 'bg-blue-400' },
  paper:       { badge: 'bg-violet-50 text-violet-600', bar: 'bg-violet-400' },
  research:    { badge: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-400' },
  learning:    { badge: 'bg-amber-50 text-amber-600', bar: 'bg-amber-400' },
  literature:  { badge: 'bg-rose-50 text-rose-600', bar: 'bg-rose-400' },
}

export default function ProjectCard({ project }) {
  const ts = typeStyles[project.project_type] || { badge: 'bg-gray-50 text-gray-600', bar: 'bg-gray-300' }

  return (
    <Link
      to={`/projects/${project.id}`}
      className="card card-hover block p-5 relative overflow-hidden group"
    >
      {/* 左侧类型色条 */}
      <span className={`absolute left-0 top-5 bottom-5 w-1 rounded-r-full ${ts.bar}`} />

      <div className="flex items-start justify-between mb-3 pl-2">
        <div className="flex items-center gap-2 min-w-0">
          <Folder className="w-4.5 h-4.5 text-gray-300 flex-shrink-0" />
          <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
          <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium flex-shrink-0 ${ts.badge}`}>
            {typeLabels[project.project_type] || project.project_type}
          </span>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {project.project_paths?.length > 0 && (
        <div className="mb-3 space-y-1 pl-2">
          {project.project_paths.map((pp) => (
            <div key={pp.id} className="flex items-center gap-1.5 text-xs text-gray-400">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="font-medium text-gray-500">{pp.agent_instance?.instance_name}</span>
              <span className="truncate font-mono">{pp.local_path}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pl-2">
        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="progress-bar h-1.5"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap tabular-nums">
          {project.progress}% · {project.done_tasks}/{project.total_tasks}
        </span>
      </div>

      {project.project_collaborators?.length > 0 && (
        <div className="mt-3 flex items-center gap-2 pl-2">
          <AgentAvatarGroup collaborators={project.project_collaborators} size="sm" />
          <span className="text-xs text-gray-500">
            {project.project_collaborators.map(c => c.agent_instance?.instance_name).filter(Boolean).join('、')}
          </span>
        </div>
      )}
    </Link>
  )
}
