# Agent 接入指南

本文档说明如何让你的 AI Agent（Codex、Zcode、Claude Code、Kimi CLI 等）向 Dashboard 上报进度。

## 1. 获取 API Key

1. 打开 Dashboard → **Agent** 页面
2. 你会看到每个 Agent 实例的列表
3. 每个实例都有一个 **API Key**（自动生成的 48 位十六进制字符串）
4. 把这个 Key 配置到你的 Agent 工作流环境中

## 2. Agent 上报 API

### 接口地址

```
POST https://agent-dashboard-gamma-blond.vercel.app/api/report-progress
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
curl -X POST https://agent-dashboard-gamma-blond.vercel.app/api/report-progress \
  -H "Content-Type: application/json" \
  -H "x-api-key: 你的API_KEY" \
  -d '{
    "project_id": "32839098-4378-41cf-b887-767c0d99f265",
    "event_type": "agent_report",
    "message": "测试上报"
  }'
```

## 4. 各 Agent 集成方式

### 4.1 Zcode（推荐：Skill 方式）

Zcode 支持 `/skill-name` 命令调用 Skill。已创建 `agent-report` Skill：

```bash
# 手动触发
/agent-report

# 或在完成任务后自动触发
```

Skill 文件位置：`~/.agents/skills/agent-report/SKILL.md`

### 4.2 Codex（AGENTS.md 方式）

Codex 支持 `AGENTS.md` 文件自动注入上下文：

1. 创建 `~/.codex/AGENTS.md`（全局）或项目根目录的 `AGENTS.md`
2. 文件中包含 Dashboard 接入指令
3. Codex 会自动读取并在完成任务时上报

#### 4.2.1 Windows 上的 Codex

Windows 是独立 Agent 实例（与 Mac 的 Codex 互不共用 Key），有专门的接入文档：

📖 **完整指南**：[`docs/CODEX-WINDOWS-AGENTS.md`](./docs/CODEX-WINDOWS-AGENTS.md)

要点：
- **实例名**：`Codex (Windows)`，专属 API Key 见文档
- **配置文件**：`%USERPROFILE%\.agent-dashboard\config`（变量名 `CODEX_WINDOWS`）
- **用 PowerShell**：Mac 文档里的 `grep`/bash 语法在 Windows 不适用，需用 `Select-String` + `ConvertTo-Json`（后者自动转义反斜杠，避免 `C:\Users` 破坏 JSON）
- **AGENTS.md 位置**：全局 `C:\Users\<你>\.codex\AGENTS.md`，或项目根目录

Mac 上的 Codex（实例 `Codex（MacBook Pro）`）仍用 bash + `grep` 方式，Key 见 `~/.agent-dashboard/config` 中的 `CODEX=`。

### 4.3 Claude Code（CLAUDE.md 方式）

Claude Code 支持 `CLAUDE.md` 文件自动注入上下文：

1. **全局配置**：创建 `~/.claude/CLAUDE.md`（影响所有项目）
2. **项目级配置**：在每个项目根目录创建 `CLAUDE.md`
3. Claude Code 启动时会自动加载并遵循其中的指令

示例 `CLAUDE.md` 内容：

```markdown
# Claude Code — Dashboard 接入指令

当你完成重要任务时，向 Dashboard 上报进度。

API Key 位置：`~/.agent-dashboard/config` 中的 `CLAUDE_CODE=...`
上报地址：`https://agent-dashboard-gamma-blond.vercel.app/api/report-progress`

## 创建新项目

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

## 上报任务进度

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

**重要**：必须传 `task_title` 才能创建任务！
```

### 4.4 Claude Code / Kimi CLI

这些 Agent 如果没有自动注入机制，可以通过以下方式：

**方式 A：Shell 脚本封装**

```bash
#!/bin/bash
# report.sh
API_KEY=$(grep "^CLAUDE_CODE=" ~/.agent-dashboard/config | cut -d'=' -f2)
URL="https://agent-dashboard-gamma-blond.vercel.app/api/report-progress"

curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "$1"
```

**方式 B：在提示词中明确要求**

在每次对话开始时手动粘贴上报指令，或配置默认系统提示。

## 5. 获取项目 UUID

在 Dashboard → **项目** 页面，点击项目进入详情页，浏览器 URL 最后一段就是项目 UUID：

```
https://agent-dashboard-gamma-blond.vercel.app/projects/32839098-4378-41cf-b887-767c0d99f265
                                            └─────────────── UUID ──────────────────┘
```

## 6. 注意事项

- API Key 关联到具体的 Agent 实例（某台机器上的某个 Agent），不同机器不同 Agent 使用不同的 Key
  - 例：Codex 在 Mac 和 Windows 是两个独立实例，各自有独立 Key，不要混用
- 上报时如果提供了 `local_path`，系统会自动记录该 Agent 在该机器上的项目位置
- 如果提供了 `task_title`，系统会自动创建或更新任务，避免重复
- 所有上报记录会出现在 Dashboard 的 **活动日志** 中
- **Claude Code 的 `CLAUDE.md` 机制**：与 Codex 的 `AGENTS.md` 类似，但 Claude Code 会自动发现项目目录中的 `CLAUDE.md` 文件并注入上下文，无需额外配置
