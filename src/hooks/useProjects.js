import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { adminUpdateProject } from '../lib/adminApi'

export function useProjects(filters = {}) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select(`
          *,
          leader_agent_type:leader_agent_type_id (
            id, name, icon
          ),
          project_paths (
            id, local_path, agent_instance_id,
            agent_instance:agent_instance_id (
              id, instance_name, hostname, platform
            )
          ),
          tasks (id, status),
          project_collaborators (
            id,
            agent_instance:agent_instance_id (
              id, instance_name,
              agent_type:agent_type_id (name)
            )
          )
        `)
        .order('updated_at', { ascending: false })

      if (filters.project_type) {
        query = query.eq('project_type', filters.project_type)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query
      if (error) throw error

      return data.map(project => ({
        ...project,
        progress: project.tasks?.length > 0
          ? Math.round((project.tasks.filter(t => t.status === 'done').length / project.tasks.length) * 100)
          : 0,
        done_tasks: project.tasks?.filter(t => t.status === 'done').length ?? 0,
        total_tasks: project.tasks?.length ?? 0,
      }))
    },
  })
}

export function useProject(id) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          leader_agent_type:leader_agent_type_id (
            id, name, icon
          ),
          project_paths (
            id, local_path, remote_url, last_synced_at,
            agent_instance:agent_instance_id (
              id, instance_name, hostname, platform
            )
          ),
          tasks (
            id, title, description, status, sort_order, parent_task_id,
            assignee_agent:assignee_agent_instance_id (
              id, instance_name
            )
          ),
          project_collaborators (
            id, role,
            agent_instance:agent_instance_id (
              id, instance_name,
              agent_type:agent_type_id (name)
            )
          )
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      data.tasks?.sort((a, b) => a.sort_order - b.sort_order)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (project) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(project)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    // 走 admin-project Function（service role），绕过表的 RLS。
    // 失败可能抛 AdminAuthRequiredError —— 调用方需捕获并弹 token 输入框。
    mutationFn: async ({ id, token, ...fields }) => {
      const result = await adminUpdateProject(id, fields, token)
      return result.project
    },
    // 乐观更新：拖拽时立刻在 UI 反映，无需等服务器
    onMutate: async ({ id, token, ...fields }) => {
      // 取消所有 projects 查询，避免覆盖乐观更新
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      await queryClient.cancelQueries({ queryKey: ['project', id] })

      // 快照所有相关缓存以便失败回滚
      const projectsSnapshots = queryClient.getQueriesData({ queryKey: ['projects'] })
      const projectSnapshot = queryClient.getQueryData(['project', id])

      // 更新所有 projects 列表缓存中的对应项
      queryClient.setQueriesData({ queryKey: ['projects'] }, (old) => {
        if (!Array.isArray(old)) return old
        return old.map(p => p.id === id ? { ...p, ...fields } : p)
      })

      // 更新单项详情缓存
      if (projectSnapshot) {
        queryClient.setQueryData(['project', id], { ...projectSnapshot, ...fields })
      }

      return { projectsSnapshots, projectSnapshot }
    },
    onError: (_err, { id }, ctx) => {
      // 回滚所有快照
      if (ctx?.projectsSnapshots) {
        for (const [key, data] of ctx.projectsSnapshots) {
          queryClient.setQueryData(key, data)
        }
      }
      if (ctx?.projectSnapshot) {
        queryClient.setQueryData(['project', id], ctx.projectSnapshot)
      }
    },
    onSettled: (_data, _err, { id }) => {
      // 最终用服务端的权威数据校正一次
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      if (id) queryClient.invalidateQueries({ queryKey: ['project', id] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project'] })
    },
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (task) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project'] })
    },
  })
}
