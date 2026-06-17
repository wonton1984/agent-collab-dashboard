import { useState } from 'react'
import { useUpdateTask, useCreateTask } from '../hooks/useProjects'
import { CheckCircle2, Circle, Plus, Loader2 } from 'lucide-react'
import clsx from 'clsx'

export default function TaskList({ projectId, tasks }) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const updateTask = useUpdateTask()
  const createTask = useCreateTask()

  const toggleTask = (task) => {
    updateTask.mutate({
      id: task.id,
      status: task.status === 'done' ? 'todo' : 'done',
    })
  }

  const addTask = async () => {
    if (!newTaskTitle.trim()) return
    await createTask.mutateAsync({
      project_id: projectId,
      title: newTaskTitle.trim(),
      sort_order: (tasks?.length ?? 0) + 1,
    })
    setNewTaskTitle('')
  }

  return (
    <div>
      <div className="space-y-0.5">
        {tasks?.map((task) => (
          <div
            key={task.id}
            className={clsx(
              'flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50/80 cursor-pointer group transition-colors',
              task.status === 'done' && 'opacity-50',
            )}
            onClick={() => toggleTask(task)}
          >
            {task.status === 'done' ? (
              <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500 flex-shrink-0 mt-0.5 transition-transform group-hover:scale-110" />
            ) : (
              <Circle className="w-[18px] h-[18px] text-gray-300 group-hover:text-indigo-400 flex-shrink-0 mt-0.5 transition-colors" />
            )}
            <div className="flex-1 min-w-0">
              <span className={clsx(
                'text-sm block leading-snug',
                task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700',
              )}>
                {task.title}
              </span>
              {task.assignee_agent && (
                <span className="text-xs text-gray-400 block mt-0.5">{task.assignee_agent.instance_name}</span>
              )}
            </div>
          </div>
        ))}
        {(!tasks || tasks.length === 0) && (
          <p className="text-sm text-gray-300 text-center py-4">还没有任务，添加第一个吧</p>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl border border-dashed border-gray-200 hover:border-indigo-300 transition-colors">
        <Plus className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="添加新任务…"
          className="flex-1 text-sm border-0 bg-transparent focus:outline-none placeholder:text-gray-400 py-1"
        />
        {createTask.isPending && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
      </div>
    </div>
  )
}
