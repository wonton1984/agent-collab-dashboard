-- 修复：直接删除误标的 Cloud Code agent_type 及其相关实例
-- 在 Supabase SQL Editor 执行

-- 1. 先删除 Cloud Code 下的所有实例（级联删除）
DELETE FROM agent_instances
WHERE agent_type_id IN (SELECT id FROM agent_types WHERE name = 'Cloud Code');

-- 2. 删除 Cloud Code 这个 agent_type
DELETE FROM agent_types WHERE name = 'Cloud Code';

-- 验证：查看是否还有 Cloud Code
SELECT * FROM agent_types WHERE name ILIKE '%cloud%';
SELECT * FROM agent_instances WHERE instance_name ILIKE '%cloud%';
