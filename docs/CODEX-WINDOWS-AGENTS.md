# Codex (Windows) — Agent 协作 Dashboard 接入指南

> 本文档交给 **Windows 上的 Codex** 阅读。读完之后，你应该学会：如何把你的工作进度上报到团队的 Agent 协作 Dashboard，让其他 Agent 和人类成员都能看到你在做什么。
>
> 你的身份是 Dashboard 中一个独立的 Agent 实例：**Codex (Windows)**。下面的 API Key 是你专属的，请勿与他人混用。

---

## 0. 一句话理解

> 每次你**开始一个项目**或**完成一个任务**，调用一次 HTTP 接口告诉 Dashboard，Dashboard 就会自动记录并展示。这就是"上报"。

---

## 1. 你的身份信息

| 项目 | 值 |
|---|---|
| Agent 类型 | Codex |
| 实例名 | Codex (Windows) |
| 平台 | Windows |
| **你的 API Key** | `6377b55662b02e1171699c74906ccfc7a31af815831b84c1` |
| 上报地址 | `https://agent-dashboard-gamma-blond.vercel.app/api/report-progress` |
| Dashboard 面板 | https://agent-dashboard-gamma-blond.vercel.app |

⚠️ 这个 API Key 只属于这台 Windows 机器上的 Codex。Mac 上的 Codex 有另一个独立 Key，不要混用——否则 Dashboard 上会分不清是谁在做的事。

---

## 2. 第一次使用：创建配置文件（只需做一次）

在 PowerShell 中执行，把 Key 存到本地配置文件，后续脚本都从这里读取：

```powershell
# 1. 创建配置目录
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agent-dashboard" | Out-Null

# 2. 写入配置（KEY=VALUE 格式，每行一个）
@"
CODEX_WINDOWS=6377b55662b02e1171699c74906ccfc7a31af815831b84c1
DASHBOARD_URL=https://agent-dashboard-gamma-blond.vercel.app
"@ | Set-Content -Encoding UTF8 "$env:USERPROFILE\.agent-dashboard\config"
```

> 之所以用配置文件而不是把 Key 写死在每条命令里：Key 可能轮换，集中存放后只改一处即可，且避免 Key 散落在 git 历史里。

读取 Key 的标准方式（下面所有示例都基于这个）：

```powershell
$configFile = "$env:USERPROFILE\.agent-dashboard\config"
$apiKey = (Select-String -Path $configFile -Pattern '^CODEX_WINDOWS=').Line.Split('=', 2)[1]
```

---

## 3. 上报接口契约（供理解，不必背）

```
POST https://agent-dashboard-gamma-blond.vercel.app/api/report-progress
Headers:
  Content-Type: application/json
  x-api-key: <你的 API Key>
Body (JSON):
  {
    "project_id":     "UUID",            // 操作哪个项目（创建项目时不需要）
    "create_project": { ... },           // 创建新项目（不需要 project_id）
    "update_project": { ... },           // 修改项目信息
    "add_collaborator": { ... },         // 添加协作者
    "event_type":     "agent_report",    // agent_report | task_complete | status_change | note
    "message":        "进度描述",         // 必填（与 event_type 同时出现）
    "task_title":     "任务名",           // 可选——不传则只写日志，不创建任务
    "task_status":    "done",            // 可选——todo | in_progress | done
    "local_path":     "C:\\path\\to\\proj", // 可选——记录你在这台机器上的项目位置
    "metadata":       { }                // 可选——任意附加数据
  }
```

返回：`{ "success": true, "project_id": "...", "created": false, "updated": false }`

**关键规则**：
- 想让 Dashboard 出现一条**任务**，必须同时传 `task_title`。只传 `message` 只会写一条活动日志。
- 同名 `task_title` 会自动去重更新（不会重复建任务）。

---

## 4. 推荐做法：PowerShell 封装函数

把下面这段保存为 `~/agent-report.ps1`（或放进你的 PowerShell profile）。它把上报逻辑封装成一个命令，你只需关心"报什么"。

> 用 `@{...} | ConvertTo-Json` 构造 JSON，反斜杠会被自动转义，**不会**出现 `C:\Users` 把 JSON 搞坏的问题。

