# Cursor 后台模式工作同步指南

## 概述
当 Cursor 在后台模式运行结束后，您需要同步工作以确保代码的一致性和避免冲突。

## 快速同步步骤

### 1. 立即检查
```bash
# 检查当前工作状态
git status
git log --oneline -5
```

### 2. 使用同步脚本
```bash
# 运行自动同步脚本
bash sync-work.sh
```

## 手动同步步骤

### 步骤 1: 保存当前工作
如果您有未提交的更改：
```bash
# 暂存所有更改
git stash push -m "Cursor 后台工作保存 - $(date)"

# 或者提交更改
git add .
git commit -m "Cursor 后台工作进度"
```

### 步骤 2: 同步远程更改
```bash
# 获取远程更新
git fetch origin

# 拉取最新代码
git pull origin main
```

### 步骤 3: 恢复工作
如果使用了 stash：
```bash
# 查看 stash 列表
git stash list

# 恢复最新的 stash
git stash pop
```

### 步骤 4: 解决冲突（如果有）
```bash
# 检查冲突文件
git status

# 手动编辑冲突文件，然后：
git add <冲突文件>
git commit -m "解决合并冲突"
```

## Cursor 特定注意事项

### 1. 检查 Cursor 配置
- 检查 `.cursor/` 目录中的配置文件
- 确保 AI 助手的设置保持一致

### 2. 工作区状态
- 检查打开的文件标签
- 验证项目设置和依赖

### 3. 代码智能功能
- 重新索引项目（如果需要）
- 检查语言服务器状态

## 常见问题解决

### 问题 1: 合并冲突
```bash
# 查看冲突详情
git diff

# 使用合并工具
git mergetool

# 或手动编辑后
git add .
git commit -m "解决冲突"
```

### 问题 2: 丢失的更改
```bash
# 查看 reflog
git reflog

# 恢复丢失的提交
git checkout <commit-hash>
git checkout -b recovery-branch
```

### 问题 3: 远程分支不同步
```bash
# 重置到远程状态
git fetch origin
git reset --hard origin/main

# 注意：这会丢失本地更改！
```

## 最佳实践

1. **定期提交**: 在后台模式运行前提交更改
2. **使用分支**: 为实验性工作创建分支
3. **备份重要工作**: 使用 `git stash` 或创建备份分支
4. **检查状态**: 始终在同步前检查 `git status`
5. **测试代码**: 同步后运行测试确保功能正常

## 自动化建议

考虑设置 Git hooks 来自动化同步过程：

```bash
# 创建 pre-commit hook
echo '#!/bin/bash
echo "正在检查代码状态..."
npm test || exit 1
' > .git/hooks/pre-commit

chmod +x .git/hooks/pre-commit
```

## 紧急恢复

如果遇到严重问题：
```bash
# 创建当前状态的备份
git branch backup-$(date +%Y%m%d-%H%M%S)

# 重置到已知的良好状态
git reset --hard origin/main
```

---

💡 **提示**: 使用 `bash sync-work.sh` 命令可以自动执行大部分同步步骤。 