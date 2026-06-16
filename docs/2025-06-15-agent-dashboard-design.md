# Agent 协作 Dashboard — 设计文档

> 创建日期: 2025-06-15
> 状态: 待审核

## 1. 项目概述

一个集中管理多 AI agent（Codex、Zcode、Claude Code、Hermes Agent 等）及其项目的 Web 仪表盘，支持查看项目进度、agent 协作情况和跨设备项目路径管理。

## 2. 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| **前端框架** | React + Vite | 组件化、生态成熟 |
| **UI 组件库** | Ant Design 或 shadcn/ui | 移动端适配好 |
| **图表** | Recharts | 响应式图表 |
| **数据请求** | TanStack Query (React Query) | 缓存 + 自动刷新 |
| **后端/托管** | Netlify (前端) + Netlify Functions (可选 API) |
| **数据库** | Supabase (PostgreSQL) | 云数据库，免费版 500MB，自带 REST API |
| **实时更新** | Supabase Realtime | Agent 上报后仪表盘自动刷新 |

## 3. 数据模型

### 3.1 `agent_types` — Agent 种类定义

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT NOT NULL UNIQUE | 如 "Codex"、"Zcode"、"Hermes" |
| `description` | TEXT | |
| `capabilities` | TEXT[] | 擅长领域，如 `["frontend","engineering"]` 或 `["paper-writing","research"]` |
| `icon` | TEXT | 图标名称或 URL |
| `created_at` | TIMESTAMPTZ | |

### 3.2 `agent_instances` — 每个实际安装的 agent

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | UUID PK | |
| `agent_type_id` | UUID FK → agent_types | 关联 agent 种类 |
| `instance_name` | TEXT NOT NULL | 用户自定义别名，如 "Codex（MacBook Pro）" |
| `hostname` | TEXT | 机器名 |
| `platform` | TEXT | macOS / Windows / Linux |
| `local_base_path` | TEXT | 该机器上默认工作目录根路径 |
| `api_key` | TEXT UNIQUE | 每个实例独立密钥，用于上报认证 |
| `is_online` | BOOLEAN DEFAULT false | 在线状态 |
| `last_active_at` | TIMESTAMPTZ | 最近活跃时间 |
| `created_at` | TIMESTAMPTZ | |

### 3.3 `projects` — 项目

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT NOT NULL | 项目名称 |
| `description` | TEXT | 项目描述 |
| `project_type` | TEXT NOT NULL | `engineering` / `paper` / `research` / `learning` / `literature` |
| `status` | TEXT NOT NULL DEFAULT 'planning' | `planning` / `in_progress` / `paused` / `completed` / `abandoned` |
| `priority` | TEXT DEFAULT 'medium' | `high` / `medium` / `low` |
| `leader_agent_type_id` | UUID FK → agent_types | 负责的 agent 种类（可空） |
| `tags` | TEXT[] | 标签 |
| `metadata` | JSONB | 类型专属信息：论文类→投稿目标、字数；工程类→部署状态等 |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### 3.4 `project_paths` — 项目在各机器上的实际路径

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | UUID PK | |
| `project_id` | UUID FK → projects (CASCADE) | |
| `agent_instance_id` | UUID FK → agent_instances | 哪台机器上的哪个 agent |
| `local_path` | TEXT NOT NULL | 实际路径，如 `/Users/wonton/...` |
| `remote_url` | TEXT | 可选，Git 远程仓库地址 |
| `last_synced_at` | TIMESTAMPTZ | 最近同步时间 |
| `created_at` | TIMESTAMPTZ | |

### 3.5 `tasks` — 任务/里程碑

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | UUID PK | |
| `project_id` | UUID FK → projects (CASCADE) | |
| `title` | TEXT NOT NULL | 任务标题 |
| `description` | TEXT | 详细描述 |
| `status` | TEXT NOT NULL DEFAULT 'todo' | `todo` / `in_progress` / `review` / `done` |
| `assignee_agent_instance_id` | UUID FK → agent_instances（可空） | |
| `parent_task_id` | UUID FK → tasks（可空） | 子任务嵌套 |
| `sort_order` | INTEGER DEFAULT 0 | |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

