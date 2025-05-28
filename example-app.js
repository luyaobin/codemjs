// 同步编程示例应用
const { SyncFileManager, SyncDataProcessor } = require('./index');
const { SyncConfig, SyncLogger, SyncUtils } = require('./sync-config');

// 示例应用类
class ExampleSyncApp {
    constructor() {
        // 初始化配置
        this.config = new SyncConfig();
        
        // 初始化日志
        this.logger = new SyncLogger(this.config);
        
        // 初始化文件管理器
        this.fileManager = new SyncFileManager();
        
        // 初始化数据处理器
        this.dataProcessor = new SyncDataProcessor();
        
        this.logger.info('应用初始化完成');
    }

    // 初始化应用目录结构
    initializeDirectories() {
        this.logger.info('初始化目录结构');
        
        const directories = [
            this.config.get('paths.data'),
            this.config.get('paths.logs'),
            this.config.get('paths.temp')
        ];

        for (const dir of directories) {
            if (this.fileManager.mkdirSync(dir)) {
                this.logger.info(`创建目录: ${dir}`);
            }
        }
    }

    // 处理用户数据
    processUserData() {
        this.logger.info('开始处理用户数据');

        // 模拟用户数据
        const users = [
            { name: '张三', age: 25, city: '北京' },
            { name: '李四', age: 30, city: '上海' },
            { name: '王五', age: 28, city: '广州' },
            { name: '赵六', age: 35, city: '深圳' }
        ];

        // 同步处理每个用户
        for (const user of users) {
            this.dataProcessor.addData(user);
            this.logger.debug('添加用户数据', user);
        }

        // 查找特定条件的用户
        const youngUsers = this.dataProcessor.findData(item => item.content.age < 30);
        this.logger.info(`找到年龄小于30的用户: ${youngUsers.length}人`);

        // 处理数据 - 添加处理时间戳
        this.dataProcessor.processData(item => ({
            ...item,
            processed: true,
            processedAt: new Date().toISOString()
        }));

        return this.dataProcessor.getAllData();
    }

    // 生成报告
    generateReport(data) {
        this.logger.info('生成数据报告');

        const report = {
            generatedAt: new Date().toISOString(),
            totalRecords: data.length,
            summary: {
                averageAge: data.reduce((sum, item) => sum + item.content.age, 0) / data.length,
                cities: [...new Set(data.map(item => item.content.city))],
                processedCount: data.filter(item => item.processed).length
            },
            details: data
        };

        // 保存报告到文件
        const reportPath = `${this.config.get('paths.data')}/report.json`;
        const reportContent = JSON.stringify(report, null, 2);
        
        if (this.fileManager.writeFileSync(reportPath, reportContent)) {
            this.logger.info(`报告已保存到: ${reportPath}`);
        }

        return report;
    }

    // 备份数据
    backupData() {
        this.logger.info('开始数据备份');

        const dataDir = this.config.get('paths.data');
        const backupDir = `${this.config.get('paths.temp')}/backup_${Date.now()}`;

        if (SyncUtils.copyDirSync(dataDir, backupDir)) {
            this.logger.info(`数据备份完成: ${backupDir}`);
            return backupDir;
        } else {
            this.logger.error('数据备份失败');
            return null;
        }
    }

    // 清理临时文件
    cleanup() {
        this.logger.info('清理临时文件');

        const tempDir = this.config.get('paths.temp');
        if (this.fileManager.existsSync(tempDir)) {
            const items = this.fileManager.listDirSync(tempDir);
            this.logger.info(`临时目录包含 ${items.length} 个项目`);
        }
    }

    // 运行应用
    run() {
        try {
            this.logger.info('=== 同步应用开始运行 ===');

            // 1. 初始化目录
            this.initializeDirectories();

            // 2. 处理数据
            const processedData = this.processUserData();

            // 3. 生成报告
            const report = this.generateReport(processedData);

            // 4. 备份数据
            const backupPath = this.backupData();

            // 5. 显示结果
            console.log('\n=== 处理结果 ===');
            console.log(`处理了 ${report.totalRecords} 条记录`);
            console.log(`平均年龄: ${report.summary.averageAge.toFixed(1)} 岁`);
            console.log(`涉及城市: ${report.summary.cities.join(', ')}`);
            if (backupPath) {
                console.log(`备份路径: ${backupPath}`);
            }

            // 6. 清理
            this.cleanup();

            this.logger.info('=== 同步应用运行完成 ===');
            return true;

        } catch (error) {
            this.logger.error('应用运行出错', error);
            return false;
        }
    }

    // 演示重试机制
    demonstrateRetry() {
        this.logger.info('演示重试机制');

        let attempt = 0;
        const unreliableOperation = () => {
            attempt++;
            if (attempt < 3) {
                throw new Error(`模拟失败 (尝试 ${attempt})`);
            }
            return `成功 (第 ${attempt} 次尝试)`;
        };

        try {
            const result = SyncUtils.retry(unreliableOperation, 5, 500);
            this.logger.info('重试成功', { result, totalAttempts: attempt });
        } catch (error) {
            this.logger.error('重试失败', error);
        }
    }

    // 演示文件操作
    demonstrateFileOperations() {
        this.logger.info('演示文件操作');

        const testFile = `${this.config.get('paths.temp')}/test.txt`;
        const testContent = '这是一个测试文件\n包含多行内容\n用于演示同步文件操作';

        // 写入文件
        if (this.fileManager.writeFileSync(testFile, testContent)) {
            // 获取文件信息
            const fileInfo = SyncUtils.getFileInfo(testFile);
            if (fileInfo) {
                this.logger.info('文件信息', fileInfo);
            }

            // 读取文件
            const content = this.fileManager.readFileSync(testFile);
            this.logger.info('文件内容读取成功', { length: content.length });
        }
    }
}

// 主程序入口
function main() {
    const app = new ExampleSyncApp();
    
    // 运行主应用
    app.run();
    
    // 演示其他功能
    app.demonstrateRetry();
    app.demonstrateFileOperations();
}

// 如果直接运行此文件，则执行主程序
if (require.main === module) {
    main();
}

module.exports = ExampleSyncApp;