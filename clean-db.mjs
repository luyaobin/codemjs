import { QLocalStorage } from 'qmlnode';

console.log('🧹 清理数据库...');

// 重置数据库
QLocalStorage.resetFile('user_management_db');

console.log('✅ 数据库清理完成！');