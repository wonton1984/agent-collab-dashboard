import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useProject, useUpdateProject } from '../hooks/useProjects'
import { useActivityLog } from '../hooks/useActivityLog'
import StatusBadge from '../components/StatusBadge'
import TaskList from '../components/TaskList'
import ActivityFeed from '../components/ActivityFeed'
import { ArrowLeft, MapPin, Edit3, Save, X, Users, Trash2, AlertTriangle } from 'lucide-react'
import {
  adminDeleteProject,
  AdminAuthRequiredError,
  getAdminToken,
  setAdminToken as persistAdminToken,
  clearAdminToken,
} from '../lib/adminApi'

const typeLabels = {
  engineering: '工程', paper: '论文', research: '研究', learning: '学习', literature: '文献',
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: project, isLoading } = useProject(id)
  const { data: activityLog } = useActivityLog({ project_id: id }, 20)
  const updateProject = useUpdateProject()

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editError, setEditError] = useState('')
  const [savingToken, setSavingToken] = useState('')   // 保存动作如果缺 token，临时输入
  const [needTokenForSave, setNeedTokenForSave] = useState(false)

  // 删除模态框
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [deleteToken, setDeleteToken] = useState(() => getAdminToken())
  const [rememberToken, setRememberToken] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  }
  if (!project) {
    return <div className="text-center py-12 text-gray-400">项目不存在</div>
  }

  const startEdit = () => {
    setEditForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
    })
    setEditError('')
    setNeedTokenForSave(false)
    setSavingToken('')
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditError('')
    setNeedTokenForSave(false)
  }

  const saveEdit = async (overrideToken) => {
    setEditError('')
    try {
      await updateProject.mutateAsync({
        id: project.id,
        token: overrideToken,    // 没传则 hook 内部从 localStorage 取
        ...editForm,
      })
      // 成功，记住临时输入的 token
      if (overrideToken) persistAdminToken(overrideToken)
      setEditing(false)
      setNeedTokenForSave(false)
      setSavingToken('')
    } catch (err) {
      if (err instanceof AdminAuthRequiredError) {
        setNeedTokenForSave(true)
        setEditError(getAdminToken() ? 'Token 无效，请重新输入' : '首次使用需输入管理员 Token')
        if (!getAdminToken()) clearAdminToken()
      } else {
        setEditError(err.message || '保存失败')
      }
    }
  }

  const openDeleteModal = () => {
    setConfirmName('')
    setDeleteError('')
    setDeleteToken(getAdminToken())
    setShowDeleteModal(true)
  }
  const closeDeleteModal = () => {
    if (deleting) return
    setShowDeleteModal(false)
    setDeleteError('')
  }

  const handleDelete = async () => {
    setDeleteError('')
    if (confirmName !== project.name) {
      setDeleteError('输入的项目名与当前项目不一致')
      return
    }
    if (!deleteToken) {
      setDeleteError('请填写管理员 Token')
      return
    }
    setDeleting(true)
    try {
      await adminDeleteProject(project.id, deleteToken)
      if (rememberToken) persistAdminToken(deleteToken)
      else clearAdminToken()
      navigate('/projects', { replace: true })
    } catch (err) {
      setDeleteError(err.message || '删除失败')
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        返回项目列表
      </Link>

      <div className="card p-6">
        {editing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full text-xl font-bold px-3 py-2 rounded-lg border border-gray-200"
            />
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              placeholder="项目描述"
            />
            <div className="flex gap-2 flex-wrap">
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
              >
                <option value="planning">计划中</option>
                <option value="in_progress">进行中</option>
                <option value="paused">暂停中</option>
                <option value="completed">已完成</option>
                <option value="abandoned">已放弃</option>
              </select>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
              >
                <option value="high">高优先级</option>
                <option value="medium">中优先级</option>
                <option value="low">低优先级</option>
              </select>
              <button
                onClick={() => saveEdit(needTokenForSave ? savingToken : undefined)}
                disabled={updateProject.isPending || (needTokenForSave && !savingToken)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {updateProject.isPending ? '保存中...' : '保存'}
              </button>
              <button onClick={cancelEdit} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm flex items-center gap-1">
                <X className="w-4 h-4" /> 取消
              </button>
            </div>
            {needTokenForSave && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                <div className="text-xs text-amber-800">
                  保存项目需要管理员 Token（与删除是同一个 Token）。
                </div>
                <input
                  type="password"
                  value={savingToken}
                  onChange={(e) => setSavingToken(e.target.value)}
                  placeholder="ADMIN_TOKEN"
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm font-mono"
                  onKeyDown={(e) => { if (e.key === 'Enter' && savingToken) saveEdit(savingToken) }}
                  autoFocus
                />
                <div className="text-xs text-gray-500">
                  保存成功后会记住到本浏览器，下次无需再输入。
                </div>
              </div>
            )}
            {editError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {editError}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {typeLabels[project.project_type]}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={startEdit} className="text-gray-400 hover:text-gray-600" title="编辑项目">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={openDeleteModal} className="text-gray-400 hover:text-red-600" title="删除项目">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <StatusBadge status={project.status} />
              <span className="text-xs text-gray-400">
                优先级: {project.priority === 'high' ? '高' : project.priority === 'medium' ? '中' : '低'}
              </span>
              {project.project_collaborators?.length > 0 && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  负责人:
                  {project.project_collaborators.map(c => c.agent_instance?.instance_name).join('、')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <span>📋</span> 活动日志
            </h3>
            <ActivityFeed logs={activityLog} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              存在位置
            </h3>
            {project.project_paths?.length > 0 ? (
              <div className="space-y-3">
                {project.project_paths.map((pp) => (
                  <div key={pp.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">{pp.agent_instance?.instance_name}</p>
                      <p className="text-gray-500 font-mono text-xs mt-0.5">{pp.local_path}</p>
                      {pp.last_synced_at && (
                        <p className="text-gray-400 text-xs mt-0.5">
                          最近同步: {new Date(pp.last_synced_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">暂无路径信息</p>
            )}
          </div>

          <div className="card p-5">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <span>✅</span> 任务列表
            </h3>
            <TaskList projectId={project.id} tasks={project.tasks} />
          </div>
        </div>
      </div>

      {/* 删除确认模态框 */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeDeleteModal}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">删除项目？</h2>
                <p className="text-sm text-gray-500 mt-1">
                  这会永久删除项目「<span className="font-medium text-gray-700">{project.name}</span>」
                  以及它的所有任务、活动日志、路径与协作者关联。此操作不可撤销。
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  请输入项目名以确认：<span className="font-mono text-gray-700">{project.name}</span>
                </label>
                <input
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder="输入项目名"
                  disabled={deleting}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  管理员 Token
                  {getAdminToken() && (
                    <span className="text-gray-400 ml-1">（已记住，可直接确认）</span>
                  )}
                </label>
                <input
                  type="password"
                  value={deleteToken}
                  onChange={(e) => setDeleteToken(e.target.value)}
                  placeholder="ADMIN_TOKEN"
                  disabled={deleting}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
                />
                <label className="inline-flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={rememberToken}
                    onChange={(e) => setRememberToken(e.target.checked)}
                    disabled={deleting}
                  />
                  在本浏览器记住 Token
                </label>
              </div>

              {deleteError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || !confirmName || !deleteToken}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
