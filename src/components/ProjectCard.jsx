import { Link } from 'react-router-dom'
import { Folder, MapPin } from 'lucide-react'
import StatusBadge from './StatusBadge'

const typeLabels = {
  engineering: '工程',
  paper: '论文',
  research: '研究',
  learning: '学习',
  literature: '文献',
}

const typeColors = {
  engineering: 'text-blue-600 bg-blue-50',
  paper: 'text-purple-600 bg-purple-50',
  research: 'text-green-600 bg-green-50',
  learning: 'text-yellow-600 bg-yellow-50',
  literature: 'text-red-600 bg-red-50',
}

export default function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">{project.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[project.project_type] || 'text-gray-600 bg-gray-50'}`}>
            {typeLabels[project.project_type] || project.project_type}
          </span>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {project.project_paths?.length > 0 && (
        <div className="mb-3 space-y-1">
          {project.project_paths.map((pp) => (
            <div key={pp.id} className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="font-medium">{pp.agent_instance?.instance_name}:</span>
              <span className="truncate">{pp.local_path}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {project.progress}% · {project.done_tasks}/{project.total_tasks} 任务
        </span>
      </div>

      {project.project_collaborators?.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
          <span>负责人:</span>
          <span className="font-medium text-gray-700">
            {project.project_collaborators
              .map(c => c.agent_instance?.instance_name)
              .join('、')}
          </span>
        </div>
      )}
    </Link>
  )
}
