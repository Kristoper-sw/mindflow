# 可视化编辑器更新说明

## 🎉 主要修复

### 1. 修复模式切换数据丢失问题

**问题**：在可视化模式和 JSON 模式之间切换时，数据会丢失。

**解决方案**：
- 改进了 `watch` 逻辑，添加了延迟等待确保组件加载完成
- 添加了详细的控制台日志便于调试
- 改进了 `importConfig` 方法，更可靠地清空和加载数据

**测试方法**：
1. 在可视化模式添加节点和连线
2. 切换到 JSON 模式（应该能看到 JSON 配置）
3. 切换回可视化模式（节点和连线应该都在）
4. 反复切换多次验证

### 2. 添加连线创建指南

**问题**：用户不知道如何创建 Edge（连线）。

**解决方案**：

#### 📍 顶部工具栏提示
添加了明显的提示信息：
```
💡 提示：拖拽节点到画布，然后从节点右侧圆点拖动到另一个节点左侧圆点创建连线
```

#### 📍 右侧使用指南
当没有选中节点时，右侧面板显示详细的使用指南：

**快速开始**
1. 从左侧拖拽节点到画布
2. **创建连线：** 从节点右侧的 ⚫ 圆点拖动到另一个节点左侧的 ⚫ 圆点
3. 点击节点配置参数
4. 保存工作流

**提示**
- 点击"✨ 添加示例"查看完整示例
- 使用鼠标滚轮缩放画布
- 拖动空白区域移动画布

#### 📍 一键添加示例工作流
新增"✨ 添加示例"按钮，点击后会自动创建一个完整的工作流，包括：
- 开始节点
- HTTP 请求节点
- AI 处理节点
- 结束节点
- 以及它们之间的连线

用户可以直接看到连线的效果，并且可以基于示例进行修改。

## 🔧 技术改进

### 1. 改进的 `importConfig` 方法

```javascript
// 清空现有数据
const currentNodes = getNodes.value
const currentEdges = getEdges.value
if (currentNodes.length > 0) {
  removeNodes(currentNodes.map(n => n.id))
}
if (currentEdges.length > 0) {
  removeEdges(currentEdges.map(e => e.id))
}

// 导入节点
if (config.nodes && config.nodes.length > 0) {
  const nodes = config.nodes.map(node => ({
    id: node.id,
    type: node.type,
    position: { x: node.x || 0, y: node.y || 0 },
    data: {
      label: node.name || node.id,
      config: node.config || getDefaultConfig(node.type)
    }
  }))
  addNodes(nodes)
}

// 导入边
if (config.edges && config.edges.length > 0) {
  const edges = config.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'default'
  }))
  addEdges(edges)
}
```

### 2. 改进的模式切换逻辑

```javascript
watch(useVisualEditor, (newVal, oldVal) => {
  if (newVal) {
    // 切换到可视化模式 - 等待组件挂载
    setTimeout(() => {
      if (flowEditorRef.value) {
        const config = JSON.parse(configJson.value)
        flowEditorRef.value.importConfig(config)
      }
    }, 100)
  } else {
    // 切换到 JSON 模式 - 立即导出
    if (flowEditorRef.value) {
      const config = flowEditorRef.value.exportConfig()
      configJson.value = JSON.stringify(config, null, 2)
    }
  }
})
```

## 📸 使用截图示例

### 创建连线的步骤：

1. **拖拽节点到画布**
   - 从左侧节点面板拖拽"HTTP 请求"到画布

2. **再拖拽一个节点**
   - 从左侧节点面板拖拽"AI 处理"到画布

3. **创建连线**
   - 鼠标悬停在第一个节点右侧
   - 会看到一个 ⚫ 圆点（句柄）
   - 点击并按住这个圆点
   - 拖动到第二个节点左侧的 ⚫ 圆点
   - 释放鼠标
   - ✅ 连线创建成功！

### 或者使用示例工作流：

1. 点击顶部工具栏的"✨ 添加示例"按钮
2. 系统会自动创建一个完整的示例工作流
3. 你会看到 4 个节点和 3 条连线
4. 可以直接修改这个示例，或清空后重新创建

## ✅ 验证清单

- [x] 可视化模式可以正常添加节点
- [x] 可以通过拖拽创建连线
- [x] 点击节点可以配置参数
- [x] 切换到 JSON 模式能看到正确的配置
- [x] 切换回可视化模式数据不丢失
- [x] 示例工作流可以正常加载
- [x] 保存工作流正常

## 🐛 已知问题

暂无

## 🚀 下一步计划

- [ ] 添加撤销/重做功能
- [ ] 支持节点复制/粘贴
- [ ] 支持条件分支节点
- [ ] 支持循环节点
- [ ] 添加节点搜索功能
- [ ] 支持节点分组
- [ ] 添加快捷键支持

## 💬 反馈

如果遇到任何问题或有建议，请创建 Issue。

