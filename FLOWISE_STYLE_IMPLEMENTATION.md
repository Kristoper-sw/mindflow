# Flowise 风格实现说明

## 概述

本次更新将 MindFlow 工作流编排界面升级为 Flowise 风格，提升了整体用户体验和视觉设计。

## 主要改进

### 1. 配色方案 (Flowise Colors)

采用 Flowise 的官方配色方案：

- **主色 (Primary)**: `#2196f3` (蓝色) - 用于开始节点、主要操作
- **辅助色 (Secondary)**: `#673ab7` (紫色) - 用于 HTTP 节点
- **成功色 (Success)**: `#00e676` (绿色) - 用于 AI 节点、成功状态
- **错误色 (Error)**: `#f44336` (红色) - 用于结束节点、错误状态
- **灰色系**: `#fafafa` ~ `#212121` - 用于背景、文字、边框

### 2. 节点面板 (Node Panel) - 左侧

**改进点：**
- ✅ 添加搜索框，支持实时搜索节点
- ✅ 使用 Accordion 折叠面板分类显示节点
- ✅ 节点按类别组织：基础、AI、工具
- ✅ 每个类别显示节点数量徽章
- ✅ 卡片式节点设计，hover 效果更细腻
- ✅ 更简洁的配色和间距

**新增功能：**
```vue
<!-- 搜索框 -->
<el-input v-model="searchQuery" placeholder="搜索节点..." clearable />

<!-- 分类折叠面板 -->
<el-collapse v-model="activeCategories" accordion>
  <el-collapse-item v-for="category in nodeCategories">
    <!-- 节点列表 -->
  </el-collapse-item>
</el-collapse>
```

### 3. 节点组件样式 (Node Components)

**统一设计规范：**

#### 普通节点 (HttpNode, AiNode)
- 固定宽度：300px
- 圆角：8px
- 边框：1px solid (节点颜色的淡色版本)
- 阴影：微妙的 box-shadow
- Hover 效果：边框变深，阴影增强
- 选中状态：2px 同色边框外边框

#### 特殊节点 (StartNode, EndNode)
- 圆角胶囊样式：border-radius 24px
- 纯色背景（主色/错误色）
- 白色文字
- 更小巧的尺寸

#### 连接点 (Handles)
- 尺寸：10px × 10px
- 白色背景 + 2px 彩色边框
- Hover 时放大到 12px × 12px
- 添加光晕效果

### 4. 画布区域 (Canvas Area)

**改进点：**
- ✅ 工具栏更简洁，按钮分组更清晰
- ✅ 背景色使用 Flowise 灰色 (#fafafa)
- ✅ Vue Flow 控件样式优化
- ✅ 连接线颜色调整为灰色系
- ✅ 连接状态颜色：
  - 连接中/不可连接：红色 (#f44336)
  - 可连接：绿色 (#00e676)

**样式优化：**
```css
/* 画布背景 */
.vue-flow-container {
  background: #fafafa;
}

/* 连接线 */
:deep(.vue-flow__edge-path) {
  stroke: #9e9e9e;
  stroke-width: 2px;
}

/* 控件 */
:deep(.vue-flow__controls) {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  border: 1px solid #eeeeee;
}
```

### 5. 配置面板 (Config Panel) - 右侧

**改进点：**
- ✅ 宽度调整为 350px
- ✅ 卡片式指南设计
- ✅ 更清晰的层级和间距
- ✅ 表单控件优化

### 6. Element Plus 组件样式覆盖

**Collapse 组件：**
```css
:deep(.el-collapse-item__header) {
  padding: 0 16px;
  height: 48px;
  background: white;
  border-bottom: 1px solid #eeeeee;
}
```

## 技术实现细节

### 1. 响应式节点分类

使用 `computed` 实现动态节点分类和搜索：

```javascript
const nodeCategories = computed(() => {
  const categories = [
    { name: '基础', icon: '⚙️', nodes: [] },
    { name: 'AI', icon: '🤖', nodes: [] },
    { name: '工具', icon: '🔧', nodes: [] }
  ]
  
  const query = searchQuery.value.toLowerCase()
  
  nodeTypes.forEach(node => {
    if (!query || node.label.toLowerCase().includes(query) || 
        node.description.toLowerCase().includes(query)) {
      const category = categories.find(c => c.name === node.category)
      if (category) {
        category.nodes.push(node)
      }
    }
  })
  
  return categories.filter(c => c.nodes.length > 0)
})
```

### 2. CSS 变量定义

使用 CSS 变量统一管理颜色：

```css
:root {
  --flowise-primary: #2196f3;
  --flowise-primary-light: #e3f2fd;
  --flowise-secondary: #673ab7;
  --flowise-success: #00e676;
  --flowise-error: #f44336;
  /* ... 更多颜色定义 */
}
```

### 3. 节点样式一致性

所有节点遵循相同的设计模式：

```vue
<template>
  <div class="flowise-node [node-type]-node">
    <div class="node-icon-wrapper">
      <div class="node-icon">🌐</div>
    </div>
    <div class="node-content">
      <div class="node-header">
        <span class="node-title">节点标题</span>
        <span class="node-badge">徽章</span>
      </div>
      <div class="node-body">
        <div class="node-description">描述文字</div>
      </div>
    </div>
    <Handle type="target" :position="Position.Left" />
    <Handle type="source" :position="Position.Right" />
  </div>
</template>
```

## 视觉对比

### 更新前
- ❌ 节点渐变色背景
- ❌ 较大的圆角和阴影
- ❌ 节点列表简单罗列
- ❌ 较粗的连接线
- ❌ 不统一的尺寸

### 更新后
- ✅ Flowise 风格纯色系
- ✅ 微妙的阴影和圆角
- ✅ 分类折叠面板
- ✅ 细腻的连接线
- ✅ 统一的 300px 宽度

## 浏览器兼容性

- ✅ Chrome / Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

## 文件清单

### 修改的文件
1. `mindflow-dashboard/src/components/FlowEditor.vue` - 主编辑器组件
2. `mindflow-dashboard/src/components/nodes/HttpNode.vue` - HTTP 节点
3. `mindflow-dashboard/src/components/nodes/AiNode.vue` - AI 节点
4. `mindflow-dashboard/src/components/nodes/StartNode.vue` - 开始节点
5. `mindflow-dashboard/src/components/nodes/EndNode.vue` - 结束节点

### 新增功能
- 节点搜索功能
- 节点分类展示
- Flowise 配色方案
- 优化的连接状态样式

## 下一步优化建议

1. **性能优化**
   - 添加节点虚拟滚动
   - 优化大型工作流渲染

2. **功能增强**
   - 添加节点拖拽预览
   - 支持节点收藏功能
   - 添加最近使用节点列表

3. **视觉优化**
   - 添加暗黑模式支持
   - 自定义主题色
   - 节点动画效果

4. **用户体验**
   - 快捷键支持
   - 撤销/重做功能
   - 节点模板保存

## 参考资源

- Flowise GitHub: https://github.com/FlowiseAI/Flowise
- Material Design Colors
- Vue Flow Documentation

## 作者

AI Assistant - 2025年11月5日

---

**注意**：本文档描述了基于 Flowise 开源项目 (Apache License 2.0) 的 UI 设计实现。

