#!/bin/bash
# Agent Dashboard 上报脚本
# 用法: ./agent-report.sh <project_id> <event_type> <message> [task_title] [task_status] [local_path]

API_KEY="${AGENT_API_KEY:-}"
URL="https://agent-dashboard-gamma-blond.vercel.app/api/report-progress"

if [ -z "$API_KEY" ]; then
  echo "❌ 请设置 AGENT_API_KEY 环境变量"
  echo "    export AGENT_API_KEY=你的API_KEY"
  exit 1
fi

if [ "$#" -lt 3 ]; then
  echo "用法: $0 <project_id> <event_type> <message> [task_title] [task_status] [local_path]"
  echo ""
  echo "参数说明:"
  echo "  project_id   - 项目 UUID"
  echo "  event_type   - agent_report | task_complete | status_change | note"
  echo "  message      - 进度描述"
  echo "  task_title   - 任务标题（可选）"
  echo "  task_status  - todo | in_progress | done（可选）"
  echo "  local_path   - 本地路径（可选）"
  exit 1
fi

PROJECT_ID="$1"
EVENT_TYPE="$2"
MESSAGE="$3"
TASK_TITLE="${4:-}"
TASK_STATUS="${5:-}"
LOCAL_PATH="${6:-}"

# 构建 JSON body
JSON=$(cat <<JSONEOF
{
  "project_id": "$PROJECT_ID",
  "event_type": "$EVENT_TYPE",
  "message": "$MESSAGE"
JSONEOF
)

[ -n "$TASK_TITLE" ] && JSON="$JSON,"$'\n'"  \"task_title\": \"$TASK_TITLE\""
[ -n "$TASK_STATUS" ] && JSON="$JSON,"$'\n'"  \"task_status\": \"$TASK_STATUS\""
[ -n "$LOCAL_PATH" ] && JSON="$JSON,"$'\n'"  \"local_path\": \"$LOCAL_PATH\""
JSON="$JSON"$'\n'"}"
JSON=$(echo "$JSON" | python3 -c "import sys,json; print(json.loads(sys.stdin.read()))" 2>/dev/null || echo "$JSON")

echo "📤 上报进度..."
echo "   项目: $PROJECT_ID"
echo "   事件: $EVENT_TYPE"
echo "   消息: $MESSAGE"

RESPONSE=$(curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "$JSON")

echo "📥 响应: $RESPONSE"

if echo "$RESPONSE" | grep -q '"success": true'; then
  echo "✅ 上报成功"
else
  echo "❌ 上报失败"
  exit 1
fi
