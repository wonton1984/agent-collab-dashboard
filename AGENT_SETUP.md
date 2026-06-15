# Agent 接入指南

本文档说明如何让你的 AI Agent（Codex、Zcode、Cloud Code、Hermes 等）向 Dashboard 上报进度。

## 1. 获取 API Key

1. 打开 Dashboard → **Agent** 页面
2. 你会看到每个 Agent 实例的列表
3. 每个实例都有一个 **API Key**（自动生成的 48 位十六进制字符串）
4. 把这个 Key 配置到你的 Agent 工作流环境中

## 2. Agent 上报 API

### 接口地址

```
POST https://wonton-agent-dashboard.netlify.app/.netlify/functions/report-progress
```

### 请求头

| Header | 值 |
|--------|------|
| `Content-Type` | `application/json` |
| `x-api-key` | 你的 Agent 实例 API Key |

### 请求体

```json
{
  "project_id": "UUID",
  "event_type": "agent_report",
  "message": "完成了登录页面开发",
  "task_title": "实现登录页面（可选）",
  "task_status": "done（可选）",
  "local_path": "/Users/wonton/Projects/xxx（可选）",
  "metadata": {}
}
```

### 支持的 event_type

| event_type | 说明 |
|---|---|
| `agent_report` | 普通进度报告 |
| `task_complete` | 任务完成 |
| `status_change` | 项目状态变更 |
| `note` | 备注/笔记 |

## 3. 快速测试

用 curl 测试上报：

```bash
curl -X POST https://wonton-agent-dashboard.netlify.app/.netlify/functions/report-progress \
  -H "Content-Type: application/json" \
  -H "x-api-key: 你的API_KEY" \
  -d '{
    "project_id": "32839098-4378-41cf-b887-767c0d99f265",
    "event_type": "agent_report",
    "message": "测试上报"
  }'
```

## 4. 在你的 Agent 工作流中集成

### 方式一：作为 post-action hook（推荐）

在每个 Agent 完成一个任务或里程碑后，自动调用上报 API，例如：

```
# 在 Codex 完成编码后自动上报
post_task_hook:
  action: http_post
  url: https://wonton-agent-dashboard.netlify.app/.netlify/functions/report-progress
  headers:
    x-api-key: ${CODEX_API_KEY}
  body:
    project_id: ${CURRENT_PROJECT_ID}
    event_type: task_complete
    message: "完成了 ${TASK_DESCRIPTION}"
    task_title: ${TASK_TITLE}
    task_status: done
    local_path: ${PROJECT_DIR}
```

### 方式二：Shell 脚本封装

```bash
#!/bin/bash
# report.sh - Agent 上报脚本
API_KEY="你的API_KEY"
URL="https://wonton-agent-dashboard.netlify.app/.netlify/functions/report-progress"

report() {
  curl -s -X POST "$URL" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "{
      \"project_id\": \"$1\",
      \"event_type\": \"$2\",
      \"message\": \"$3\",
      \"task_title\": \"$4\",
      \"task_status\": \"$5\"
    }"
}

# 用法
# report "项目UUID" "task_complete" "完成了XX功能" "XX功能" "done"
```

### 方式三：直接在 Agent 提示词中加入

在 Agent 的 system prompt 中添加：

```
当你完成一个重要任务或里程碑时，需要向 Dashboard 上报进度：
- 上报地址: https://wonton-agent-dashboard.netlify.app/.netlify/functions/report-progress
- API Key: [你的 Key]
- 请求方式: POST
- Body 包含: project_id, event_type, message

在你每次完成任务时，生成对应的 curl 命令并执行。
```

## 5. 获取项目 UUID

在 Dashboard → **项目** 页面，点击项目进入详情页，浏览器 URL 最后一段就是项目 UUID：

```
https://wonton-agent-dashboard.netlify.app/projects/32839098-4378-41cf-b887-767c0d99f265
                                            └─────────────── UUID ──────────────────┘
```

## 6. 注意事项

- API Key 关联到具体的 Agent 实例（某台机器上的某个 Agent），不同机器不同 Agent 使用不同的 Key
- 上报时如果提供了 `local_path`，系统会自动记录该 Agent 在该机器上的项目位置
- 如果提供了 `task_title`，系统会自动创建或更新任务，避免重复
- 所有上报记录会出现在 Dashboard 的 **活动日志** 中
