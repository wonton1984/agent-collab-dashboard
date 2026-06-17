// Vercel Serverless Function：Agent 进度上报接口
// 从 Netlify Function 迁移而来，逻辑完全一致，仅改请求/响应格式。
//
// 调用方式：
//   POST /api/report-progress
//   Headers: { "x-api-key": "<agent_instance_api_key>" }

import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body, status = 200) {
  return { statusCode: status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).setHeader('Access-Control-Allow-Origin', '*').end('')
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const apiKey = req.headers['x-api-key']
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing x-api-key header' })
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 验证 API Key，获取 agent instance
    const { data: instance, error: instanceError } = await supabase
      .from('agent_instances')
      .select('*, agent_type:agent_type_id(id, name)')
      .eq('api_key', apiKey)
      .single()

    if (instanceError || !instance) {
      return res.status(401).json({ error: 'Invalid API key' })
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    let { project_id, create_project, update_project, add_collaborator, event_type, message, task_status, task_title, local_path, metadata } = body

    // 更新 agent 在线状态
    await supabase
      .from('agent_instances')
      .update({ is_online: true, last_active_at: new Date().toISOString() })
      .eq('id', instance.id)

    // ========== 创建新项目 ==========
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
        return res.status(500).json({ error: 'Failed to create project', details: projectError.message })
      }

      project_id = newProject.id

      if (local_path) {
        await supabase.from('project_paths').insert({
          project_id, agent_instance_id: instance.id, local_path,
          last_synced_at: new Date().toISOString(),
        })
      }

      await supabase.from('activity_log').insert({
        project_id, agent_instance_id: instance.id,
        event_type: 'agent_report',
        message: `创建了项目 "${create_project.name}"`,
      })
    }

    if (!project_id) {
      return res.status(400).json({ error: 'Missing project_id or create_project' })
    }

    // ========== 修改项目信息 ==========
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
          .from('projects').update(updateFields).eq('id', project_id)
        if (updateError) {
          return res.status(500).json({ error: 'Failed to update project', details: updateError.message })
        }
        const changeMsg = Object.keys(updateFields).map(k => `${k}: ${JSON.stringify(updateFields[k])}`).join(', ')
        await supabase.from('activity_log').insert({
          project_id, agent_instance_id: instance.id,
          event_type: 'status_change',
          message: `修改了项目信息 (${changeMsg})`,
        })
      }
    }

    // ========== 添加负责人 ==========
    if (add_collaborator) {
      let targetInstanceId = add_collaborator.agent_instance_id
      if (!targetInstanceId && add_collaborator.agent_type_name) {
        const { data: agentType } = await supabase
          .from('agent_types').select('id').eq('name', add_collaborator.agent_type_name).single()
        if (agentType) {
          const { data: instances } = await supabase
            .from('agent_instances').select('id').eq('agent_type_id', agentType.id).limit(1)
          if (instances && instances.length > 0) targetInstanceId = instances[0].id
        }
      }
      if (targetInstanceId) {
        const { error: collabError } = await supabase
          .from('project_collaborators')
          .upsert({
            project_id, agent_instance_id: targetInstanceId,
            role: add_collaborator.role || 'leader',
            added_by_instance_id: instance.id,
          }, { onConflict: 'project_id, agent_instance_id' })
        if (!collabError) {
          const { data: addedInstance } = await supabase
            .from('agent_instances').select('instance_name').eq('id', targetInstanceId).single()
          await supabase.from('activity_log').insert({
            project_id, agent_instance_id: instance.id,
            event_type: 'note',
            message: `添加了 ${addedInstance?.instance_name || '新成员'} 作为负责人`,
          })
        }
      }
    }

    // ========== 上报进度 ==========
    if (event_type && message) {
      if (local_path) {
        await supabase.from('project_paths').upsert({
          project_id, agent_instance_id: instance.id, local_path,
          last_synced_at: new Date().toISOString(),
        }, { onConflict: 'project_id, agent_instance_id' })
      }

      if (task_title) {
        const { data: existingTask } = await supabase
          .from('tasks').select('id').eq('project_id', project_id).eq('title', task_title).maybeSingle()
        if (existingTask) {
          await supabase.from('tasks').update({
            status: task_status || 'in_progress',
            assignee_agent_instance_id: instance.id,
          }).eq('id', existingTask.id)
        } else {
          await supabase.from('tasks').insert({
            project_id, title: task_title,
            status: task_status || 'todo',
            assignee_agent_instance_id: instance.id,
          })
        }
      }

      const { error: logError } = await supabase.from('activity_log').insert({
        project_id, agent_instance_id: instance.id,
        event_type, message, metadata: metadata || {},
      }).select().single()

      if (logError) {
        return res.status(500).json({ error: 'Failed to write log' })
      }
    }

    return res.status(200).json({
      success: true,
      project_id,
      created: !!create_project,
      updated: !!update_project,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
