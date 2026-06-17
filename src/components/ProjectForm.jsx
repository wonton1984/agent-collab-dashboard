import { useState } from 'react'
import { useCreateProject } from '../hooks/useProjects'
import { X } from 'lucide-react'

const projectTypes = [
  { value: 'engineering', label: '工程' },
  { value: 'paper', label: '论文' },
  { value: 'research', label: '研究' },
  { value: 'learning', label: '学习' },
  { value: 'literature', label: '文献' },
]

export default function ProjectForm({ onClose }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    project_type: 'engineering',
    priority: 'medium',
  })
  const createProject = useCreateProject()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    await createProject.mutateAsync(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">新建项目</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">项目名称 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input"
              placeholder="输入项目名称"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">项目类型</label>
            <select
              value={form.project_type}
              onChange={(e) => setForm({ ...form, project_type: e.target.value })}
              className="input"
            >
              {projectTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="input resize-none"
              placeholder="项目描述（可选）"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 justify-center"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="btn-primary flex-1 justify-center disabled:opacity-50"
            >
              {createProject.isPending ? '创建中…' : '创建项目'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
