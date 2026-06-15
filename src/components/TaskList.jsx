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
      <div className="space-y-1">
        {tasks?.map((task) => (
          <div
            key={task.id}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer group',
              task.status === 'done' && 'opacity-60',
            )}
            onClick={() => toggleTask(task)}
          >
            {task.status === 'done' ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300 group-hover:text-gray-400 flex-shrink-0" />
            )}
            <span className={clsx(
              'text-sm flex-1',
              task.status === 'done' && 'line-through text-gray-400',
            )}>
              {task.title}
            </span>
            {task.assignee_agent && (
              <span className="text-xs text-gray-400">{task.assignee_agent.instance_name}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-2 px-3">
        <Plus className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          placeholder="添加新任务..."
          className="flex-1 text-sm border-0 bg-transparent focus:outline-none placeholder:text-gray-400 py-1.5"
        />
        {createTask.isPending && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>
    </div>
  )
}
