// Netlify Function：Agent 进度上报接口
// Agent 调用方式：
//   POST /.netlify/functions/report-progress
//   Headers: { "x-api-key": "<agent_instance_api_key>" }
//   Body: { "project_id": "uuid", "event_type": "...", "message": "...", ... }

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

    const { data: instance, error: instanceError } = await supabase
      .from('agent_instances')
      .select('*')
      .eq('api_key', apiKey)
      .single()

    if (instanceError || !instance) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid API key' }) }
    }

    const body = JSON.parse(event.body)
    const { project_id, event_type, message, task_status, task_title, local_path, metadata } = body

    if (!project_id || !event_type || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: project_id, event_type, message' }) }
    }

    // 更新 agent 在线状态
    await supabase
      .from('agent_instances')
      .update({ is_online: true, last_active_at: new Date().toISOString() })
      .eq('id', instance.id)

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

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, log_id: log.id }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
