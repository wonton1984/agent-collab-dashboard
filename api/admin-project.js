// Vercel Serverless Function：管理员项目操作接口
// 从 Netlify Function 迁移而来，逻辑完全一致，仅改请求/响应格式。
//
// 调用方式：
//   POST /api/admin-project
//   Headers: { "x-admin-token": "<ADMIN_TOKEN>" }
//   Body:
//     { "action": "update", "project_id": "uuid", "fields": { ... } }
//     { "action": "delete", "project_id": "uuid" }

import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).setHeader('Access-Control-Allow-Origin', '*').end('')
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const adminToken = req.headers['x-admin-token']
    const expectedToken = process.env.ADMIN_TOKEN
    if (!expectedToken) {
      return res.status(500).json({ error: 'ADMIN_TOKEN not configured on server' })
    }
    if (!adminToken || adminToken !== expectedToken) {
      return res.status(401).json({ error: 'Invalid admin token' })
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { action, project_id } = body

    if (!action) return res.status(400).json({ error: 'Missing action' })
    if (!project_id) return res.status(400).json({ error: 'Missing project_id' })

    // ========== action: update ==========
    if (action === 'update') {
      const { fields } = body
      if (!fields || Object.keys(fields).length === 0) {
        return res.status(400).json({ error: 'Missing fields' })
      }
      const allowedFields = ['name', 'description', 'project_type', 'status', 'priority', 'tags', 'metadata']
      const updateData = {}
      for (const key of allowedFields) {
        if (fields[key] !== undefined) updateData[key] = fields[key]
      }
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' })
      }

      const { data, error } = await supabase
        .from('projects').update(updateData).eq('id', project_id).select()
      if (error) {
        return res.status(500).json({ error: 'Failed to update project', details: error.message })
      }
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Project not found' })
      }
      return res.status(200).json({ success: true, project: data[0] })
    }

    // ========== action: delete ==========
    if (action === 'delete') {
      const { data: project, error: fetchError } = await supabase
        .from('projects').select('id, name').eq('id', project_id).maybeSingle()
      if (fetchError) {
        return res.status(500).json({ error: 'Failed to look up project', details: fetchError.message })
      }
      if (!project) {
        return res.status(404).json({ error: 'Project not found' })
      }

      const tables = ['activity_log', 'tasks', 'project_paths', 'project_collaborators']
      const deletedCounts = {}
      for (const tbl of tables) {
        const { error, count } = await supabase
          .from(tbl).delete({ count: 'exact' }).eq('project_id', project_id)
        if (error) {
          return res.status(500).json({ error: `Failed to delete from ${tbl}`, details: error.message })
        }
        deletedCounts[tbl] = count ?? 0
      }

      const { error: deleteProjectError } = await supabase
        .from('projects').delete().eq('id', project_id)
      if (deleteProjectError) {
        return res.status(500).json({ error: 'Failed to delete project', details: deleteProjectError.message })
      }

      return res.status(200).json({
        success: true,
        deleted_project: { id: project.id, name: project.name },
        deleted_related: deletedCounts,
      })
    }

    return res.status(400).json({ error: `Unknown action: ${action}` })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
