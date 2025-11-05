# 从 Vue 迁移到 React 指南

## 概述

本文档说明如何从 Vue 版本的 MindFlow Dashboard 迁移到 React 版本。

## 主要变更

### 1. 技术栈对比

| 类别 | Vue 版本 | React 版本 |
|------|---------|-----------|
| 框架 | Vue 3 | React 18 |
| 流程图库 | @vue-flow/core | reactflow |
| UI 组件 | Element Plus | Material-UI |
| 路由 | vue-router | react-router-dom |
| HTTP | axios | axios |
| WebSocket | SockJS + STOMP | SockJS + STOMP |

### 2. 目录结构对比

**Vue 版本：**
```
mindflow-dashboard/
├── src/
│   ├── api/
│   ├── components/
│   │   ├── FlowEditor.vue
│   │   └── nodes/
│   ├── views/
│   ├── router/
│   └── main.js
```

**React 版本：**
```
mindflow-dashboard-react/
├── src/
│   ├── api/
│   ├── components/
│   │   ├── FlowEditor.tsx
│   │   └── nodes/
│   ├── views/
│   ├── services/
│   ├── theme/
│   ├── types/
│   └── main.tsx
```

### 3. 组件语法对比

#### Vue 组件 (Composition API)

```vue
<template>
  <div class="node">{{ data.label }}</div>
  <Handle type="target" :position="Position.Left" />
</template>

<script setup>
import { ref } from 'vue';
import { Handle, Position } from '@vue-flow/core';

const props = defineProps({
  data: Object
});

const label = ref(props.data.label);
</script>
```

#### React 组件

```typescript
import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const CustomNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <div className="node">
      {data.label}
      <Handle type="target" position={Position.Left} />
    </div>
  );
};

export default CustomNode;
```

### 4. API 调用对比

#### Vue 版本

```javascript
// api/index.js
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8080/api'
});

export const getWorkflows = () => api.get('/workflows/definitions');
```

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { getWorkflows } from '@/api';

const workflows = ref([]);

onMounted(async () => {
  const response = await getWorkflows();
  workflows.value = response.data;
});
</script>
```

#### React 版本

```typescript
// api/workflow.ts
import api from './axios';
import type { WorkflowDefinition } from '../types/workflow';

export const workflowDefinitionAPI = {
  getAll: () => api.get<WorkflowDefinition[]>('/workflows/definitions'),
};
```

```typescript
// Component
import React, { useState, useEffect } from 'react';
import { workflowDefinitionAPI } from '../api/workflow';

const WorkflowList: React.FC = () => {
  const [workflows, setWorkflows] = useState([]);

  useEffect(() => {
    const loadWorkflows = async () => {
      const response = await workflowDefinitionAPI.getAll();
      setWorkflows(response.data);
    };
    loadWorkflows();
  }, []);

  return <div>{/* UI */}</div>;
};
```

### 5. 路由配置对比

#### Vue Router

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/workflows', component: WorkflowList },
  { path: '/workflow/edit/:id', component: WorkflowEditor },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
```

#### React Router

```typescript
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/workflows" element={<WorkflowList />} />
      <Route path="/workflow/edit/:id" element={<WorkflowEditor />} />
    </Routes>
  </BrowserRouter>
);
```

### 6. 状态管理对比

#### Vue (Composition API)

```javascript
const count = ref(0);
const increment = () => count.value++;

// 计算属性
const doubleCount = computed(() => count.value * 2);

// 监听
watch(count, (newVal) => {
  console.log('Count changed:', newVal);
});
```

#### React (Hooks)

```typescript
const [count, setCount] = useState(0);
const increment = () => setCount(count + 1);

// useMemo (类似 computed)
const doubleCount = useMemo(() => count * 2, [count]);

// useEffect (类似 watch)
useEffect(() => {
  console.log('Count changed:', count);
}, [count]);
```

### 7. 样式处理对比

#### Vue (Scoped Styles)

```vue
<style scoped>
.node {
  padding: 10px;
  background: white;
}
</style>
```

#### React (Styled Components / MUI)

```typescript
import { styled } from '@mui/material/styles';
import { Box } from '@mui/material';

const StyledNode = styled(Box)({
  padding: '10px',
  background: 'white',
});
```

## 迁移步骤

### 1. 准备工作

```bash
# 备份 Vue 版本
cp -r mindflow-dashboard mindflow-dashboard-vue-backup

# 创建 React 项目
npm create vite@latest mindflow-dashboard-react -- --template react-ts
cd mindflow-dashboard-react
npm install
```

### 2. 安装依赖

```bash
npm install reactflow @mui/material @mui/icons-material \
  @emotion/react @emotion/styled react-router-dom \
  axios sockjs-client @stomp/stompjs
```

### 3. 迁移 API 层

1. 复制 `api/` 目录
2. 将 `.js` 改为 `.ts`
3. 添加类型定义

### 4. 迁移组件

1. 将 `.vue` 文件改为 `.tsx`
2. 转换 `<template>` 为 JSX
3. 转换 `<script setup>` 为 React 函数组件
4. 转换 Vue 响应式 API 为 React Hooks

### 5. 更新路由

1. 使用 React Router 替代 Vue Router
2. 更新路由配置
3. 更新导航链接

### 6. 更新样式

1. 使用 Material-UI 组件
2. 使用 styled components 或 sx prop
3. 保持 Flowise 风格配色

### 7. 测试

```bash
npm run dev
```

访问 http://localhost:5173

## 常见问题

### Q: React 版本的性能如何？

A: React Flow 和 Vue Flow 性能相当，都基于 Canvas 渲染。

### Q: 需要重写所有代码吗？

A: 大部分业务逻辑可以复用，主要是组件语法需要转换。

### Q: TypeScript 是必须的吗？

A: 强烈推荐，可以提供更好的类型安全和开发体验。

### Q: 如何保持两个版本同步？

A: 建议选择一个版本作为主版本，另一个作为备选或实验版本。

## 性能优化建议

### React 版本

1. **使用 useMemo 缓存计算结果**
```typescript
const filteredNodes = useMemo(() => {
  return nodes.filter(/* ... */);
}, [nodes, searchQuery]);
```

2. **使用 useCallback 缓存函数**
```typescript
const handleNodeClick = useCallback((node) => {
  setSelectedNode(node);
}, []);
```

3. **React.memo 防止不必要的重渲染**
```typescript
const MemoizedNode = React.memo(CustomNode);
```

### Vue 版本

1. **使用 computed 缓存计算结果**
```javascript
const filteredNodes = computed(() => {
  return nodes.value.filter(/* ... */);
});
```

2. **使用 markRaw 避免深层响应式**
```javascript
const nodeTypes = markRaw({ /* ... */ });
```

## 总结

React 和 Vue 版本各有优势：

**React 版本优势：**
- 更成熟的 TypeScript 支持
- 更大的生态系统
- React Flow 功能更丰富

**Vue 版本优势：**
- 更简洁的模板语法
- 更容易上手
- 更小的打包体积

根据团队熟悉度和项目需求选择合适的版本。

---

**最后更新：** 2025-11-05

