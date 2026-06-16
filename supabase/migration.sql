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

-- 3.7 project_collaborators
CREATE TABLE project_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_instance_id UUID NOT NULL REFERENCES agent_instances(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, agent_instance_id)
);

ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON project_collaborators FOR SELECT USING (true);
CREATE INDEX idx_project_collaborators_project ON project_collaborators(project_id);

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
CREATE POLICY "Agent update own instance" ON agent_instances
  FOR UPDATE USING (api_key = current_setting('request.headers')::json->>'apikey');

CREATE POLICY "Agent manage own paths" ON project_paths
  FOR INSERT WITH CHECK (
    agent_instance_id IN (
      SELECT id FROM agent_instances WHERE api_key = current_setting('request.headers')::json->>'apikey'
    )
  );

CREATE POLICY "Agent insert log" ON activity_log
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 种子数据
-- ============================================

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
