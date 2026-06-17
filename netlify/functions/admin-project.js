// Netlify Function：管理员项目操作接口
// 仅供 Dashboard 网页内部使用，不开放给任何 Agent。
//
// 调用方式：
//   POST /.netlify/functions/admin-project
//   Headers:
//     Content-Type: application/json
//     x-admin-token: <ADMIN_TOKEN>
//   Body 需指定 action:
//
//   1. action: "update" — 修改项目信息
//      { "action": "update", "project_id": "uuid", "fields": { "name": "...", "status": "...", ... } }
//
//   2. action: "delete" — 删除项目及所有关联数据
//      { "action": "delete", "project_id": "uuid" }

import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function adminOnly(supabase, serviceKey) {
  // placeholder — 实际鉴权在 handler 入口统一做
  return createClient(supabase, serviceKey)
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const adminToken = event.headers['x-admin-token']
    const expectedToken = process.env.ADMIN_TOKEN
    if (!expectedToken) {
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'ADMIN_TOKEN not configured on server' }) }
    }
    if (!adminToken || adminToken !== expectedToken) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid admin token' }) }
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Server configuration error' }) }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = JSON.parse(event.body || '{}')
    const { action, project_id } = body

    if (!action) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing action' }) }
    }
    if (!project_id) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing project_id' }) }
    }

    // ========== action: update ==========
    if (action === 'update') {
      const { fields } = body
      if (!fields || Object.keys(fields).length === 0) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing fields' }) }
      }

      // 只允许这些字段被更新
      const allowedFields = ['name', 'description', 'project_type', 'status', 'priority', 'tags', 'metadata']
      const updateData = {}
      for (const key of allowedFields) {
        if (fields[key] !== undefined) updateData[key] = fields[key]
      }
      if (Object.keys(updateData).length === 0) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'No valid fields to update' }) }
      }

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', project_id)
        .select()

      if (error) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to update project', details: error.message }) }
      }
      if (!data || data.length === 0) {
        return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Project not found' }) }
      }

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, project: data[0] }),
      }
    }

    // ========== action: delete ==========
    if (action === 'delete') {
      const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', project_id)
        .maybeSingle()

      if (fetchError) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to look up project', details: fetchError.message }) }
      }
      if (!project) {
        return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ error: 'Project not found' }) }
      }

      const tables = ['activity_log', 'tasks', 'project_paths', 'project_collaborators']
      const deletedCounts = {}
      for (const tbl of tables) {
        const { error, count } = await supabase
          .from(tbl)
          .delete({ count: 'exact' })
          .eq('project_id', project_id)
        if (error) {
          return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: `Failed to delete from ${tbl}`, details: error.message }) }
        }
        deletedCounts[tbl] = count ?? 0
      }

      const { error: deleteProjectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', project_id)

      if (deleteProjectError) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'Failed to delete project', details: deleteProjectError.message }) }
      }

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, deleted_project: { id: project.id, name: project.name }, deleted_related: deletedCounts }),
      }
    }

    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: `Unknown action: ${action}` }) }
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    }
  }
}