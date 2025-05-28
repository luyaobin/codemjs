const fs = require('fs');
const path = require('path');

// 同步文件操作示例
class SyncFileManager {
    constructor() {
        this.workingDir = process.cwd();
    }

    // 同步读取文件
    readFileSync(filePath) {
        try {
            const fullPath = path.resolve(this.workingDir, filePath);
            const content = fs.readFileSync(fullPath, 'utf8');
            console.log(`成功读取文件: ${filePath}`);
            return content;
        } catch (error) {
            console.error(`读取文件失败: ${filePath}`, error.message);
            return null;
        }
    }

    // 同步写入文件
    writeFileSync(filePath, content) {
        try {
            const fullPath = path.resolve(this.workingDir, filePath);
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`成功写入文件: ${filePath}`);
            return true;
        } catch (error) {
            console.error(`写入文件失败: ${filePath}`, error.message);
            return false;
        }
    }

    // 同步检查文件是否存在
    existsSync(filePath) {
        const fullPath = path.resolve(this.workingDir, filePath);
        return fs.existsSync(fullPath);
    }

    // 同步创建目录
    mkdirSync(dirPath) {
        try {
            const fullPath = path.resolve(this.workingDir, dirPath);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(`成功创建目录: ${dirPath}`);
            }
            return true;
        } catch (error) {
            console.error(`创建目录失败: ${dirPath}`, error.message);
            return false;
        }
    }

    // 同步列出目录内容
    listDirSync(dirPath = '.') {
        try {
            const fullPath = path.resolve(this.workingDir, dirPath);
            const items = fs.readdirSync(fullPath);
            console.log(`目录 ${dirPath} 的内容:`, items);
            return items;
        } catch (error) {
            console.error(`读取目录失败: ${dirPath}`, error.message);
            return [];
        }
    }
}

// 同步数据处理类
class SyncDataProcessor {
    constructor() {
        this.data = [];
    }

    // 同步添加数据
    addData(item) {
        this.data.push({
            id: this.data.length + 1,
            content: item,
            timestamp: new Date().toISOString()
        });
        console.log(`添加数据: ${item}`);
    }

    // 同步查找数据
    findData(predicate) {
        const result = this.data.filter(predicate);
        console.log(`找到 ${result.length} 条匹配数据`);
        return result;
    }

    // 同步处理数据
    processData(processor) {
        this.data = this.data.map(processor);
        console.log('数据处理完成');
        return this.data;
    }

    // 同步获取所有数据
    getAllData() {
        return [...this.data];
    }
}

// 主程序入口
function main() {
    console.log('=== 同步Node.js应用启动 ===');
    
    // 初始化文件管理器
    const fileManager = new SyncFileManager();
    
    // 初始化数据处理器
    const dataProcessor = new SyncDataProcessor();
    
    // 示例：同步文件操作
    console.log('\n--- 文件操作示例 ---');
    fileManager.mkdirSync('data');
    
    // 添加一些示例数据
    dataProcessor.addData('第一条数据');
    dataProcessor.addData('第二条数据');
    dataProcessor.addData('第三条数据');
    
    // 将数据同步写入文件
    const jsonData = JSON.stringify(dataProcessor.getAllData(), null, 2);
    fileManager.writeFileSync('data/sample.json', jsonData);
    
    // 同步读取文件
    if (fileManager.existsSync('data/sample.json')) {
        const content = fileManager.readFileSync('data/sample.json');
        console.log('读取的文件内容:', content);
    }
    
    // 列出目录内容
    fileManager.listDirSync('.');
    
    console.log('\n=== 应用运行完成 ===');
}

// 如果直接运行此文件，则执行主程序
if (require.main === module) {
    main();
}

module.exports = {
    SyncFileManager,
    SyncDataProcessor,
    main
};