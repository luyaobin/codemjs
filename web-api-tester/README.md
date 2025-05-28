# Web API 测试工具

一个基于Web的API接口测试工具，可以帮助您快速测试和调试REST API接口。

## 功能特点

- 🚀 **支持多种HTTP方法**：GET、POST、PUT、DELETE、PATCH、HEAD、OPTIONS
- 📝 **灵活的请求配置**：
  - 自定义请求头
  - 多种请求体格式（JSON、Form、Text、XML）
  - 多种认证方式（Bearer Token、Basic Auth、API Key）
- 👁️ **清晰的响应展示**：
  - 状态码高亮显示
  - 响应时间统计
  - 响应头和响应体格式化展示
- 🎨 **现代化界面**：简洁美观的UI设计，操作直观

## 安装和运行

### 方法一：使用Node.js运行

1. 确保已安装Node.js（版本 >= 12.0）

2. 进入项目目录：
   ```bash
   cd web-api-tester
   ```

3. 启动服务器：
   ```bash
   node server.js
   ```

4. 在浏览器中访问：http://localhost:3000

### 方法二：直接打开HTML文件

如果只需要测试支持CORS的API，可以直接在浏览器中打开 `index.html` 文件。

## 使用说明

### 1. 基本请求

1. 在URL输入框中输入要测试的API地址
2. 选择HTTP方法（GET、POST等）
3. 点击"发送请求"按钮

### 2. 添加请求头

1. 切换到"Headers"标签页
2. 点击"+ 添加请求头"按钮
3. 输入请求头的名称和值
4. 可以添加多个请求头

### 3. 设置请求体

1. 切换到"Body"标签页
2. 选择请求体格式（JSON、Form等）
3. 在文本框中输入请求体内容

### 4. 配置认证

1. 切换到"认证"标签页
2. 选择认证类型：
   - **Bearer Token**：用于JWT等令牌认证
   - **Basic Auth**：用于基本的用户名密码认证
   - **API Key**：用于自定义的API密钥认证
3. 填写相应的认证信息

### 5. 查看响应

发送请求后，右侧会显示：
- **状态码**：成功（绿色）、重定向（蓝色）、错误（红色）
- **响应时间**：请求的耗时
- **响应头**：服务器返回的所有响应头
- **响应体**：格式化后的响应内容

## 示例

### 测试GET请求

```
URL: https://jsonplaceholder.typicode.com/posts/1
方法: GET
```

### 测试POST请求

```
URL: https://jsonplaceholder.typicode.com/posts
方法: POST
请求体（JSON）:
{
  "title": "测试标题",
  "body": "测试内容",
  "userId": 1
}
```

### 使用Bearer Token认证

```
URL: https://api.example.com/protected
方法: GET
认证类型: Bearer Token
Token: your-jwt-token-here
```

## 注意事项

1. **CORS限制**：如果测试的API不支持CORS，可能会遇到跨域问题。建议：
   - 使用支持CORS的API进行测试
   - 在开发环境中配置API服务器允许跨域
   - 使用浏览器插件临时禁用CORS（仅用于开发测试）

2. **HTTPS请求**：如果从HTTP页面请求HTTPS API，可能会被浏览器阻止（混合内容）。

3. **大文件上传**：目前不支持文件上传功能，如需测试文件上传API，建议使用其他工具。

## 技术栈

- 纯HTML/CSS/JavaScript实现，无需额外依赖
- Node.js用于托管静态文件服务器
- 使用Fetch API进行HTTP请求

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！