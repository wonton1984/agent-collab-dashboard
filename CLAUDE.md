# Claude Code — Dashboard 接入指令

当你完成重要任务或开始新项目时，向 Agent 协作 Dashboard 上报进度。

## 配置信息

读取 `~/.agent-dashboard/config` 获取你的 API Key：
```bash
grep "^CLAUDE_CODE=" ~/.agent-dashboard/config | cut -d'=' -f2
```

Dashboard API 地址：
```
https://agent-dashboard-gamma-blond.vercel.app/api/report-progress
```

## 1. 创建新项目

当你开始一个新项目时：

```bash
curl -s -X POST https://agent-dashboard-gamma-blond.vercel.app/api/report-progress \
  -H "Content-Type: application/json" \
  -H "x-api-key: $(grep "^CLAUDE_CODE=" ~/.agent-dashboard/config | cut -d'=' -f2)" \
  -d '{
    "create_project": {
      "name": "项目名称",
      "description": "项目描述",
      "project_type": "engineering|paper|research|learning|literature",
      "priority": "high|medium|low",
      "tags": ["标签1"]
    },
    "event_type": "agent_report",
    "message": "创建了项目",
    "local_path": "/当前工作目录"
  }'
```

## 2. 上报任务进度

完成一个任务后要同时传 `task_title`（不能只传 message）：

```bash
curl -s -X POST https://agent-dashboard-gamma-blond.vercel.app/api/report-progress \
  -H "Content-Type: application/json" \
  -H "x-api-key: $(grep "^CLAUDE_CODE=" ~/.agent-dashboard/config | cut -d'=' -f2)" \
  -d '{
    "project_id": "项目UUID",
    "event_type": "task_complete",
    "message": "完成了XX功能",
    "task_title": "XX功能",
    "task_status": "done",
    "local_path": "/当前工作目录"
  }'
```

- 不传 `task_title` → 只会写日志，不会创建任务
- `task_status` 可选: `todo` / `in_progress` / `done`

## 3. 修改项目信息

```bash
curl -s -X POST https://agent-dashboard-gamma-blond.vercel.app/api/report-progress \
  -H "Content-Type: application/json" \
  -H "x-api-key: $(grep "^CLAUDE_CODE=" ~/.agent-dashboard/config | cut -d'=' -f2)" \
  -d '{
    "project_id": "项目UUID",
    "update_project": {
      "name": "新名称",
      "project_type": "engineering"
    }
  }'
```

## 4. 添加协作者

```bash
curl -s -X POST https://agent-dashboard-gamma-blond.vercel.app/api/report-progress \
  -H "Content-Type: application/json" \
  -H "x-api-key: $(grep "^CLAUDE_CODE=" ~/.agent-dashboard/config | cut -d'=' -f2)" \
  -d '{
    "project_id": "项目UUID",
    "add_collaborator": {
      "agent_type_name": "Zcode",
      "role": "leader"
    }
  }'
```

## 5. 获取项目列表

```bash
curl -s https://jkqehaixnfahqrsmxrpx.supabase.co/rest/v1/projects?select=id,name,project_type,status \
  -H "apikey: sb_publishable_2Y2SqTP5CrtuOCPm6YqimA_Toj5u7Fy"
```

## 自动触发原则

以下情况**主动上报**，无需用户要求：
- 开始一个新项目时 → 创建项目
- 完成一个任务/功能后 → 上报进度 + 更新任务
- 发现项目信息有误时 → 修改项目
- 与其他 Agent 协作时 → 添加协作者
