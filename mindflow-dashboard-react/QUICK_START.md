# 🚀 快速开始 - MindFlow React 版本

## 📋 项目已创建完成！

你的 React 版本 MindFlow Dashboard 已经成功创建，参考了 Flowise 的前端实现。

## 🎯 项目位置

```
D:\Code\mindflow\mindflow-dashboard-react\
```

## ⚡ 立即启动

### 方式 1：命令行启动

```bash
cd D:\Code\mindflow\mindflow-dashboard-react
npm run dev
```

### 方式 2：已在后台运行

项目已经在后台启动，访问：

**🌐 http://localhost:5173**

### 默认登录凭证

- 用户名：`admin`
- 密码：`admin123`

## 📁 项目结构概览

```
mindflow-dashboard-react/
├── src/
│   ├── components/
│   │   ├── FlowEditor.tsx       ✅ 核心流程编辑器
│   │   └── nodes/               ✅ 4 种自定义节点
│   ├── views/
│   │   ├── Login.tsx            ✅ 登录页
│   │   ├── WorkflowList.tsx     ✅ 工作流列表
│   │   └── WorkflowEditor.tsx   ✅ 工作流编辑器
│   ├── api/                     ✅ API 接口
│   ├── services/                ✅ WebSocket 服务
│   ├── theme/                   ✅ Flowise 风格主题
│   └── types/                   ✅ TypeScript 类型
├── README.md                    📖 完整文档
├── MIGRATION_GUIDE.md           📖 迁移指南
└── PROJECT_SUMMARY.md           📖 项目总结
```

## 🎨 核心功能

### 1. 流程编辑器

- ✅ 拖拽节点到画布
- ✅ 可视化连线
- ✅ 实时配置节点参数
- ✅ 画布缩放、平移
- ✅ 小地图导航
- ✅ 搜索节点

### 2. 节点类型

| 节点 | 图标 | 颜色 | 功能 |
|------|------|------|------|
| StartNode | ▶️ | 蓝色 | 工作流入口 |
| HttpNode | 🌐 | 紫色 | HTTP 请求 |
| AiNode | 🤖 | 绿色 | AI 处理 |
| EndNode | ⏹️ | 红色 | 工作流出口 |

### 3. Flowise 风格设计

**配色方案：**
- Primary: `#2196f3` (蓝色)
- Secondary: `#673ab7` (紫色)
- Success: `#00e676` (绿色)
- Error: `#f44336` (红色)

**设计特点：**
- 节点统一 300px 宽度
- 圆角 8px，微妙阴影
- 平滑过渡动画
- 分类折叠面板

## 🎮 使用示例

### 创建第一个工作流

1. **登录系统**
   - 访问 http://localhost:5173/login
   - 使用 `admin` / `admin123` 登录

2. **创建工作流**
   - 点击"创建工作流"按钮
   - 输入名称和描述

3. **拖拽节点**
   - 从左侧面板拖拽"开始节点"到画布
   - 拖拽"HTTP 节点"到画布
   - 拖拽"AI 节点"到画布
   - 拖拽"结束节点"到画布

4. **创建连线**
   - 从"开始节点"右侧圆点拖动到"HTTP 节点"左侧圆点
   - 继续连接后续节点

5. **配置节点**
   - 点击"HTTP 节点"
   - 在右侧面板配置 URL 和请求方法
   - 点击"AI 节点"
   - 配置 AI 模型和提示词

6. **保存工作流**
   - 点击右上角"保存"按钮

## 🔧 技术栈

```json
{
  "前端框架": "React 18",
  "类型系统": "TypeScript",
  "流程图库": "React Flow 11",
  "UI 组件": "Material-UI 7",
  "路由": "React Router 7",
  "构建工具": "Vite",
  "HTTP 客户端": "Axios",
  "WebSocket": "STOMP.js + SockJS"
}
```

## 🌐 API 集成

### 后端要求

确保你的 Java 后端服务运行在：

```
http://localhost:8080
```

### API 端点

