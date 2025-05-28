#!/bin/bash

# Cursor 后台工作同步脚本
echo "🔄 开始同步 Cursor 后台工作..."

# 1. 检查当前 Git 状态
echo "📊 检查 Git 状态..."
git status

# 2. 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  发现未提交的更改"
    
    # 询问用户是否要暂存更改
    read -p "是否要暂存当前更改？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "💾 暂存当前更改..."
        git stash push -m "Cursor 后台工作 - $(date '+%Y-%m-%d %H:%M:%S')"
    fi
fi

# 3. 拉取远程更新
echo "⬇️  拉取远程更新..."
git fetch origin
git pull origin main

# 4. 如果有暂存的更改，询问是否恢复
if git stash list | grep -q "Cursor 后台工作"; then
    read -p "是否要恢复暂存的更改？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 恢复暂存的更改..."
        git stash pop
        
        # 检查是否有冲突
        if git status | grep -q "both modified"; then
            echo "⚠️  发现合并冲突，请手动解决"
            git status
        fi
    fi
fi

# 5. 显示当前状态
echo "✅ 同步完成！当前状态："
git status --short
git log --oneline -5

echo "🎉 工作同步完成！" 