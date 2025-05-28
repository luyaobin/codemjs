#!/bin/bash

echo "Web API 测试工具启动脚本"
echo "========================"
echo ""

# 检查Node.js是否已安装
if ! command -v node &> /dev/null; then
    echo "错误：未找到Node.js，请先安装Node.js"
    exit 1
fi

echo "1. 启动测试API服务器..."
node test-example.js &
API_PID=$!

sleep 1

echo ""
echo "2. 启动Web API测试工具..."
node server.js &
WEB_PID=$!

sleep 1

echo ""
echo "========================"
echo "所有服务已启动！"
echo ""
echo "Web API测试工具: http://localhost:3000"
echo "基础版: http://localhost:3000/index.html"
echo "高级版: http://localhost:3000/advanced.html"
echo ""
echo "测试API服务器: http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "========================"

# 等待用户按下Ctrl+C
trap "echo ''; echo '正在停止服务...'; kill $API_PID $WEB_PID 2>/dev/null; exit" INT

# 保持脚本运行
wait