```typescript
// 认证
POST /api/auth/login

// 工作流定义
GET    /api/workflows/definitions
POST   /api/workflows/definitions
PUT    /api/workflows/definitions/:id
DELETE /api/workflows/definitions/:id

// 工作流实例
POST   /api/workflows/instances
GET    /api/workflows/instances/:id
POST   /api/workflows/instances/:id/terminate

// WebSocket
ws://localhost:8080/ws
```

### 修改 API 地址

编辑 `src/api/axios.ts`：

```typescript
const api = axios.create({
  baseURL: 'http://YOUR_API_URL/api',  // 修改这里
  timeout: 10000,
});
```

## 📸 界面预览

### 1. 登录页
```
http://localhost:5173/login
```
- 简洁的登录表单
- Material-UI 设计

### 2. 工作流列表
```
http://localhost:5173/workflows
```
- 表格展示所有工作流
- 操作按钮：编辑、删除、执行

### 3. 流程编辑器
```
http://localhost:5173/workflow/create
```
- 左侧：节点面板 + 搜索
- 中间：React Flow 画布
- 右侧：配置面板

## 🐛 常见问题

### Q1: 无法连接后端 API

**解决方法：**
1. 确保 Java 后端在运行
2. 检查 `src/api/axios.ts` 的 `baseURL`
3. 检查 CORS 配置

### Q2: WebSocket 连接失败

**解决方法：**
1. 确保后端 WebSocket 端点正常
2. 检查 `src/services/websocket.ts` 的 URL

### Q3: 节点无法拖拽

**解决方法：**
1. 确保 React Flow 样式已导入
2. 检查浏览器控制台错误
3. 清除浏览器缓存

### Q4: TypeScript 错误

**解决方法：**
```bash
npm install @types/node @types/react @types/react-dom --save-dev
```

## 📚 学习资源

### 官方文档
- React: https://react.dev/
- React Flow: https://reactflow.dev/
- Material-UI: https://mui.com/
- TypeScript: https://www.typescriptlang.org/

### 示例代码
- React Flow Examples: https://reactflow.dev/examples
- MUI Templates: https://mui.com/material-ui/getting-started/templates/

### 参考项目
- Flowise: https://github.com/FlowiseAI/Flowise

## 🎯 下一步

### 基础任务

1. **启动项目** ✅ (已完成)
   ```bash
   npm run dev
   ```

2. **登录系统**
   - 访问 http://localhost:5173
   - 使用默认账号登录

3. **创建工作流**
   - 测试拖拽节点
   - 测试连线功能
   - 测试保存功能

### 进阶任务

1. **连接真实后端**
   - 启动 Java 后端服务
   - 测试 API 调用
   - 测试 WebSocket 推送

2. **自定义主题**
   - 修改 `src/theme/index.ts`
   - 调整配色方案

3. **添加新节点类型**
   - 创建新的节点组件
   - 在 FlowEditor 中注册
   - 添加配置面板

## 🚀 生产部署

### 构建

```bash
npm run build
```

输出目录：`dist/`

### 部署选项

1. **Vercel** (推荐)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   - 拖拽 `dist/` 文件夹到 Netlify

3. **Docker**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 5173
   CMD ["npm", "run", "preview"]
   ```

## 📊 项目统计

- **总文件数**: ~17 个核心文件
- **代码行数**: ~2,600 行
- **组件数**: 8 个
- **页面数**: 3 个
- **节点类型**: 4 种

## ✨ 特色功能

1. **完整的 TypeScript 支持** - 类型安全
2. **Flowise 风格设计** - 现代化 UI
3. **React Flow 集成** - 强大的流程图功能
4. **Material-UI 组件** - 丰富的 UI 库
5. **实时 WebSocket** - 状态实时更新
6. **模块化架构** - 易于扩展

## 🎉 完成！

你现在拥有一个完整的、基于 React 的工作流编辑器！

### 立即体验

1. 打开浏览器访问：**http://localhost:5173**
2. 使用 `admin` / `admin123` 登录
3. 创建你的第一个工作流！

### 需要帮助？

查看以下文档：
- 📖 [README.md](./README.md) - 完整文档
- 📖 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - 从 Vue 迁移指南
- 📖 [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 项目总结

---

**项目创建时间：** 2025-11-05  
**项目状态：** ✅ 完成并可用  
**技术支持：** AI Assistant

