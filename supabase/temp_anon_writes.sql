-- 临时方案：因为 Netlify 部署额度锁定，admin-project Function 上不了线。
-- 这里直接给 projects / tasks 表开匿名写权限，让旧前端的"修改保存""新建项目"
-- "勾选任务"立刻能用。
--
-- 安全提醒：dashboard 没登录、URL 公开 → 任何拿到 URL 的人都能改这两张表。
-- 仅作为临时手段，额度恢复后请运行 revert_temp_anon_writes.sql 撤掉。
--
-- 使用方式：
--   1. 打开 https://supabase.com/dashboard/project/jkqehaixnfahqrsmxrpx/sql/new
--   2. 粘贴本文件全部内容，点击 Run
--   3. 应当看到 "Success. No rows returned"

CREATE POLICY "temp_anon_projects_insert" ON projects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "temp_anon_projects_update" ON projects
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "temp_anon_tasks_insert" ON tasks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "temp_anon_tasks_update" ON tasks
  FOR UPDATE USING (true) WITH CHECK (true);
