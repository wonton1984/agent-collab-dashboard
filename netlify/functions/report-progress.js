// Netlify Function：Agent 进度上报接口
// Agent 调用方式：
//   POST /.netlify/functions/report-progress
//   Headers: { "x-api-key": "<agent_instance_api_key>" }
//   Body: {
//     "project_id": "uuid",              // 必需，指定要操作的项目
//     "create_project": { ... },         // 可选，创建新项目（不需要 project_id）
//     "update_project": { ... },         // 可选，修改项目信息
//     "event_type": "agent_report",      // 可选
//     "message": "进度描述",              // 可选
//     "task_title": "任务名（可选）",
//     "task_status": "done（可选）",
//     "local_path": "本地路径（可选）"
//   }
//
// update_project 支持的字段：
//   - name: 项目名称
//   - description: 项目描述
//   - project_type: engineering|paper|research|learning|literature
//   - status: planning|in_progress|paused|completed|abandoned
//   - priority: high|medium|low
//   - tags: ["标签1", "标签2"]

import { createClient } from '@supabase/supabase-js'

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const apiKey = event.headers['x-api-key']
    if (!apiKey) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Missing x-api-key header' }) }
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 验证 API Key，获取 agent instance
    const { data: instance, error: instanceError } = await supabase
      .from('agent_instances')
      .select('*, agent_type:agent_type_id(id, name)')
      .eq('api_key', apiKey)
      .single()

    if (instanceError || !instance) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid API key' }) }
    }

    const body = JSON.parse(event.body)
    let { project_id, create_project, update_project, add_collaborator, event_type, message, task_status, task_title, local_path, metadata } = body

    // 更新 agent 在线状态
    await supabase
      .from('agent_instances')
      .update({ is_online: true, last_active_at: new Date().toISOString() })
      .eq('id', instance.id)

    // ========== 创建新项目（如果需要）==========
    if (!project_id && create_project) {
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: create_project.name,
          description: create_project.description || '',
          project_type: create_project.project_type || 'engineering',
          status: 'in_progress',
          priority: create_project.priority || 'medium',
          leader_agent_type_id: instance.agent_type.id,
          tags: create_project.tags || [],
          metadata: create_project.metadata || {},
        })
        .select()
        .single()

      if (projectError) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create project', details: projectError.message }) }
      }

      project_id = newProject.id

      // 如果提供了 local_path，自动关联
      if (local_path) {
        await supabase
          .from('project_paths')
          .insert({
            project_id,
            agent_instance_id: instance.id,
            local_path,
            last_synced_at: new Date().toISOString(),
          })
      }

      // 写入项目创建日志
      await supabase
        .from('activity_log')
        .insert({
          project_id,
          agent_instance_id: instance.id,
          event_type: 'agent_report',
          message: `创建了项目 "${create_project.name}"`,
        })
    }

    // 必须有 project_id 才能继续操作
    if (!project_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing project_id or create_project' }) }
    }

    // ========== 修改项目信息（如果需要）==========
    if (update_project) {
      const updateFields = {}
      if (update_project.name) updateFields.name = update_project.name
      if (update_project.description) updateFields.description = update_project.description
      if (update_project.project_type) updateFields.project_type = update_project.project_type
      if (update_project.status) updateFields.status = update_project.status
      if (update_project.priority) updateFields.priority = update_project.priority
      if (update_project.tags) updateFields.tags = update_project.tags
      if (update_project.metadata) updateFields.metadata = update_project.metadata

      if (Object.keys(updateFields).length > 0) {
        const { error: updateError } = await supabase
          .from('projects')
          .update(updateFields)
          .eq('id', project_id)

        if (updateError) {
          return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update project', details: updateError.message }) }
        }

        // 写入修改日志
        const changeMsg = Object.keys(updateFields).map(k => `${k}: ${JSON.stringify(updateFields[k])}`).join(', ')
        await supabase
          .from('activity_log')
          .insert({
            project_id,
            agent_instance_id: instance.id,
            event_type: 'status_change',
            message: `修改了项目信息 (${changeMsg})`,
          })
      }
    }

    // ========== 添加负责人（兼容旧参数名 add_collaborator）==========
    if (add_collaborator) {
      let targetInstanceId = add_collaborator.agent_instance_id

      // 如果没有传 instance_id，但传了 agent_type_name，按名称查找
      if (!targetInstanceId && add_collaborator.agent_type_name) {
        const { data: agentType } = await supabase
          .from('agent_types')
          .select('id')
          .eq('name', add_collaborator.agent_type_name)
          .single()

        if (agentType) {
          const { data: instances } = await supabase
            .from('agent_instances')
            .select('id')
            .eq('agent_type_id', agentType.id)
            .limit(1)

          if (instances && instances.length > 0) {
            targetInstanceId = instances[0].id
          }
        }
      }

      if (targetInstanceId) {
        const { error: collabError } = await supabase
          .from('project_collaborators')
          .upsert({
            project_id,
            agent_instance_id: targetInstanceId,
            role: add_collaborator.role || 'leader',
            added_by_instance_id: instance.id,
          }, { onConflict: 'project_id, agent_instance_id' })

        if (!collabError) {
          const { data: addedInstance } = await supabase
            .from('agent_instances')
            .select('instance_name')
            .eq('id', targetInstanceId)
            .single()

          await supabase
            .from('activity_log')
            .insert({
              project_id,
              agent_instance_id: instance.id,
              event_type: 'note',
              message: `添加了 ${addedInstance?.instance_name || '新成员'} 作为负责人`,
            })
        }
      }
    }

    // ========== 上报进度（如果提供了 event_type 和 message）==========
    if (event_type && message) {
      // 如果提供了路径，更新 project_paths
      if (local_path) {
        await supabase
          .from('project_paths')
          .upsert({
            project_id,
            agent_instance_id: instance.id,
            local_path,
            last_synced_at: new Date().toISOString(),
          }, { onConflict: 'project_id, agent_instance_id' })
      }

      // 如果提供了任务信息，创建或更新任务
      if (task_title) {
        const { data: existingTask } = await supabase
          .from('tasks')
          .select('id')
          .eq('project_id', project_id)
          .eq('title', task_title)
          .maybeSingle()

        if (existingTask) {
          await supabase
            .from('tasks')
            .update({
              status: task_status || 'in_progress',
              assignee_agent_instance_id: instance.id,
            })
            .eq('id', existingTask.id)
        } else {
          await supabase
            .from('tasks')
            .insert({
              project_id,
              title: task_title,
              status: task_status || 'todo',
              assignee_agent_instance_id: instance.id,
            })
        }
      }

      // 写入活动日志
      const { data: log, error: logError } = await supabase
        .from('activity_log')
        .insert({
          project_id,
          agent_instance_id: instance.id,
          event_type,
          message,
          metadata: metadata || {},
        })
        .select()
        .single()

      if (logError) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to write log' }) }
      }
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: true, 
        project_id,
        created: !!create_project,
        updated: !!update_project,
      }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
