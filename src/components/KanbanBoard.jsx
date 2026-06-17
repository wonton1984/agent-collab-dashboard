import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUpdateProject } from '../hooks/useProjects'
import { AgentAvatarGroup } from './AgentAvatar'
import {
  AdminAuthRequiredError,
  getAdminToken,
  setAdminToken as persistAdminToken,
} from '../lib/adminApi'
import { AlertTriangle, X } from 'lucide-react'

const COLUMNS = [
  { key: 'planning',    label: '计划中', accent: 'bg-gray-400'    },
  { key: 'in_progress', label: '进行中', accent: 'bg-indigo-500'  },
  { key: 'paused',      label: '暂停中', accent: 'bg-amber-400'   },
  { key: 'completed',   label: '已完成', accent: 'bg-emerald-500', archived: true },
  { key: 'abandoned',   label: '已放弃', accent: 'bg-rose-400',    archived: true },
]

const typeLabels = {
  engineering: '工程', paper: '论文', research: '研究', learning: '学习', literature: '文献',
}

const typeBorder = {
  engineering: 'border-l-blue-400',
  paper:       'border-l-violet-400',
  research:    'border-l-emerald-400',
  learning:    'border-l-amber-400',
  literature:  'border-l-rose-400',
}

// 单张项目卡片，可拖拽
function MiniCard({ project, onDragStart, onDragEnd, dragging }) {
  const borderClass = typeBorder[project.project_type] || 'border-l-gray-300'
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, project)}
      onDragEnd={onDragEnd}
      className={`
        bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm
        border-l-4 ${borderClass} p-3 transition-all duration-150 group
        cursor-grab active:cursor-grabbing
        ${dragging ? 'opacity-40 scale-95' : ''}
      `}
    >
      <Link to={`/projects/${project.id}`} className="block" onClick={(e) => {
        // 如果正在拖拽，避免误触发跳转
        if (dragging) e.preventDefault()
      }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 flex-1 group-hover:text-gray-900">
            {project.name}
          </h4>
          <span className="text-[10px] text-gray-400 flex-shrink-0">
            {typeLabels[project.project_type] || ''}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
            <div className="progress-bar h-1" style={{ width: `${project.progress}%` }} />
          </div>
          <span className="text-[10px] text-gray-400 tabular-nums whitespace-nowrap">
            {project.done_tasks}/{project.total_tasks}
          </span>
        </div>

        {project.project_collaborators?.length > 0 && (
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-gray-100">
            <AgentAvatarGroup collaborators={project.project_collaborators} size="xs" max={3} />
            <span className="text-[10px] text-gray-500 truncate flex-1">
              {project.project_collaborators.map(c => c.agent_instance?.instance_name).filter(Boolean).join('、')}
            </span>
          </div>
        )}
      </Link>
    </div>
  )
}

