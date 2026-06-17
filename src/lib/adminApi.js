// 共享：调用 admin-project Netlify Function
//
// 鉴权：localStorage 中的 ADMIN_TOKEN
// 失败时 throw Error，调用方负责捕获并弹 token 输入框

const ADMIN_TOKEN_KEY = 'agent-dashboard:admin-token'

export const ADMIN_TOKEN_STORAGE_KEY = ADMIN_TOKEN_KEY

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || ''
}

export function setAdminToken(token) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export class AdminAuthRequiredError extends Error {
  constructor(message = '需要管理员 Token') {
    super(message)
    this.name = 'AdminAuthRequiredError'
  }
}

async function callAdmin(body, token) {
  const useToken = token ?? getAdminToken()
  if (!useToken) {
    throw new AdminAuthRequiredError('未配置管理员 Token')
  }

  const resp = await fetch('/api/admin-project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-token': useToken },
    body: JSON.stringify(body),
  })
  const result = await resp.json().catch(() => ({}))
  if (resp.status === 401) {
    throw new AdminAuthRequiredError(result.error || 'Token 无效')
  }
  if (!resp.ok || !result.success) {
    throw new Error(result.error || `请求失败 (HTTP ${resp.status})`)
  }
  return result
}

export function adminUpdateProject(projectId, fields, token) {
  return callAdmin({ action: 'update', project_id: projectId, fields }, token)
}

export function adminDeleteProject(projectId, token) {
  return callAdmin({ action: 'delete', project_id: projectId }, token)
}