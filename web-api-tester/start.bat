@echo off
echo Web API 测试工具启动脚本
echo ========================
echo.

rem 检查Node.js是否已安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo 1. 启动测试API服务器...
start /b cmd /c "node test-example.js"

timeout /t 1 /nobreak >nul

echo.
echo 2. 启动Web API测试工具...
start /b cmd /c "node server.js"

timeout /t 1 /nobreak >nul

echo.
echo ========================
echo 所有服务已启动！
echo.
echo Web API测试工具: http://localhost:3000
echo 基础版: http://localhost:3000/index.html
echo 高级版: http://localhost:3000/advanced.html
echo.
echo 测试API服务器: http://localhost:3001
echo.
echo 按任意键停止所有服务
echo ========================
echo.

pause >nul

echo.
echo 正在停止服务...
taskkill /f /im node.exe >nul 2>&1
echo 服务已停止