export default function KanbanBoard({ projects, showArchived }) {
  const updateProject = useUpdateProject()

  // 拖拽状态
  const [dragging, setDragging] = useState(null)            // 当前正在拖的 project
  const [dragOverCol, setDragOverCol] = useState(null)      // 当前悬停的列 key

  // Token 模态框
  const [tokenModal, setTokenModal] = useState(null)        // { project, newStatus } | null
  const [tokenInput, setTokenInput] = useState('')
  const [tokenSubmitting, setTokenSubmitting] = useState(false)
  const [tokenError, setTokenError] = useState('')

  // 错误 toast
  const [errorMsg, setErrorMsg] = useState('')

  // 按 status 分桶
  const buckets = {}
  for (const col of COLUMNS) buckets[col.key] = []
  for (const p of (projects || [])) {
    if (buckets[p.status]) buckets[p.status].push(p)
  }
  const visibleColumns = COLUMNS.filter(c => showArchived || !c.archived)

  // ====== 拖拽 ======
  const handleDragStart = (e, project) => {
    setDragging(project)
    e.dataTransfer.effectAllowed = 'move'
    // 必须 setData 否则 Firefox 不触发拖拽
    e.dataTransfer.setData('text/plain', project.id)
  }
  const handleDragEnd = () => {
    setDragging(null)
    setDragOverCol(null)
  }
  const handleDragOver = (e, colKey) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverCol !== colKey) setDragOverCol(colKey)
  }
  const handleDragLeave = (e, colKey) => {
    // 离开列时清除高亮（但不要因为离开子元素就清，所以判断 relatedTarget）
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverCol === colKey) setDragOverCol(null)
    }
  }
  const handleDrop = async (e, colKey) => {
    e.preventDefault()
    setDragOverCol(null)
    const project = dragging
    setDragging(null)
    if (!project || project.status === colKey) return

    // 没 token 时先弹框，避免"乐观更新→失败回滚"的视觉闪烁
    if (!getAdminToken()) {
      setTokenModal({ project, newStatus: colKey })
      setTokenInput('')
      setTokenError('首次拖拽改状态需输入管理员 Token')
      return
    }

    await applyStatusChange(project, colKey)
  }

  // ====== 实际执行状态变更 ======
  const applyStatusChange = async (project, newStatus, overrideToken) => {
    setErrorMsg('')
    try {
      await updateProject.mutateAsync({
        id: project.id,
        status: newStatus,
        token: overrideToken,    // 不传则 hook 内部从 localStorage 取
      })
      // 成功，记住临时输入的 token
      if (overrideToken) persistAdminToken(overrideToken)
    } catch (err) {
      if (err instanceof AdminAuthRequiredError) {
        // 弹模态框，记住待办
        setTokenModal({ project, newStatus })
        setTokenInput('')
        setTokenError(getAdminToken() ? 'Token 无效，请重新输入' : '首次拖拽改状态需输入管理员 Token')
      } else {
        setErrorMsg(`改状态失败：${err.message || '未知错误'}`)
      }
    }
  }

  const handleTokenSubmit = async () => {
    if (!tokenInput.trim() || !tokenModal) return
    setTokenSubmitting(true)
    try {
      await applyStatusChange(tokenModal.project, tokenModal.newStatus, tokenInput.trim())
      // 如果 applyStatusChange 又抛 AdminAuthRequiredError 会重设 tokenModal；否则关闭
      if (!tokenError || tokenError === '首次拖拽改状态需输入管理员 Token') {
        setTokenModal(null)
      }
    } finally {
      setTokenSubmitting(false)
    }
  }

  return (
    <>
      <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 pb-2">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(240px, 1fr))` }}>
          {visibleColumns.map((col) => {
            const items = buckets[col.key]
            const isOver = dragOverCol === col.key
            const isSourceColumn = dragging && dragging.status === col.key
            return (
              <div
                key={col.key}
                onDragOver={(e) => handleDragOver(e, col.key)}
                onDragLeave={(e) => handleDragLeave(e, col.key)}
                onDrop={(e) => handleDrop(e, col.key)}
                className={`
                  rounded-2xl border p-3 min-h-[200px] transition-all duration-150
                  ${isOver && !isSourceColumn
                    ? 'bg-indigo-50/70 border-indigo-200 ring-2 ring-indigo-200/60'
                    : 'bg-gray-50/70 border-gray-100'}
                `}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.accent}`} />
                    <h3 className="text-xs font-semibold text-gray-700">{col.label}</h3>
                  </div>
                  <span className="text-[11px] font-medium text-gray-400 tabular-nums bg-white border border-gray-200 rounded-full px-2 py-0.5">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {items.length === 0 ? (
                    <div className="text-center py-6 text-[11px] text-gray-300">
                      {isOver && !isSourceColumn ? '松开放入此列' : '暂无项目'}
                    </div>
                  ) : (
                    items.map(p => (
                      <MiniCard
                        key={p.id}
                        project={p}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        dragging={dragging?.id === p.id}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 错误提示 */}
      {errorMsg && (
        <div className="fixed bottom-4 right-4 z-40 max-w-sm bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl shadow-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">{errorMsg}</div>
          <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-rose-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Token 输入模态框 */}
      {tokenModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => !tokenSubmitting && setTokenModal(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">需要管理员 Token</h2>
                <p className="text-sm text-gray-500 mt-1">
                  把「<span className="font-medium text-gray-700">{tokenModal.project.name}</span>」
                  改为「{COLUMNS.find(c => c.key === tokenModal.newStatus)?.label}」需要 Token。
                  确认后会记住到本浏览器，下次拖拽无需再输入。
                </p>
              </div>
            </div>

            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ADMIN_TOKEN"
              disabled={tokenSubmitting}
              className="input font-mono"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && tokenInput.trim()) handleTokenSubmit() }}
            />
            {tokenError && (
              <p className="text-xs text-rose-600 mt-2">{tokenError}</p>
            )}

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setTokenModal(null)}
                disabled={tokenSubmitting}
                className="btn-ghost"
              >
                取消
              </button>
              <button
                onClick={handleTokenSubmit}
                disabled={tokenSubmitting || !tokenInput.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tokenSubmitting ? '提交中…' : '确认并应用'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