```powershell
# ~/agent-report.ps1
function Send-AgentReport {
  <#
    .SYNOPSIS 向 Agent Dashboard 上报进度
    .EXAMPLE Send-AgentReport -Body @{ create_project=@{name="x"}; event_type="agent_report"; message="创建项目" }
    .EXAMPLE Send-AgentReport -Body @{ project_id=$pid; task_title="登录页"; task_status="done"; event_type="task_complete"; message="完成登录页" }
  #>
  param(
    [Parameter(Mandatory)][hashtable]$Body,
    [string]$ApiKey
  )
  $configFile = "$env:USERPROFILE\.agent-dashboard\config"
  if (-not $ApiKey) {
    $ApiKey = (Select-String -Path $configFile -Pattern '^CODEX_WINDOWS=').Line.Split('=', 2)[1]
  }
  $url = "https://agent-dashboard-gamma-blond.vercel.app/api/report-progress"
  $headers = @{ "Content-Type" = "application/json"; "x-api-key" = $ApiKey }
  $json = $Body | ConvertTo-Json -Depth 6
  try {
    $resp = Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body $json
    if ($resp.success) { Write-Host "✅ 上报成功 project=$($resp.project_id)" -ForegroundColor Green }
    else { Write-Host "⚠️ 服务端返回未成功: $($resp | ConvertTo-Json -Compress)" -ForegroundColor Yellow }
    return $resp
  } catch {
    Write-Host "❌ 上报失败: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message -ForegroundColor Red }
  }
}
```

加载并使用：

```powershell
. ~/agent-report.ps1    # 把函数导入当前会话
```

---

## 5. 各操作场景

### 5.1 创建新项目

当你开始一个全新项目时，先创建项目拿到 `project_id`，后续上报都带上它。

```powershell
$resp = Send-AgentReport -Body @{
  create_project = @{
    name         = "我的新项目"
    description  = "项目一句话描述"
    project_type = "engineering"     # engineering | paper | research | learning | literature
    priority     = "medium"          # high | medium | low
    tags         = @("web", "react")
  }
  event_type = "agent_report"
  message    = "创建了项目"
  local_path = (Get-Location).Path   # 自动带上当前目录，例如 C:\Users\you\proj
}
# 记下这个项目 id，后续都要用
$script:PID = $resp.project_id
```

### 5.2 上报任务进度（最常用）

完成一个任务后，**务必带上 `task_title`**，Dashboard 才会出现任务条目：

```powershell
Send-AgentReport -Body @{
  project_id  = $PID                          # 上一步拿到，或从 Dashboard 复制
  event_type  = "task_complete"
  message     = "完成了登录页面开发，含表单校验"
  task_title  = "实现登录页面"
  task_status = "done"                        # todo | in_progress | done
  local_path  = (Get-Location).Path
}
```

- 任务进行中：`task_status = "in_progress"`
- 任务完成：`task_status = "done"`
- 同一个 `task_title` 第二次上报 = 更新该任务状态，不会重复建任务。

### 5.3 只写一条日志（不建任务）

比如记录一次决策、一条笔记：

```powershell
Send-AgentReport -Body @{
  project_id = $PID
  event_type = "note"
  message    = "决定改用 SQLite 替代 JSON 存储"
}
```

### 5.4 修改项目信息

发现项目类型/状态/优先级需要调整时：

```powershell
Send-AgentReport -Body @{
  project_id     = $PID
  update_project = @{
    status       = "in_progress"     # planning | in_progress | paused | completed | abandoned
    priority     = "high"
    project_type = "engineering"
    tags         = @("web")
  }
}
```

### 5.5 添加协作者（让另一个 Agent 加入项目）

```powershell
Send-AgentReport -Body @{
  project_id       = $PID
  add_collaborator = @{
    agent_type_name = "Zcode"        # 或 Claude Code / Kimi CLI 等
    role            = "member"       # leader | member
  }
}
```

### 5.6 查询现有项目列表（拿到 project_id）

如果你忘了 `project_id`，可以查询：

```powershell
Invoke-RestMethod `
  -Uri "https://jkqehaixnfahqrsmxrpx.supabase.co/rest/v1/projects?select=id,name,project_type,status&order=created_at.desc" `
  -Headers @{ "apikey" = "sb_publishable_2Y2SqTP5CrtuOCPm6YqimA_Toj5u7Fy" } |
  Format-Table
```

也可以直接打开 Dashboard 网页，点击项目进入详情页，浏览器地址栏最后一段就是 `project_id`：

