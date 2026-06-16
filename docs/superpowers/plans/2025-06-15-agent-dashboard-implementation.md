# Agent 协作 Dashboard — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web-based dashboard for managing multiple AI agents (Codex, Zcode, Claude Code, Hermes) and their projects, with Supabase backend and Netlify deployment.

**Architecture:** Single-page React app (Vite) talking to Supabase PostgreSQL via the official JS SDK. Agents report progress via Supabase REST API. Netlify hosts the frontend and provides optional serverless functions for agent reporting. Data model uses 6 tables normalized around agent_types → agent_instances → projects → project_paths / tasks → activity_log.

**Tech Stack:** React 18 + Vite, Supabase (PostgreSQL + REST API + Realtime), Tailwind CSS (with shadcn/ui or similar lightweight UI kit), TanStack Query, Recharts, Netlify (hosting + functions)

---

### 文件结构

```
agent协作dashboard/
├── src/
│   ├── main.jsx                      # 入口
│   ├── App.jsx                       # 路由 + 布局
│   ├── index.css                     # Tailwind 入口
│   ├── lib/
│   │   └── supabase.js               # Supabase 客户端初始化
│   ├── hooks/
│   │   ├── useProjects.js            # 项目相关查询
│   │   ├── useAgents.js              # Agent 相关查询
│   │   └── useActivityLog.js         # 日志相关查询
│   ├── components/
│   │   ├── Layout.jsx                # 页面框架（导航栏 + 内容区）
│   │   ├── StatsCard.jsx             # 统计卡片
│   │   ├── ProjectCard.jsx           # 项目卡片（列表项）
│   │   ├── ProjectForm.jsx           # 新建/编辑项目表单
│   │   ├── TaskList.jsx              # 任务列表组件
│   │   ├── ActivityFeed.jsx          # 活动时间线
│   │   ├── AgentCard.jsx             # Agent 卡片
│   │   └── StatusBadge.jsx           # 状态标签
│   └── pages/
│       ├── Dashboard.jsx             # 概览页
│       ├── Projects.jsx              # 项目列表页
│       ├── ProjectDetail.jsx         # 项目详情页
│       ├── Agents.jsx                # Agent 管理页
│       └── ActivityLog.jsx           # 活动日志页
├── supabase/
│   └── migration.sql                 # 数据库 Schema SQL
├── netlify/
│   └── functions/
│       └── report-progress.js        # Agent 上报进度的 Serverless Function
├── index.html
├── vite.config.js
├── package.json
├── netlify.toml
├── tailwind.config.js
└── postcss.config.js
```

---

### Task 1: 项目脚手架 — Vite + React + Tailwind + 路由

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/index.css`
- Create: `netlify.toml`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "agent-dashboard",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "@supabase/supabase-js": "^2.45.0",
    "@tanstack/react-query": "^5.51.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.424.0",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0",
    "tailwindcss": "^3.4.7",
    "postcss": "^8.4.41",
    "autoprefixer": "^10.4.20"
  }
}
```

- [ ] **Step 2: 创建 vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

- [ ] **Step 3: 创建 tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 4: 创建 postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Agent 协作 Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 6: 创建 src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: 创建 src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
```

- [ ] **Step 8: 创建 src/App.jsx（路由骨架）**

```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Agents from './pages/Agents'
import ActivityLog from './pages/ActivityLog'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/activity" element={<ActivityLog />} />
      </Route>
    </Routes>
  )
}
```

- [ ] **Step 9: 创建 netlify.toml**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 10: 安装依赖并验证**

Run: `cd /Users/wonton1984/Documents/agent协作dashboard && npm install`
Expected: 安装成功无报错

- [ ] **Step 11: 验证开发服务器启动**

Run: `cd /Users/wonton1984/Documents/agent协作dashboard && npx vite --port 3000`
Expected: 终端显示 Vite dev server running at http://localhost:3000
然后按 Ctrl+C 停止

- [ ] **Step 12: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Vite + React + Tailwind project with routing"
```

---

### Task 2: Layout 组件 — 导航框架 + 响应式侧边栏

**Files:**
- Create: `src/components/Layout.jsx`

- [ ] **Step 1: 创建 Layout.jsx**

