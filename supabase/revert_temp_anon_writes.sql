-- 撤回 temp_anon_writes.sql 添加的临时匿名写策略。
-- 待 Netlify 部署额度恢复、admin-project Function 上线后执行。
--
-- 使用方式：
--   1. 打开 https://supabase.com/dashboard/project/jkqehaixnfahqrsmxrpx/sql/new
--   2. 粘贴本文件全部内容，点击 Run

DROP POLICY IF EXISTS "temp_anon_projects_insert" ON projects;
DROP POLICY IF EXISTS "temp_anon_projects_update" ON projects;
DROP POLICY IF EXISTS "temp_anon_tasks_insert"    ON tasks;
DROP POLICY IF EXISTS "temp_anon_tasks_update"    ON tasks;
