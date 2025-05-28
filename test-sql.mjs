import { QLocalStorage } from 'qmlnode';

console.log('测试qmlnode SQL支持');

const db = QLocalStorage.openDatabaseSync('test_sql', '1.0', '测试SQL', 1000000);

db.transaction(tx => {
    // 创建测试表
    console.log('1. 创建表...');
    tx.executeSql('CREATE TABLE IF NOT EXISTS test_table (id INTEGER, name TEXT, active INTEGER)');
    
    // 插入数据
    console.log('2. 插入数据...');
    const insertResult = tx.executeSql('INSERT INTO test_table (id, name, active) VALUES (?, ?, ?)', [1, 'test', 1]);
    console.log('插入结果:', insertResult);
    
    // 查询数据
    console.log('3. 查询数据...');
    const selectResult = tx.executeSql('SELECT * FROM test_table');
    console.log('查询结果:', selectResult.rows.length > 0 ? selectResult.rows.item(0) : '无数据');
    
    // 尝试UPDATE
    console.log('4. 尝试UPDATE...');
    try {
        const updateResult = tx.executeSql('UPDATE test_table SET active = 0 WHERE id = 1');
        console.log('UPDATE结果:', updateResult);
        console.log('影响行数:', updateResult.rowsAffected);
    } catch (error) {
        console.log('UPDATE失败:', error.message);
    }
    
    // 再次查询验证UPDATE
    console.log('5. 验证UPDATE...');
    const selectResult2 = tx.executeSql('SELECT * FROM test_table WHERE id = 1');
    console.log('UPDATE后数据:', selectResult2.rows.length > 0 ? selectResult2.rows.item(0) : '无数据');
    
    // 尝试DELETE
    console.log('6. 尝试DELETE...');
    try {
        const deleteResult = tx.executeSql('DELETE FROM test_table WHERE id = 1');
        console.log('DELETE结果:', deleteResult);
        console.log('影响行数:', deleteResult.rowsAffected);
    } catch (error) {
        console.log('DELETE失败:', error.message);
    }
    
    // 最后查询验证DELETE
    console.log('7. 验证DELETE...');
    const selectResult3 = tx.executeSql('SELECT * FROM test_table');
    console.log('DELETE后数据:', selectResult3.rows.length > 0 ? selectResult3.rows.item(0) : '无数据');
});

// 清理测试数据库
QLocalStorage.resetFile('test_sql');