```jsx
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Bot, Activity, Menu, X } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', label: '概览', icon: LayoutDashboard },
  { to: '/projects', label: '项目', icon: FolderKanban },
  { to: '/agents', label: 'Agent', icon: Bot },
  { to: '/activity', label: '活动日志', icon: Activity },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:transform-none',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">🎯 Agent Dashboard</h1>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部条（移动端显示菜单按钮） */}
        <header className="lg:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="ml-3 font-semibold text-gray-900">🎯 Agent Dashboard</h1>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 验证页面路由和导航渲染**

Run: `cd /Users/wonton1984/Documents/agent协作dashboard && npx vite --port 3000`
Expected: 浏览器打开后能看到左侧导航栏，有"概览"、"项目"、"Agent"、"活动日志"四个导航项，内容区显示空白页面（各页面组件尚未创建）

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add responsive Layout with sidebar navigation"
```

---

### Task 3: Supabase 数据库 Schema 创建

**Files:**
- Create: `supabase/migration.sql`

- [ ] **Step 1: 编写迁移 SQL（在 Supabase SQL Editor 中执行）**

```sql
-- ============================================
-- Agent 协作 Dashboard — 数据库 Schema
-- ============================================

-- 扩展 UUID 生成
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3.1 agent_types
CREATE TABLE agent_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  capabilities TEXT[] DEFAULT '{}',
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.2 agent_instances
CREATE TABLE agent_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_type_id UUID NOT NULL REFERENCES agent_types(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  hostname TEXT,
  platform TEXT,
  local_base_path TEXT,
  api_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.3 projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL CHECK (project_type IN ('engineering', 'paper', 'research', 'learning', 'literature')),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'paused', 'completed', 'abandoned')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  leader_agent_type_id UUID REFERENCES agent_types(id),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.4 project_paths
CREATE TABLE project_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_instance_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
  local_path TEXT NOT NULL,
  remote_url TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, agent_instance_id)
);

-- 3.5 tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  assignee_agent_instance_id UUID REFERENCES agent_instances(id),
  parent_task_id UUID REFERENCES tasks(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.6 activity_log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  agent_instance_id UUID REFERENCES agent_instances(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('status_change', 'task_complete', 'note', 'manual_edit', 'agent_report')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_agent_instances_api_key ON agent_instances(api_key);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_project_type ON projects(project_type);
CREATE INDEX idx_project_paths_project ON project_paths(project_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_activity_log_project ON activity_log(project_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- 自动更新 updated_at 的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 启用
ALTER TABLE agent_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS 策略：所有表允许公开读（Web 前端读取）
CREATE POLICY "Allow public read" ON agent_types FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON agent_instances FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON project_paths FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON tasks FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON activity_log FOR SELECT USING (true);

-- RLS 策略：agent 实例通过 api_key 写入
-- agent_instances: 仅允许更新自己的在线状态
CREATE POLICY "Agent update own instance" ON agent_instances
  FOR UPDATE USING (api_key = current_setting('request.headers')::json->>'apikey');

-- project_paths: 允许通过 api_key 验证后插入/更新
CREATE POLICY "Agent manage own paths" ON project_paths
  FOR INSERT WITH CHECK (
    agent_instance_id IN (
      SELECT id FROM agent_instances WHERE api_key = current_setting('request.headers')::json->>'apikey'
    )
  );

-- activity_log: agent 可以插入日志
CREATE POLICY "Agent insert log" ON activity_log
  FOR INSERT WITH CHECK (true);
```

- [ ] **Step 2: 在 Supabase 中创建项目并执行迁移**

需要用户手动操作：
1. 访问 https://supabase.com 注册/登录
2. 创建新项目（选择免费版）
3. 在 SQL Editor 中粘贴并执行上述 SQL
4. 记录下 Supabase URL 和 anon key（后续使用）

- [ ] **Step 3: 插入初始种子数据（在 Supabase SQL Editor 中执行）**