### 3.6 `activity_log` — 操作日志

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | UUID PK | |
| `project_id` | UUID FK → projects | |
| `agent_instance_id` | UUID FK → agent_instances（可空，null 表示手动操作） | |
| `event_type` | TEXT | `status_change` / `task_complete` / `note` / `manual_edit` / `agent_report` |
| `message` | TEXT | 日志内容 |
| `metadata` | JSONB | 额外数据 |
| `created_at` | TIMESTAMPTZ | |

### 3.7 关系概览

```
agent_types  ──1:N──→  agent_instances  ──1:N──→  project_paths
                           │                          │
                           │                          │ (via project_paths.project_id)
                           ↓                          ↓
                       tasks                      projects
                           │                          │
                           └────────┬─────────────────┘
                                    ↓
                              activity_log
```

## 4. 数据流

### Agent 上报流程

```
Agent（任何机器）
  │
  │  HTTP POST /rest/v1/rpc/report_progress
  │  Headers: apikey: <instance_api_key>
  │  Body: { project_slug, status, task_title, message, local_path, ... }
  │
  ▼
Supabase REST API（含 RLS 策略）
  │
  ├─ 验证 api_key → 确定 agent_instance
  ├─ 写入 activity_log
  ├─ 更新 project.status（如需要）
  ├─ 更新 project_paths.last_synced_at（如提供路径）
  └─ 更新 agent_instances.last_active_at & is_online
```

### 手动编辑流程

```
用户浏览器
  │
  │  通过 Dashboard 网页操作
  │  编辑项目、任务、状态等
  │
  ▼
Netlify Functions (或直接 Supabase API)
  │
  ├─ 写入 activity_log (event_type = 'manual_edit')
  └─ 更新对应表
```

## 5. 页面设计

### 5.1 概览页（Dashboard Home）

- 统计卡片：总项目数、进行中、暂停、Agent 种类数
- 项目类型分布图（饼图或环形图）
- 近期活动列表（最近 5-10 条）
- Agent 活跃度排行（按负责项目数）
- 响应式：手机上卡片堆叠，精简显示

### 5.2 项目列表页

- 筛选栏：按类型（全部/工程/论文/研究/学习）和状态（全部/进行中/暂停/已完成）
- 项目卡片列表：名称、类型、状态、路径（按机器分组）、协作 agent、进度条、任务完成数
- 搜索功能
- 新建项目按钮

### 5.3 项目详情页

- 基本信息卡片：类型、状态、优先级、负责人
- 类型专属信息（论文类→字数、投稿目标；工程类→分支、部署状态等）
- 多机路径列表：哪个 agent 实例、什么路径、最近同步时间
- 任务列表：可勾选状态、分配 agent、嵌套子任务
- 活动日志：时间线形式展示

### 5.4 Agent 管理页

- Agent 种类卡片概览（Codex、Zcode、Hermes...）
- 展开查看每个种类的实例列表（每台机器上的安装）
- 每个实例：在线状态、最近活跃时间、负责项目列表
- 添加/编辑实例（api_key 管理等）

### 5.5 活动日志页

- 全量日志查看
- 按日期分组
- 过滤：按 agent、按项目、按事件类型
- 时间范围选择

### 5.6 移动端适配

- 底部 Tab 导航替代侧边栏
- 卡片列表单列展示
- 关键操作（新建、编辑）固定在底部或浮动按钮
- 表格数据转为卡片/列表视图

## 6. 安全设计

- **Agent 上报**：每个 agent_instance 持有独立 `api_key`，通过 Supabase RLS 策略限制：
  - 只能向自己的 `project_paths` 写入
  - 只能更新关联自己实例的项目和任务
  - 无法读取其他实例的 api_key
- **Web 前端**：使用 Supabase anon key + RLS，管理员权限通过 Supabase dashboard 管理
- 未来可扩展：OAuth 登录（Google/GitHub）

## 7. 未来可扩展（不在 MVP 范围内）

- Agent 之间的消息/通知
- 甘特图/时间线视图
- 数据导出（CSV/Markdown）
- 与 Notion/GitHub 同步
- Agent 任务自动分配建议

## 8. 非功能性需求

- 响应式：支持手机、平板、桌面
- 实时性：agent 上报后 1s 内 dashboard 更新
- 离线提示：agent 超过 24 小时未上报标记为离线
