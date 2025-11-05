# MindFlow Dashboard React

## 📋 项目简介

这是 MindFlow 工作流平台的 **React 版本前端**，完全重写自 Vue 版本，采用 Flowise 的设计风格。

## 🎨 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **React Flow** - 流程图编辑器
- **Material-UI (MUI)** - UI 组件库
- **React Router** - 路由管理
- **Axios** - HTTP 客户端
- **STOMP.js + SockJS** - WebSocket 实时通信
- **Vite** - 构建工具

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问：http://localhost:5173

### 3. 构建生产版本

```bash
npm run build
```

## 📁 项目结构

```
mindflow-dashboard-react/
├── src/
│   ├── api/              # API 接口
│   │   ├── axios.ts      # Axios 配置
│   │   └── workflow.ts   # 工作流 API
│   ├── components/       # 组件
│   │   ├── FlowEditor.tsx      # 流程编辑器（核心组件）
│   │   └── nodes/              # 自定义节点
│   │       ├── StartNode.tsx   # 开始节点
│   │       ├── EndNode.tsx     # 结束节点
│   │       ├── HttpNode.tsx    # HTTP 节点
│   │       └── AiNode.tsx      # AI 节点
│   ├── views/            # 页面视图
│   │   ├── Login.tsx           # 登录页
│   │   ├── WorkflowList.tsx    # 工作流列表
│   │   └── WorkflowEditor.tsx  # 工作流编辑器
│   ├── services/         # 服务
│   │   └── websocket.ts  # WebSocket 服务
│   ├── theme/            # 主题配置
│   │   └── index.ts      # Flowise 风格主题
│   ├── types/            # TypeScript 类型定义
│   │   └── workflow.ts   # 工作流相关类型
│   ├── App.tsx           # 应用根组件
│   ├── main.tsx          # 入口文件
│   └── index.css         # 全局样式
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## ✨ 核心功能

### 1. 流程编辑器 (FlowEditor)

**基于 React Flow 实现，支持：**

- ✅ 拖拽创建节点
- ✅ 可视化连线
- ✅ 节点配置
- ✅ 画布缩放、平移
- ✅ 小地图导航
- ✅ 保存/加载工作流

**节点类型：**

- **开始节点** (StartNode) - 工作流入口
- **HTTP 节点** (HttpNode) - 发送 HTTP 请求
- **AI 节点** (AiNode) - 调用 AI 模型
- **结束节点** (EndNode) - 工作流出口

### 2. Flowise 风格设计

**配色方案：**

- 主色：`#2196f3` (蓝色)
- 辅助色：`#673ab7` (紫色)
- 成功色：`#00e676` (绿色)
- 错误色：`#f44336` (红色)

**设计特点：**

- 节点统一 300px 宽度
- 微妙的阴影效果
- 圆角 8px
- 平滑的过渡动画
- 连接状态可视化

### 3. 实时通信

使用 STOMP.js + SockJS 实现 WebSocket 实时推送：

- 工作流状态更新
- 节点执行状态
- 错误通知

## 🔌 API 接口

### 认证

```typescript
POST /api/auth/login
Body: { username, password }
Response: { token }
```

### 工作流定义

```typescript
GET    /api/workflows/definitions      # 获取列表
GET    /api/workflows/definitions/:id  # 获取详情
POST   /api/workflows/definitions      # 创建
PUT    /api/workflows/definitions/:id  # 更新
DELETE /api/workflows/definitions/:id  # 删除
```

### 工作流实例

```typescript
GET    /api/workflows/instances                # 获取列表
GET    /api/workflows/instances/:id            # 获取详情
POST   /api/workflows/instances                # 创建并执行
POST   /api/workflows/instances/:id/terminate  # 终止
DELETE /api/workflows/instances/:id            # 删除
```

## 🎯 使用指南

### 创建工作流

1. 点击"创建工作流"按钮
2. 填写工作流名称和描述
3. 从左侧面板拖拽节点到画布
4. 从节点右侧圆点拖动到另一个节点左侧圆点创建连线
5. 点击节点配置参数
6. 点击"保存"按钮

### 编辑工作流

1. 在工作流列表点击"编辑"图标
2. 修改节点配置或连线
3. 点击"保存"按钮

### 执行工作流

1. 在工作流列表点击"执行记录"图标
2. 查看工作流执行状态
3. 实时监控节点执行情况

## 🔄 与 Vue 版本的区别

| 特性 | Vue 版本 | React 版本 |
|------|---------|-----------|
| UI 框架 | Vue 3 | React 18 |
| 流程库 | Vue Flow | React Flow |
| UI 组件 | Element Plus | Material-UI |
| 路由 | Vue Router | React Router |
| 状态管理 | Composition API | React Hooks |
| 类型 | TypeScript (可选) | TypeScript (完整) |

## 🎨 自定义节点

创建新节点类型：

```typescript
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Typography } from '@mui/material';

const CustomNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <Box sx={{ /* 样式 */ }}>
      <Typography>{data.label}</Typography>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </Box>
  );
};

export default CustomNode;
```

在 FlowEditor 中注册：

```typescript
const nodeTypes = {
  ...
  custom: CustomNode,
};
```

## 📝 配置说明

### 环境变量

创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
```

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

## 🐛 故障排查

### 无法连接后端 API

检查 `src/api/axios.ts` 中的 `baseURL` 配置。

### WebSocket 连接失败

检查 `src/services/websocket.ts` 中的 WebSocket URL。

### 节点无法拖拽

确保 React Flow 的样式已正确导入：

```typescript
import 'reactflow/dist/style.css';
```

## 📚 参考资源

- [React Flow 文档](https://reactflow.dev/)
- [Material-UI 文档](https://mui.com/)
- [Flowise GitHub](https://github.com/FlowiseAI/Flowise)
- [React 文档](https://react.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)

## 📄 许可证

MIT

## 🙏 致谢

- UI 设计灵感来自 [Flowise](https://github.com/FlowiseAI/Flowise)
- 流程图功能基于 [React Flow](https://reactflow.dev/)

---

**开发者：** AI Assistant  
**日期：** 2025-11-05