```sql
-- 种子数据：agent_types
INSERT INTO agent_types (name, description, capabilities, icon) VALUES
  ('Codex', 'OpenAI 的 AI 编程助手', ARRAY['frontend', 'engineering', 'react'], 'codex'),
  ('Zcode', '交互式编码 Agent', ARRAY['fullstack', 'debugging', 'engineering'], 'zcode'),
  ('Claude Code', 'Anthropic 的 Claude Code 编程 Agent', ARRAY['engineering', 'debugging', 'coding'], 'claude'),
  ('Hermes Agent', '通用任务 Agent', ARRAY['paper-writing', 'literature-search', 'research'], 'hermes');

-- 种子数据：agent_instances（示例，api_key 会在插入时自动生成）
INSERT INTO agent_instances (agent_type_id, instance_name, hostname, platform)
SELECT id, 'Codex（MacBook Pro）', 'macbook-pro.local', 'macOS'
FROM agent_types WHERE name = 'Codex';

INSERT INTO agent_instances (agent_type_id, instance_name, hostname, platform)
SELECT id, 'Zcode（MacBook Pro）', 'macbook-pro.local', 'macOS'
FROM agent_types WHERE name = 'Zcode';

INSERT INTO agent_instances (agent_type_id, instance_name, hostname, platform)
SELECT id, 'Hermes Agent（MacBook Pro）', 'macbook-pro.local', 'macOS'
FROM agent_types WHERE name = 'Hermes Agent';
```

- [ ] **Step 4: 保存 SQL 文件并提交**

```bash
git add supabase/migration.sql
git commit -m "feat: add Supabase database schema with RLS policies and seed data"
```

---

### Task 4: Supabase 客户端 + 基础 Hooks

**Files:**
- Create: `src/lib/supabase.js`
- Create: `src/hooks/useProjects.js`
- Create: `src/hooks/useAgents.js`
- Create: `src/hooks/useActivityLog.js`

- [ ] **Step 1: 创建 Supabase 客户端**

```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 2: 创建 .env 文件（占位）**

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

- [ ] **Step 3: 创建 useProjects.js**

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// 获取项目列表（含关联的 agent_type 信息）
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
          tasks (id, status)
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

      // 计算每个项目的进度
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

// 获取单个项目详情
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
          )
        `)
        .eq('id', id)
        .single()
      if (error) throw error

      // 按 sort_order 排序任务
      data.tasks?.sort((a, b) => a.sort_order - b.sort_order)

      return data
    },
    enabled: !!id,
  })
}

// 创建项目
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

// 更新项目
export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['project', data.id] })
    },
  })
}

// 更新任务状态
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

// 添加任务
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
```

- [ ] **Step 4: 创建 useAgents.js**

```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useAgentTypes() {
  return useQuery({
    queryKey: ['agent-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_types')
        .select('*')
        .order('name')
      if (error) throw error
      return data
    },
  })
}

export function useAgentInstances() {
  return useQuery({
    queryKey: ['agent-instances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_instances')
        .select(`
          *,
          agent_type:agent_type_id (
            id, name, icon, capabilities
          )
        `)
        .order('instance_name')
      if (error) throw error
      return data
    },
  })
}

