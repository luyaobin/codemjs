#!/bin/bash

# 用户管理API的简单curl测试脚本（不依赖jq）
# 使用方法: bash curl-test-simple.sh

API_BASE="http://localhost:3000"
SESSION_TOKEN=""

echo "🚀 用户管理API curl测试脚本（简化版）"
echo "================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印分隔线
print_separator() {
    echo -e "${BLUE}================================================${NC}"
}

# 打印测试标题
print_test() {
    echo -e "\n${YELLOW}$1${NC}"
    print_separator
}

# 生成随机用户名
RANDOM_ID=$(date +%s)
ADMIN_USERNAME="curlAdmin$RANDOM_ID"
USER_USERNAME="curlUser$RANDOM_ID"

# 检查服务器状态
print_test "💚 健康检查"
curl -s -X GET "$API_BASE/health"
echo ""

# 获取API文档标题
print_test "📖 获取API文档"
curl -s -X GET "$API_BASE/api/docs" | grep -o '"title":"[^"]*"' | head -1
echo ""

# 用户注册
print_test "📝 用户注册 - 管理员"
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/api/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'$ADMIN_USERNAME'",
    "email": "curl'$RANDOM_ID'@example.com",
    "password": "curl123456",
    "userRole": "admin",
    "profileData": {
      "nickname": "Curl管理员",
      "department": "测试部门"
    }
  }')
echo "$REGISTER_RESPONSE"
echo ""

# 用户登录
print_test "🔐 用户登录"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'$ADMIN_USERNAME'",
    "password": "curl123456",
    "ipAddress": "127.0.0.1",
    "userAgent": "curl/7.68.0"
  }')
echo "$LOGIN_RESPONSE"
echo ""

# 提取会话令牌（简单方式）
SESSION_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"sessionToken":"[^"]*"' | cut -d'"' -f4)
if [ -n "$SESSION_TOKEN" ]; then
    echo -e "${GREEN}✅ 会话令牌获取成功: $SESSION_TOKEN${NC}"
else
    echo -e "${RED}❌ 会话令牌获取失败${NC}"
    exit 1
fi

# 验证会话
print_test "🔍 验证会话"
curl -s -X GET "$API_BASE/api/session" \
  -H "X-Session-Token: $SESSION_TOKEN"
echo ""

# 注册普通用户
print_test "📝 用户注册 - 普通用户"
curl -s -X POST "$API_BASE/api/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "'$USER_USERNAME'",
    "email": "curluser'$RANDOM_ID'@example.com",
    "password": "user123456",
    "profileData": {
      "nickname": "Curl用户",
      "age": 30
    }
  }'
echo ""

# 更新用户信息
print_test "✏️ 更新用户信息"
curl -s -X PUT "$API_BASE/api/users/1" \
  -H "Content-Type: application/json" \
  -H "X-Session-Token: $SESSION_TOKEN" \
  -d '{
    "email": "updated-curl'$RANDOM_ID'@example.com",
    "profileData": {
      "nickname": "更新的Curl管理员",
      "department": "测试部门",
      "phone": "13800138000",
      "lastUpdated": "'$(date -Iseconds)'"
    }
  }'
echo ""

# 获取用户列表
print_test "📋 获取用户列表"
curl -s -X GET "$API_BASE/api/users?page=1&pageSize=10" \
  -H "X-Session-Token: $SESSION_TOKEN"
echo ""

# 获取操作日志
print_test "📊 获取操作日志"
curl -s -X GET "$API_BASE/api/logs?page=1&pageSize=5" \
  -H "X-Session-Token: $SESSION_TOKEN"
echo ""

# 删除用户（删除第二个用户）
print_test "🗑️ 删除用户"
curl -s -X DELETE "$API_BASE/api/users/2" \
  -H "X-Session-Token: $SESSION_TOKEN"
echo ""

# 用户登出
print_test "🚪 用户登出"
curl -s -X POST "$API_BASE/api/logout" \
  -H "X-Session-Token: $SESSION_TOKEN"
echo ""

# 登出后验证会话（应该失败）
print_test "🔍 登出后验证会话（应该失败）"
curl -s -X GET "$API_BASE/api/session" \
  -H "X-Session-Token: $SESSION_TOKEN"
echo ""

print_separator
echo -e "${GREEN}✅ curl测试完成！${NC}"
echo ""
echo "💡 提示："
echo "  - 确保服务器正在运行: npm run web"
echo "  - 如果需要格式化JSON输出，请安装jq: sudo apt install jq"
echo "  - 可以使用 -v 参数查看详细的HTTP请求信息"
echo ""