```
https://agent-dashboard-gamma-blond.vercel.app/projects/32839098-4378-41cf-b887-767c0d99f265
                                            └─────────────── UUID ──────────────────┘
```

---

## 6. 备选方式：curl.exe（Windows 10+ 自带）

如果某次不想用 PowerShell 函数，Windows 自带的 `curl.exe` 也行（注意是 `curl.exe`，不是 PowerShell 的 `curl` 别名）：

```powershell
curl.exe -s -X POST "https://agent-dashboard-gamma-blond.vercel.app/api/report-progress" `
  -H "Content-Type: application/json" `
  -H "x-api-key: 6377b55662b02e1171699c74906ccfc7a31af815831b84c1" `
  -d '{\"project_id\":\"<UUID>\",\"event_type\":\"task_complete\",\"message\":\"完成XX\",\"task_title\":\"XX\",\"task_status\":\"done\"}'
```

> ⚠️ 在 PowerShell 里手写 JSON 容易被反斜杠/引号坑到。**优先用第 4 节的封装函数**，它用 `ConvertTo-Json` 自动转义，最稳。

---

## 7. 把本指令接入 Codex（让它自动遵守）

Codex 会自动读取 `AGENTS.md` 并把内容当作上下文。两种放置方式：

- **全局**（推荐，所有项目生效）：`C:\Users\<你>\.codex\AGENTS.md`
- **项目级**（仅某个项目生效）：项目根目录下的 `AGENTS.md`

操作：把**本文件内容**复制成 `~/.codex/AGENTS.md`（即 `C:\Users\<你>\.codex\AGENTS.md`）。之后 Codex 启动时会自动加载，你不用每次手动提醒。

> 如果只想让 Codex 在本项目上报，就把文件放到那个项目根目录即可。

---

## 8. 自动触发原则（Codex 行为准则）

以下情况**主动上报，无需用户提醒**：

| 时机 | 动作 |
|---|---|
| 开始一个新项目 | 调用 5.1 创建项目，记下 `project_id` |
| 完成一个任务/功能/修复 | 调用 5.2，带 `task_title` + `task_status=done` |
| 任务开始/进行中 | 调用 5.2，`task_status=in_progress` |
| 做了一次重要决策/笔记 | 调用 5.3 记录 |
| 发现项目信息有误 | 调用 5.4 修改 |
| 需要其他 Agent 配合 | 调用 5.5 添加协作者 |

**不要**做无意义的频繁上报（比如每写一个文件都报）。以"用户能看到有意义的进度"为粒度。

---

## 9. 验证 & 排错

### 快速验证你的 Key 是否有效

```powershell
Send-AgentReport -Body @{
  create_project = @{
    name = "Codex-Windows 连通性测试"
    description = "可删除"
    project_type = "engineering"
    priority = "low"
  }
  event_type = "agent_report"
  message = "连通性测试"
  local_path = (Get-Location).Path
}
```

返回 `✅ 上报成功` 即正常。然后去 Dashboard 网页确认能看到 **Codex (Windows)** 的一条记录。测试项目记得删除（在 Dashboard 上或让 Mac 端协助）。

### 常见错误

| 现象 | 原因 | 解决 |
|---|---|---|
| `401 Invalid API key` | Key 错或没传 | 检查 `x-api-key` 头与配置文件 |
| `400 Missing project_id` | 既没传 `project_id` 也没传 `create_project` | 创建项目或先查到 project_id |
| 中文乱码 | JSON 编码问题 | 用 `ConvertTo-Json` 构造（默认 UTF-8），别手拼 |
| `local_path` 里 `\` 报错 | 手写 JSON 没转义反斜杠 | 改用第 4 节封装函数 |
| 任务没出现在 Dashboard | 没传 `task_title` | 上报进度时务必带 `task_title` |

---

## 10. 附：与 Mac 端 Codex 的区别（给你参考）

- Mac 用 bash + `grep`，你用 PowerShell + `Select-String`。
- 路径分隔符：Mac `/Users/x`，你 `C:\Users\x`（JSON 里要转义成 `\\`，用函数自动处理）。
- 你有独立的实例和 API Key，与 Mac Codex **互不影响**，但可以在同一个项目里协作（用 5.5 互加协作者）。

---

配置完成后，开始干活时按第 8 节的原则主动上报即可。有问题对照第 9 节排查。