export function useAgentInstance(id) {
  return useQuery({
    queryKey: ['agent-instance', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_instances')
        .select(`
          *,
          agent_type:agent_type_id (
            id, name, icon, capabilities
          ),
          project_paths (
            id, local_path, last_synced_at,
            project:project_id (
              id, name, project_type, status
            )
          )
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateAgentInstance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (instance) => {
      const { data, error } = await supabase
        .from('agent_instances')
        .insert(instance)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-instances'] })
    },
  })
}
```

- [ ] **Step 5: 创建 useActivityLog.js**

```js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useActivityLog(filters = {}, limit = 50) {
  return useQuery({
    queryKey: ['activity-log', filters, limit],
    queryFn: async () => {
      let query = supabase
        .from('activity_log')
        .select(`
          *,
          project:project_id (id, name),
          agent_instance:agent_instance_id (
            id, instance_name,
            agent_type:agent_type_id (name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id)
      }
      if (filters.event_type) {
        query = query.eq('event_type', filters.event_type)
      }
      if (filters.agent_instance_id) {
        query = query.eq('agent_instance_id', filters.agent_instance_id)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Supabase client and React Query hooks for all data models"
```

---

### Task 4: 通用 UI 组件

**Files:**
- Create: `src/components/StatusBadge.jsx`
- Create: `src/components/StatsCard.jsx`

- [ ] **Step 1: 创建 StatusBadge.jsx**

```jsx
import clsx from 'clsx'

const statusConfig = {
  planning:     { label: '计划中', color: 'bg-gray-100 text-gray-700' },
  in_progress:  { label: '进行中', color: 'bg-blue-100 text-blue-700' },
  paused:       { label: '暂停中', color: 'bg-yellow-100 text-yellow-700' },
  completed:    { label: '已完成', color: 'bg-green-100 text-green-700' },
  abandoned:    { label: '已放弃', color: 'bg-red-100 text-red-700' },
  todo:         { label: '待开始', color: 'bg-gray-100 text-gray-600' },
  review:       { label: '审核中', color: 'bg-purple-100 text-purple-700' },
  done:         { label: '已完成', color: 'bg-green-100 text-green-700' },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-700' }
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.color)}>
      {config.label}
    </span>
  )
}
```

- [ ] **Step 2: 创建 StatsCard.jsx**

```jsx
export default function StatsCard({ icon: Icon, label, value, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add StatusBadge and StatsCard shared components"
```

---

### Task 5: 概览页 — Dashboard

**Files:**
- Create: `src/pages/Dashboard.jsx`
- Create: `src/components/ActivityFeed.jsx`（复用）

- [ ] **Step 1: 创建 Dashboard.jsx**

```jsx
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { FolderKanban, Activity, Bot, PauseCircle } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { useAgentTypes } from '../hooks/useAgents'
import { useActivityLog } from '../hooks/useActivityLog'
import StatsCard from '../components/StatsCard'
import ActivityFeed from '../components/ActivityFeed'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']

export default function Dashboard() {
  const { data: projects, isLoading: projectsLoading } = useProjects()
  const { data: agentTypes } = useAgentTypes()
  const { data: recentLogs } = useActivityLog({}, 8)

  if (projectsLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  }

  const inProgress = projects?.filter(p => p.status === 'in_progress').length ?? 0
  const paused = projects?.filter(p => p.status === 'paused').length ?? 0
  const completed = projects?.filter(p => p.status === 'completed').length ?? 0

  // 按类型分组
  const typeCount = {}
  projects?.forEach(p => {
    typeCount[p.project_type] = (typeCount[p.project_type] || 0) + 1
  })
  const pieData = Object.entries(typeCount).map(([name, value]) => ({
    name: { engineering: '工程', paper: '论文', research: '研究', learning: '学习', literature: '文献' }[name] || name,
    value,
  }))

  // Agent 活跃度排行
  const agentProjectCount = {}
  projects?.forEach(p => {
    if (p.leader_agent_type?.name) {
      agentProjectCount[p.leader_agent_type.name] = (agentProjectCount[p.leader_agent_type.name] || 0) + 1
    }
  })
  const agentRanking = Object.entries(agentProjectCount)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }))

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">📊 概览</h2>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={FolderKanban} label="总项目" value={projects?.length ?? 0} color="blue" />
        <StatsCard icon={Activity} label="进行中" value={inProgress} color="green" />
        <StatsCard icon={PauseCircle} label="暂停中" value={paused} color="yellow" />
        <StatsCard icon={Bot} label="Agent 种类" value={agentTypes?.length ?? 0} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 项目类型分布 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">项目类型分布</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm">暂无项目数据</p>
          )}
        </div>

        {/* Agent 活跃度 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Agent 负责项目数</h3>
          {agentRanking.length > 0 ? (
            <div className="space-y-3">
              {agentRanking.map((agent, i) => (
                <div key={agent.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 w-16">{agent.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${(agent.count / Math.max(...agentRanking.map(a => a.count))) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-6 text-right">{agent.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">暂无 Agent 数据</p>
          )}
        </div>
      </div>

      {/* 近期活动 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">近期活动</h3>
        </div>
        <ActivityFeed logs={recentLogs} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建 ActivityFeed.jsx**

```jsx
import { Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

const eventIcons = {
  status_change: '🔄',
  task_complete: '✅',
  note: '📝',
  manual_edit: '✏️',
  agent_report: '🤖',
}

function timeAgo(dateStr) {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

export default function ActivityFeed({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
        <Clock className="w-8 h-8 mb-2" />
        <p className="text-sm">暂无活动记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 text-sm">
          <span className="text-lg">{eventIcons[log.event_type] || '📌'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-gray-700">
              {log.agent_instance ? (
                <span className="font-medium">{log.agent_instance.instance_name}</span>
              ) : (
                <span className="font-medium">你</span>
              )}
              {' '}{log.message}
            </p>
            {log.project && (
              <Link to={`/projects/${log.project.id}`} className="text-blue-600 hover:underline text-xs">
                {log.project.name}
              </Link>
            )}
          </div>
          <span className="text-gray-400 text-xs whitespace-nowrap">{timeAgo(log.created_at)}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: 打开浏览器验证概览页渲染**

Run: `cd /Users/wonton1984/Documents/agent协作dashboard && npx vite --port 3000`
Expected: 访问 /dashboard 看到统计卡片（均为0）和"暂无项目数据"、"暂无 Agent 数据"等空状态提示。需要先配置环境变量连接到 Supabase 实例才会有数据。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Dashboard overview page with stats, pie chart, and activity feed"
```

---

### Task 6: 项目列表页 + 项目卡片

**Files:**
- Create: `src/pages/Projects.jsx`
- Create: `src/components/ProjectCard.jsx`
- Create: `src/components/ProjectForm.jsx`

- [ ] **Step 1: 创建 ProjectCard.jsx**

```jsx
import { Link } from 'react-router-dom'
import { Folder, MapPin } from 'lucide-react'
import StatusBadge from './StatusBadge'

const typeLabels = {
  engineering: '工程',
  paper: '论文',
  research: '研究',
  learning: '学习',
  literature: '文献',
}

const typeColors = {
  engineering: 'text-blue-600 bg-blue-50',
  paper: 'text-purple-600 bg-purple-50',
  research: 'text-green-600 bg-green-50',
  learning: 'text-yellow-600 bg-yellow-50',
  literature: 'text-red-600 bg-red-50',
}

export default function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">{project.name}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[project.project_type] || 'text-gray-600 bg-gray-50'}`}>
            {typeLabels[project.project_type] || project.project_type}
          </span>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* 路径信息 */}
      {project.project_paths?.length > 0 && (
        <div className="mb-3 space-y-1">
          {project.project_paths.map((pp) => (
            <div key={pp.id} className="flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="font-medium">{pp.agent_instance?.instance_name}:</span>
              <span className="truncate">{pp.local_path}</span>
            </div>
          ))}
        </div>
      )}

      {/* 进度条 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {project.progress}% · {project.done_tasks}/{project.total_tasks} 任务
        </span>
      </div>

      {/* 协作 Agent */}
      {project.leader_agent_type && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
          <span>负责人:</span>
          <span className="font-medium text-gray-700">{project.leader_agent_type.name}</span>
        </div>
      )}
    </Link>
  )
}
```

- [ ] **Step 2: 创建 Projects.jsx**

```jsx
import { useState } from 'react'
import { useProjects } from '../hooks/useProjects'
import ProjectCard from '../components/ProjectCard'
import ProjectForm from '../components/ProjectForm'
import { Plus, Search } from 'lucide-react'
import clsx from 'clsx'

