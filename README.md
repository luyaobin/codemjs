# codemjs

## Cursor 后台工作同步

当 Cursor 后台模式运行结束后，使用以下方法同步您的工作：

### 快速同步
```bash
# 运行自动同步脚本
./sync-work.sh
```

### 详细指南
查看 [CURSOR_SYNC_GUIDE.md](./CURSOR_SYNC_GUIDE.md) 获取完整的同步指南和最佳实践。

### 基本同步步骤
1. 检查当前状态：`git status`
2. 保存工作：`git stash` 或 `git commit`
3. 拉取更新：`git pull origin main`
4. 恢复工作：`git stash pop`（如果使用了 stash）
5. 解决冲突（如果有）

---

💡 **提示**: 建议在 Cursor 后台模式运行前先提交或暂存您的更改。