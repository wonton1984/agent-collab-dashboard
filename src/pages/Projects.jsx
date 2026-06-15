import { useState } from 'react'
import { useProjects } from '../hooks/useProjects'
import ProjectCard from '../components/ProjectCard'
import ProjectForm from '../components/ProjectForm'
import { Plus, Search } from 'lucide-react'
import clsx from 'clsx'

const typeFilters = [
  { value: '', label: '全部' },
  { value: 'engineering', label: '工程' },
  { value: 'paper', label: '论文' },
  { value: 'research', label: '研究' },
  { value: 'learning', label: '学习' },
  { value: 'literature', label: '文献' },
]

export default function Projects() {
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  const { data: projects, isLoading } = useProjects({
    project_type: typeFilter || undefined,
    status: statusFilter || undefined,
  })

  const filtered = projects?.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">📁 所有项目</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          新建项目
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                typeFilter === f.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white"
        >
          <option value="">全部状态</option>
          <option value="planning">计划中</option>
          <option value="in_progress">进行中</option>
          <option value="paused">暂停中</option>
          <option value="completed">已完成</option>
        </select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索项目..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filtered?.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">暂无项目</p>
            <p className="text-sm mt-1">点击"新建项目"开始</p>
          </div>
        ) : (
          filtered?.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        )}
      </div>

      {showForm && (
        <ProjectForm onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
