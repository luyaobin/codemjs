# codemjs - 同步编程风格的Node.js开发环境

这是一个专为同步编程风格设计的Node.js开发环境，特别适合需要使用同步JavaScript的设备和应用场景。

## 特性

- 🔄 **完全同步的编程模式** - 所有操作都采用同步方式
- 📁 **同步文件操作** - 提供完整的同步文件管理功能
- 📊 **同步数据处理** - 内置数据处理和管理工具
- 🔧 **配置管理** - 灵活的配置系统
- 📝 **日志系统** - 完整的同步日志记录
- 🛠️ **实用工具** - 重试机制、文件复制等实用功能

## 项目结构

```
codemjs/
├── index.js           # 主入口文件，包含核心同步类
├── sync-config.js     # 同步配置和工具类
├── example-app.js     # 示例应用
├── package.json       # 项目配置
└── README.md         # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 运行基本示例

```bash
npm start
```

### 3. 运行完整示例应用

```bash
npm run example
```

### 4. 运行所有测试

```bash
npm test
```

## 核心类说明

### SyncFileManager

同步文件管理器，提供所有文件操作的同步版本：

```javascript
const { SyncFileManager } = require('./index');
const fileManager = new SyncFileManager();

// 同步读取文件
const content = fileManager.readFileSync('data.txt');

// 同步写入文件
fileManager.writeFileSync('output.txt', 'Hello World');

// 检查文件是否存在
if (fileManager.existsSync('config.json')) {
    // 文件存在
}

// 创建目录
fileManager.mkdirSync('new-directory');

// 列出目录内容
const files = fileManager.listDirSync('.');
```

### SyncDataProcessor

同步数据处理器，用于数据的同步处理和管理：

```javascript
const { SyncDataProcessor } = require('./index');
const processor = new SyncDataProcessor();

// 添加数据
processor.addData({ name: '张三', age: 25 });

// 查找数据
const results = processor.findData(item => item.content.age > 20);

// 处理数据
processor.processData(item => ({
    ...item,
    processed: true
}));

// 获取所有数据
const allData = processor.getAllData();
```

### SyncConfig

配置管理器，用于应用配置的同步管理：

```javascript
const { SyncConfig } = require('./sync-config');
const config = new SyncConfig();

// 获取配置值
const appName = config.get('app.name');

// 设置配置值
config.set('app.debug', true);
```

### SyncLogger

同步日志系统：

```javascript
const { SyncLogger } = require('./sync-config');
const logger = new SyncLogger(config);

// 记录不同级别的日志
logger.info('应用启动');
logger.warn('警告信息');
logger.error('错误信息');
logger.debug('调试信息');
```

### SyncUtils

实用工具类：

```javascript
const { SyncUtils } = require('./sync-config');

// 同步延迟
SyncUtils.sleep(1000); // 延迟1秒

// 重试机制
const result = SyncUtils.retry(() => {
    // 可能失败的操作
    return riskyOperation();
}, 3, 1000); // 最多重试3次，每次间隔1秒

// 文件复制
SyncUtils.copyFileSync('source.txt', 'destination.txt');

// 目录复制
SyncUtils.copyDirSync('source-dir', 'dest-dir');

// 获取文件信息
const fileInfo = SyncUtils.getFileInfo('myfile.txt');
```

## 使用示例

### 基本文件操作

```javascript
const { SyncFileManager } = require('./index');
const fileManager = new SyncFileManager();

// 创建目录结构
fileManager.mkdirSync('data');
fileManager.mkdirSync('logs');

// 写入配置文件
const config = {
    app: 'MyApp',
    version: '1.0.0'
};
fileManager.writeFileSync('data/config.json', JSON.stringify(config, null, 2));

// 读取并解析配置
const configContent = fileManager.readFileSync('data/config.json');
const parsedConfig = JSON.parse(configContent);
console.log('应用名称:', parsedConfig.app);
```

### 数据处理流程

```javascript
const { SyncDataProcessor } = require('./index');
const processor = new SyncDataProcessor();

// 批量添加数据
const users = [
    { name: '张三', age: 25, city: '北京' },
    { name: '李四', age: 30, city: '上海' }
];

users.forEach(user => processor.addData(user));

// 数据筛选和处理
const youngUsers = processor.findData(item => item.content.age < 30);
processor.processData(item => ({
    ...item,
    category: item.content.age < 30 ? 'young' : 'adult'
}));

console.log('处理完成，共', processor.getAllData().length, '条记录');
```

## 配置说明

应用会自动创建 `config.json` 配置文件，包含以下默认配置：

```json
{
  "app": {
    "name": "SyncNodeApp",
    "version": "1.0.0",
    "debug": true
  },
  "paths": {
    "data": "./data",
    "logs": "./logs",
    "temp": "./temp"
  },
  "sync": {
    "timeout": 5000,
    "retries": 3,
    "encoding": "utf8"
  }
}
```

## 注意事项

1. **性能考虑**: 同步操作会阻塞事件循环，适合处理小到中等规模的数据
2. **错误处理**: 所有同步操作都包含适当的错误处理和日志记录
3. **文件编码**: 默认使用UTF-8编码处理文本文件
4. **目录创建**: 支持递归创建目录结构

## 与QML集成

本项目包含 `qmlnode` 依赖，可以与QML应用无缝集成：

```javascript
// 在QML应用中使用同步Node.js功能
const { SyncFileManager } = require('./index');
const fileManager = new SyncFileManager();

// QML可以直接调用同步方法，无需处理异步回调
const data = fileManager.readFileSync('app-data.json');
```

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。