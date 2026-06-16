# Agent 协作 Dashboard

多 AI Agent 协作管理面板，支持 Codex、Zcode、Claude Code 等 Agent 自动上报项目进度。

## 功能

- 📊 **Dashboard** — 项目统计、Agent 在线状态、最近活动
- 📁 **项目管理** — 创建/编辑项目、设置优先级、标记状态
- 🤖 **Agent 管理** — 查看各 Agent 实例、API Key 管理
- 📝 **任务追踪** — 自动从 Agent 上报创建任务
- 📜 **活动日志** — 查看所有 Agent 的操作记录

## 技术栈

- React 18 + Vite + Tailwind CSS
- Supabase (PostgreSQL + REST API)
- Netlify Functions (Node.js)
- TanStack Query (数据获取)

## 快速开始

```bash
npm install
npm run dev
```

## Agent 接入

支持多种 Agent 自动上报进度：

| Agent | 方式 | 配置 |
|-------|------|------|
| Zcode | Skill | `/agent-report` |
| Codex | AGENTS.md | `~/.codex/AGENTS.md` |
| Claude Code | CLAUDE.md | `~/.claude/CLAUDE.md` |

详细接入文档：[AGENT_SETUP.md](./AGENT_SETUP.md)

## 部署

```bash
npm run build
# 部署到 Netlify
```

## 数据库

Schema 和种子数据：[supabase/migration.sql](./supabase/migration.sql)
