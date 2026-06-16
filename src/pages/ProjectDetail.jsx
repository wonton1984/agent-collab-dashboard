import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProject, useUpdateProject } from '../hooks/useProjects'
import { useActivityLog } from '../hooks/useActivityLog'
import StatusBadge from '../components/StatusBadge'
import TaskList from '../components/TaskList'
import ActivityFeed from '../components/ActivityFeed'
    import { ArrowLeft, MapPin, Edit3, Save, X, Users } from 'lucide-react'

const typeLabels = {
  engineering: '工程', paper: '论文', research: '研究', learning: '学习', literature: '文献',
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { data: project, isLoading } = useProject(id)
  const { data: activityLog } = useActivityLog({ project_id: id }, 20)
  const updateProject = useUpdateProject()

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})

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
    setEditing(true)
  }

  const saveEdit = async () => {
    await updateProject.mutateAsync({ id: project.id, ...editForm })
    setEditing(false)
  }

  return (
    <div className="max-w-4xl space-y-6">
      <Link to="/projects" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        返回项目列表
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
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
            />
            <div className="flex gap-2">
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
              <button onClick={saveEdit} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-1">
                <Save className="w-4 h-4" /> 保存
              </button>
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm flex items-center gap-1">
                <X className="w-4 h-4" /> 取消
              </button>
            </div>
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
              <button onClick={startEdit} className="text-gray-400 hover:text-gray-600">
                <Edit3 className="w-4 h-4" />
              </button>
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
                  {project.project_collaborators
                    .map(c => c.agent_instance?.instance_name)
                    .join('、')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">📋 活动日志</h3>
            <ActivityFeed logs={activityLog} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
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

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">✅ 任务列表</h3>
            <TaskList projectId={project.id} tasks={project.tasks} />
          </div>
        </div>
      </div>
    </div>
  )
}