const typeFilters = [
  { value: '', label: '全部' },
  { value: 'engineering', label: '工程' },
  { value: 'paper', label: '论文' },
  { value: 'research', label: '研究' },
  { value: 'learning', label: '学习' },
  { value: 'literature', label: '文献' },
]

const statusFilters = [
  { value: '', label: '全部' },
  { value: 'in_progress', label: '进行中' },
  { value: 'planning', label: '计划中' },
  { value: 'paused', label: '暂停中' },
  { value: 'completed', label: '已完成' },
]

export default function Projects() {
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  const { data: projects, isLoading } = useProjects({
    project_type: typeFilter || undefined,
    status: statusFilter || undefined,
  })

  const filtered = projects?.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">📁 所有项目</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          新建项目
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                typeFilter === f.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white"
        >
          {statusFilters.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索项目..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* 项目列表 */}
      <div className="space-y-4">
        {filtered?.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">暂无项目</p>
            <p className="text-sm mt-1">点击"新建项目"开始</p>
          </div>
        ) : (
          filtered?.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        )}
      </div>

      {/* 新建项目弹窗 */}
      {showForm && (
        <ProjectForm onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: 创建 ProjectForm.jsx**

```jsx
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
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">新建项目</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目名称 *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="输入项目名称"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">项目类型</label>
            <select
              value={form.project_type}
              onChange={(e) => setForm({ ...form, project_type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            >
              {projectTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="项目描述（可选）"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {createProject.isPending ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 验证项目列表页**

Run: `cd /Users/wonton1984/Documents/agent协作dashboard && npx vite --port 3000`
Expected: 导航到 /projects 看到筛选栏和"暂无项目"空状态，点击"新建项目"弹出表单

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Projects list page with filtering, search, and new project form"
```

---

### Task 7: 项目详情页

**Files:**
- Create: `src/pages/ProjectDetail.jsx`
- Create: `src/components/TaskList.jsx`

- [ ] **Step 1: 创建 TaskList.jsx**

```jsx
import { useState } from 'react'
import { useProject, useUpdateTask, useCreateTask } from '../hooks/useProjects'
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

      {/* 添加任务 */}
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
```

- [ ] **Step 2: 创建 ProjectDetail.jsx**

```jsx
import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProject, useUpdateProject } from '../hooks/useProjects'
import { useActivityLog } from '../hooks/useActivityLog'
import StatusBadge from '../components/StatusBadge'
import TaskList from '../components/TaskList'
import ActivityFeed from '../components/ActivityFeed'
import { ArrowLeft, MapPin, Edit3, Save, X } from 'lucide-react'

const typeLabels = {
  engineering: '工程', paper: '论文', research: '研究', learning: '学习', literature: '文献',
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { data: project, isLoading } = useProject(id)
  const { data: activityLog } = useActivityLog({ project_id: id }, 20)
  const updateProject = useUpdateProject()

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  }
  if (!project) {
    return <div className="text-center py-12 text-gray-400">项目不存在</div>
  }

  const startEdit = () => {
    setEditForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      priority: project.priority,
    })
    setEditing(true)
  }

  const saveEdit = async () => {
    await updateProject.mutateAsync({ id: project.id, ...editForm })
    setEditing(false)
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* 返回 */}
      <Link to="/projects" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" />
        返回项目列表
      </Link>

      {/* 标题区 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {editing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full text-xl font-bold px-3 py-2 rounded-lg border border-gray-200"
            />
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
            <div className="flex gap-2">
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
              >
                <option value="planning">计划中</option>
                <option value="in_progress">进行中</option>
                <option value="paused">暂停中</option>
                <option value="completed">已完成</option>
                <option value="abandoned">已放弃</option>
              </select>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
              >
                <option value="high">高优先级</option>
                <option value="medium">中优先级</option>
                <option value="low">低优先级</option>
              </select>
              <button onClick={saveEdit} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">
                <Save className="w-4 h-4" />
              </button>
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {typeLabels[project.project_type]}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                )}
              </div>
              <button onClick={startEdit} className="text-gray-400 hover:text-gray-600">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <StatusBadge status={project.status} />
              <span className="text-xs text-gray-400">
                优先级: {project.priority === 'high' ? '高' : project.priority === 'medium' ? '中' : '低'}
              </span>
              {project.leader_agent_type && (
                <span className="text-xs text-gray-400">
                  负责人: {project.leader_agent_type.name}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 两列布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左列：路径 + 任务 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 路径 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              存在位置
            </h3>
            {project.project_paths?.length > 0 ? (
              <div className="space-y-3">
                {project.project_paths.map((pp) => (
                  <div key={pp.id} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">{pp.agent_instance?.instance_name}</p>
                      <p className="text-gray-500 font-mono text-xs mt-0.5">{pp.local_path}</p>
                      {pp.last_synced_at && (
                        <p className="text-gray-400 text-xs mt-0.5">
                          最近同步: {new Date(pp.last_synced_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">暂无路径信息</p>
            )}
          </div>

          {/* 任务列表 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">✅ 任务列表</h3>
            <TaskList projectId={project.id} tasks={project.tasks} />
          </div>
        </div>

        {/* 右列：活动日志 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">📋 活动日志</h3>
          <ActivityFeed logs={activityLog} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add ProjectDetail page with task list, paths, and activity feed"
```

---

### Task 8: Agent 管理页

**Files:**
- Create: `src/pages/Agents.jsx`
- Create: `src/components/AgentCard.jsx`

- [ ] **Step 1: 创建 AgentCard.jsx**

```jsx
import { Bot, Monitor, Clock, FolderKanban } from 'lucide-react'

function timeAgo(dateStr) {
  if (!dateStr) return '从未上线'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

export default function AgentCard({ instance }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <Bot className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{instance.instance_name}</h3>
            <p className="text-xs text-gray-400">{instance.agent_type?.name}</p>
          </div>
        </div>
        <span className={`w-2.5 h-2.5 rounded-full ${instance.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
      </div>

      <div className="space-y-2 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5" />
          <span>{instance.platform || '未知平台'}</span>
          {instance.hostname && <span>· {instance.hostname}</span>}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeAgo(instance.last_active_at)}</span>
        </div>
        {instance.project_paths && (
          <div className="flex items-center gap-2">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>{instance.project_paths.length} 个项目</span>
          </div>
        )}
      </div>

      {/* API Key */}
      {instance.api_key && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">API Key（agent 上报用）</p>
          <code className="text-xs bg-gray-50 px-2 py-1 rounded text-gray-600 block truncate">
            {instance.api_key.substring(0, 12)}...
          </code>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 创建 Agents.jsx**

```jsx
import { useState } from 'react'
import { useAgentTypes, useAgentInstances } from '../hooks/useAgents'
import AgentCard from '../components/AgentCard'
import { Plus } from 'lucide-react'

export default function Agents() {
  const { data: agentTypes } = useAgentTypes()
  const { data: instances, isLoading } = useAgentInstances()

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">🤖 Agent 管理</h2>
      </div>

      {/* Agent 种类概览 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {agentTypes?.map((type) => (
          <div key={type.id} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <Bot className="w-8 h-8 mx-auto text-purple-500 mb-2" />
            <h3 className="font-semibold text-gray-900">{type.name}</h3>
            <p className="text-xs text-gray-400 mt-1">
              {instances?.filter(i => i.agent_type_id === type.id).length ?? 0} 个实例
            </p>
            {type.capabilities?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 justify-center">
                {type.capabilities.map((cap) => (
                  <span key={cap} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {cap}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 实例详情 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">所有实例</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {instances?.map((instance) => (
            <AgentCard key={instance.id} instance={instance} />
          ))}
          {instances?.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <p>暂无 Agent 实例</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Agents page with type overview and instance cards"
```

---

### Task 9: 活动日志页

**Files:**
- Create: `src/pages/ActivityLog.jsx`

- [ ] **Step 1: 创建 ActivityLog.jsx**

```jsx
import { useState } from 'react'
import { useActivityLog } from '../hooks/useActivityLog'
import { Link } from 'react-router-dom'
import { CalendarDays } from 'lucide-react'

const eventIcons = {
  status_change: '🔄',
  task_complete: '✅',
  note: '📝',
  manual_edit: '✏️',
  agent_report: '🤖',
}

const eventLabels = {
  status_change: '状态变更',
  task_complete: '任务完成',
  note: '备注',
  manual_edit: '手动编辑',
  agent_report: 'Agent 上报',
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return '今天'
  if (d.toDateString() === yesterday.toDateString()) return '昨天'
  return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export default function ActivityLog() {
  const [eventFilter, setEventFilter] = useState('')
  const { data: logs, isLoading } = useActivityLog({ event_type: eventFilter || undefined }, 100)

  // 按日期分组
  const grouped = {}
  logs?.forEach((log) => {
    const key = formatDate(log.created_at)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(log)
  })

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">📋 活动日志</h2>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white"
        >
          <option value="">全部类型</option>
          {Object.entries(eventLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3" />
          <p>暂无活动记录</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, dayLogs]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-500 mb-3 sticky top-0 bg-gray-50 py-2">{date}</h3>
              <div className="space-y-2">
                {dayLogs.map((log) => (
                  <div key={log.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{eventIcons[log.event_type] || '📌'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{formatTime(log.created_at)}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                            {eventLabels[log.event_type] || log.event_type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {log.agent_instance ? (
                            <span className="font-medium">{log.agent_instance.instance_name}</span>
                          ) : (
                            <span className="font-medium">你</span>
                          )}
                          {' '}{log.message}
                        </p>
                        {log.project && (
                          <Link to={`/projects/${log.project.id}`} className="text-blue-600 hover:underline text-xs mt-1 inline-block">
                            {log.project.name}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add ActivityLog page with date grouping and event type filter"
```

---

### Task 10: Agent 上报 Serverless Function

**Files:**
- Create: `netlify/functions/report-progress.js`

- [ ] **Step 1: 创建 report-progress.js**

```js
// Netlify Function：Agent 进度上报接口
// Agent 调用方式：
//   POST /.netlify/functions/report-progress
//   Headers: { "x-api-key": "<agent_instance_api_key>" }
//   Body: {
//     "project_id": "uuid",
//     "event_type": "agent_report" | "task_complete" | "status_change",
//     "message": "完成了登录页面开发",
//     "task_status"?: "todo" | "in_progress" | "done",  // 可选，更新任务状态
//     "task_title"?: "string",                          // 可选，如果有则创建或更新任务
//     "local_path"?: "string",                          // 可选，更新路径
//     "metadata"?: {}
//   }

import { createClient } from '@supabase/supabase-js'

export const handler = async (event) => {
  // CORS
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

    // 使用 Service Role Key 来验证 api_key（绕过 RLS）
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 通过 api_key 查找 agent_instance
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

    // 1. 更新 agent 在线状态
    await supabase
      .from('agent_instances')
      .update({ is_online: true, last_active_at: new Date().toISOString() })
      .eq('id', instance.id)

    // 2. 如果提供了路径，更新 project_paths
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

    // 3. 如果提供了任务信息，创建或更新任务
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

    // 4. 写入活动日志
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
```

- [ ] **Step 2: 更新 netlify.toml（确保函数目录配置正确）**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 3: 在 Netlify 上配置环境变量**

需要在 Netlify Dashboard 中设置：
- `VITE_SUPABASE_URL` — Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service_role key（用于函数内验证 api_key）

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Netlify Function for agent progress reporting"
```

---

### Task 11: 部署到 Netlify

- [ ] **Step 1: 准备 .env 示例文件（不含真实密钥）**

创建 `.env.example`：
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 2: 构建项目**

Run: `cd /Users/wonton1984/Documents/agent协作dashboard && npm run build`
Expected: 终端显示 Vite build 成功，dist/ 目录生成

- [ ] **Step 3: 推送到 GitHub**

```bash
# 如尚未创建 GitHub 仓库，先在 GitHub 上创建
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

- [ ] **Step 4: 在 Netlify 上部署**

1. 登录 Netlify Dashboard
2. 点击 "Add new site" → "Import an existing project"
3. 连接 GitHub 仓库
4. 构建设置（netlify.toml 已自动配置）：
   - Build command: `npm run build`
   - Publish directory: `dist`
5. 添加环境变量（VITE_SUPABASE_URL、VITE_SUPABASE_ANON_KEY、SUPABASE_SERVICE_ROLE_KEY）
6. 点击 "Deploy site"

- [ ] **Step 5: 验证部署**

访问 Netlify 分配的 URL（如 https://agent-dashboard-xxx.netlify.app）
Expected: dashboard 正常加载，能看到导航栏和各个页面

- [ ] **Step 6: 输出 Agent 上报使用说明**

创建 `AGENT_SETUP.md`：

```markdown
# Agent 接入指南

## 1. 获取 API Key

在 Dashboard 的 "Agent" 页面查看每个实例的 API Key。

## 2. Agent 上报进度

Agent 通过 HTTP POST 上报进度：

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/report-progress \
  -H "Content-Type: application/json" \
  -H "x-api-key: <你的实例 API Key>" \
  -d '{
    "project_id": "项目 UUID",
    "event_type": "agent_report",
    "message": "完成了登录页面开发",
    "task_title": "实现登录页面",
    "task_status": "done",
    "local_path": "/Users/wonton/Projects/xxx"
  }'
```

## 3. 支持的 event_type

| event_type | 说明 |
|---|---|
| agent_report | 普通进度报告 |
| task_complete | 任务完成 |
| status_change | 项目状态变更 |
| note | 备注/笔记 |

## 4. 在你的 Agent 工作流中集成

将上述 curl 命令嵌入到 agent 的工具调用后，作为 post-action hook。
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "docs: add AGENT_SETUP.md and deployment configuration"
```

---

### 附录：环境变量清单

| 变量名 | 用途 | 哪里设置 |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | `.env` + Netlify Dashboard |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | `.env` + Netlify Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥（上报函数用） | Netlify Dashboard 仅 |
