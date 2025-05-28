import { QLocalStorage } from 'qmlnode';
import fs from 'fs';
import path from 'path';

console.log('🧹 清理数据库...');

try {
    // 删除数据库文件
    const dbPath = path.join('data', 'user_management_db.json');
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('✅ 数据库文件已删除');
    } else {
        console.log('ℹ️ 数据库文件不存在');
    }

    // 删除配置文件
    const configPath = path.join('data', 'user_api_config.ini');
    if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
        console.log('✅ 配置文件已删除');
    } else {
        console.log('ℹ️ 配置文件不存在');
    }

    // 清理日志目录
    const logsDir = 'logs';
    if (fs.existsSync(logsDir)) {
        const logFiles = fs.readdirSync(logsDir);
        for (const file of logFiles) {
            if (file.endsWith('.log')) {
                fs.unlinkSync(path.join(logsDir, file));
                console.log(`✅ 日志文件 ${file} 已删除`);
            }
        }
    }

    console.log('✅ 数据库清理完成！');
} catch (error) {
    console.error('❌ 清理过程中发生错误:', error.message);
}