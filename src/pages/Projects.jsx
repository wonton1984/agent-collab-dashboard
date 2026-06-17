import { useState } from 'react'
import { useProjects } from '../hooks/useProjects'
import ProjectCard from '../components/ProjectCard'
import ProjectCardCompact from '../components/ProjectCardCompact'
import KanbanBoard from '../components/KanbanBoard'
import ProjectForm from '../components/ProjectForm'
import { Plus, Search, Archive, List, LayoutGrid, Columns3 } from 'lucide-react'
import clsx from 'clsx'

const typeFilters = [
  { value: '', label: '全部' },
  { value: 'engineering', label: '工程' },
  { value: 'paper', label: '论文' },
  { value: 'research', label: '研究' },
  { value: 'learning', label: '学习' },
  { value: 'literature', label: '文献' },
]

const ARCHIVED_STATUSES = ['completed', 'abandoned']
const VIEW_KEY = 'agent-dashboard:projects-view'
const VALID_VIEWS = ['list', 'grid', 'kanban']

const viewButtons = [
  { value: 'list',   icon: List,        label: '列表' },
  { value: 'grid',   icon: LayoutGrid,  label: '网格' },
  { value: 'kanban', icon: Columns3,    label: '看板' },
]

export default function Projects() {
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  // 视图模式：从 localStorage 恢复，默认 list
  const [view, setView] = useState(() => {
    const saved = localStorage.getItem(VIEW_KEY)
    return VALID_VIEWS.includes(saved) ? saved : 'list'
  })
  const updateView = (v) => {
    setView(v)
    localStorage.setItem(VIEW_KEY, v)
  }

  // 看板模式下，按 status 已经分列了，"按状态过滤"没意义 → 自动忽略
  const effectiveStatusFilter = view === 'kanban' ? '' : statusFilter

  const { data: projects, isLoading } = useProjects({
    project_type: typeFilter || undefined,
    status: effectiveStatusFilter || undefined,
  })

  const filtered = projects?.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    // 列表/网格模式下默认隐藏归档项目；看板模式自己有列控制
    if (view !== 'kanban') {
      const statusExplicitlySelected = ARCHIVED_STATUSES.includes(statusFilter)
      if (ARCHIVED_STATUSES.includes(p.status) && !showArchived && !statusExplicitlySelected) {
        return false
      }
    }
    return true
  })

  const hiddenArchivedCount = projects?.filter(p =>
    ARCHIVED_STATUSES.includes(p.status) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  ).length ?? 0

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="page-title">所有项目</h2>
          <p className="text-sm text-gray-400 mt-1">
            {filtered?.length ?? 0} 个项目
            {hiddenArchivedCount > 0 && !showArchived && view !== 'kanban' && ` · ${hiddenArchivedCount} 个归档已隐藏`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* 视图切换 */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-1">
            {viewButtons.map((b) => (
              <button
                key={b.value}
                onClick={() => updateView(b.value)}
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                  view === b.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
                title={b.label}
              >
                <b.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{b.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            新建项目
          </button>
        </div>
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

        {/* 看板模式下隐藏"状态过滤"，因为已经按状态分列 */}
        {view !== 'kanban' && (
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
            <option value="abandoned">已放弃</option>
          </select>
        )}

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索项目…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400"
          />
        </div>

        <button
          onClick={() => setShowArchived(v => !v)}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors',
            showArchived
              ? 'border-gray-300 bg-white text-gray-700'
              : 'border-gray-200 bg-gray-50 text-gray-400 hover:text-gray-600',
          )}
          title={showArchived ? '当前显示已完成/已放弃的项目' : '当前隐藏已完成/已放弃的项目，点击展开'}
        >
          <Archive className="w-4 h-4" />
          {showArchived
            ? '隐藏归档'
            : `显示归档${view !== 'kanban' && hiddenArchivedCount > 0 ? ` (${hiddenArchivedCount})` : ''}`}
        </button>
      </div>

      {/* 视图分发 */}
      {view === 'kanban' ? (
        <KanbanBoard projects={filtered} showArchived={showArchived} />
      ) : view === 'grid' ? (
        filtered?.length === 0 ? (
          <EmptyState hidden={hiddenArchivedCount} archived={showArchived} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => <ProjectCardCompact key={p.id} project={p} />)}
          </div>
        )
      ) : (
        // list
        filtered?.length === 0 ? (
          <EmptyState hidden={hiddenArchivedCount} archived={showArchived} />
        ) : (
          <div className="space-y-4">
            {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        )
      )}

      {showForm && <ProjectForm onClose={() => setShowForm(false)} />}
    </div>
  )
}

function EmptyState({ hidden, archived }) {
  return (
    <div className="text-center py-12 text-gray-400">
      <p className="text-lg">暂无项目</p>
      <p className="text-sm mt-1">
        {hidden > 0 && !archived
          ? `有 ${hidden} 个归档项目被隐藏，点击"显示归档"查看`
          : '点击"新建项目"开始'}
      </p>
    </div>
  )
}
