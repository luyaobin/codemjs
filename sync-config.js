// 同步编程配置和工具类
const fs = require('fs');
const path = require('path');

// 同步配置管理器
class SyncConfig {
    constructor(configPath = 'config.json') {
        this.configPath = configPath;
        this.config = this.loadConfig();
    }

    // 同步加载配置
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const content = fs.readFileSync(this.configPath, 'utf8');
                return JSON.parse(content);
            } else {
                // 默认配置
                const defaultConfig = {
                    app: {
                        name: 'SyncNodeApp',
                        version: '1.0.0',
                        debug: true
                    },
                    paths: {
                        data: './data',
                        logs: './logs',
                        temp: './temp'
                    },
                    sync: {
                        timeout: 5000,
                        retries: 3,
                        encoding: 'utf8'
                    }
                };
                this.saveConfig(defaultConfig);
                return defaultConfig;
            }
        } catch (error) {
            console.error('加载配置失败:', error.message);
            return {};
        }
    }

    // 同步保存配置
    saveConfig(config = this.config) {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
            this.config = config;
            console.log('配置保存成功');
            return true;
        } catch (error) {
            console.error('保存配置失败:', error.message);
            return false;
        }
    }

    // 获取配置值
    get(key) {
        const keys = key.split('.');
        let value = this.config;
        for (const k of keys) {
            value = value?.[k];
        }
        return value;
    }

    // 设置配置值
    set(key, value) {
        const keys = key.split('.');
        let current = this.config;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        this.saveConfig();
    }
}

// 同步日志管理器
class SyncLogger {
    constructor(config) {
        this.config = config;
        this.logDir = config.get('paths.logs') || './logs';
        this.ensureLogDir();
    }

    // 确保日志目录存在
    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    // 同步写入日志
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            data
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);

        try {
            fs.appendFileSync(logFile, logLine, 'utf8');
            if (this.config.get('app.debug')) {
                console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
                if (data) console.log('数据:', data);
            }
        } catch (error) {
            console.error('写入日志失败:', error.message);
        }
    }

    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
    debug(message, data) { this.log('debug', message, data); }
}

// 同步工具类
class SyncUtils {
    // 同步延迟
    static sleep(ms) {
        const start = Date.now();
        while (Date.now() - start < ms) {
            // 忙等待，实现同步延迟
        }
    }

    // 同步重试机制
    static retry(fn, maxRetries = 3, delay = 1000) {
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return fn();
            } catch (error) {
                lastError = error;
                console.warn(`尝试 ${i + 1}/${maxRetries} 失败:`, error.message);
                if (i < maxRetries - 1) {
                    this.sleep(delay);
                }
            }
        }
        throw lastError;
    }

    // 同步文件复制
    static copyFileSync(src, dest) {
        try {
            const content = fs.readFileSync(src);
            fs.writeFileSync(dest, content);
            return true;
        } catch (error) {
            console.error('文件复制失败:', error.message);
            return false;
        }
    }

    // 同步目录复制
    static copyDirSync(src, dest) {
        try {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }

            const items = fs.readdirSync(src);
            for (const item of items) {
                const srcPath = path.join(src, item);
                const destPath = path.join(dest, item);
                const stat = fs.statSync(srcPath);

                if (stat.isDirectory()) {
                    this.copyDirSync(srcPath, destPath);
                } else {
                    this.copyFileSync(srcPath, destPath);
                }
            }
            return true;
        } catch (error) {
            console.error('目录复制失败:', error.message);
            return false;
        }
    }

    // 格式化文件大小
    static formatFileSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }

    // 获取文件信息
    static getFileInfo(filePath) {
        try {
            const stat = fs.statSync(filePath);
            return {
                path: filePath,
                size: stat.size,
                sizeFormatted: this.formatFileSize(stat.size),
                isFile: stat.isFile(),
                isDirectory: stat.isDirectory(),
                created: stat.birthtime,
                modified: stat.mtime,
                accessed: stat.atime
            };
        } catch (error) {
            console.error('获取文件信息失败:', error.message);
            return null;
        }
    }
}

module.exports = {
    SyncConfig,
    SyncLogger,
    SyncUtils
};