# MindFlow 分布式 AI 工作流平台

MindFlow 是一个基于 Java + Spring Boot 的分布式 AI 工作流平台，采用微服务架构和事件驱动设计，支持实时状态推送。

## 项目结构

```
mindflow/
├── mindflow-common/              # 通用模块（DTO、实体、工具类）
├── mindflow-plugin/              # 插件模块（SPI 机制和任务执行器）
├── mindflow-orchestrator/        # 任务编排与调度中心（独立微服务）
├── mindflow-worker/              # 任务执行节点（独立微服务）
├── mindflow-api/                 # REST API 接口（独立微服务）
└── mindflow-dashboard-react/     # React 前端项目 (Flowise 风格)
```

## 核心功能

### ✅ 工作流管理
- **可视化工作流设计器**：拖拽式创建工作流
- 创建、编辑、删除工作流定义
- 支持可视化模式和 JSON 模式切换
- 支持多种节点类型（AI、HTTP、Start、End）
- 节点配置面板实时编辑参数
- 自动布局、画布缩放、小地图导航

### ✅ 实时执行监控
- **WebSocket 实时推送**状态更新（不使用轮询）
- 查看工作流执行进度
- 查看每个节点的执行状态和输出

### ✅ 实例管理
- **终止运行中的工作流**
- **删除已完成的工作流实例**
- 节点失败时自动标记工作流为失败

### ✅ 可视化监控
- Kafka UI 实时监控消息队列
- 查看主题、消费者组、消息内容

## 🎨 可视化工作流设计器

### 🆕 Flowise 风格界面 (2025.11.05)

**全新设计**：采用 [Flowise](https://github.com/FlowiseAI/Flowise) 的现代化 UI 风格！

**主要改进**：
- 🎨 **Flowise 配色方案**：主色 #2196f3（蓝色）、辅助色 #673ab7（紫色）
- 🔍 **节点搜索**：实时搜索节点，快速找到所需组件
- 📁 **分类折叠面板**：节点按类别（基础、AI、工具）组织展示
- 💎 **精致节点设计**：统一 300px 宽度，微妙阴影，Flowise 风格配色
- 🎯 **连接状态可视化**：
  - ✅ 可连接：绿色 (#00e676)
  - ❌ 不可连接：红色 (#f44336)
- 🎭 **优化的控件样式**：更清爽的 Vue Flow 控制按钮和小地图

详细更新内容请查看：[Flowise 风格实现说明](FLOWISE_STYLE_IMPLEMENTATION.md)

### 特性
- **拖拽式创建节点**：从左侧面板拖拽节点到画布
- **可视化连线**：鼠标拖拽创建节点之间的连接
- **实时配置**：点击节点即可在右侧面板编辑参数
- **工具栏功能**：
  - 🔍 画布缩放和平移
  - 📐 适应视图
  - 🗑️ 清空画布
  - 🎨 自动布局
  - ✨ 添加示例工作流
- **小地图导航**：快速定位和浏览大型工作流
- **模式切换**：可视化编辑 ↔️ JSON 编辑无缝切换

### 支持的节点类型
- ▶️ **开始节点**：工作流入口
- 🌐 **HTTP 节点**：发送 HTTP 请求（GET/POST/PUT/DELETE）
- 🤖 **AI 节点**：调用 OpenAI GPT 模型
- ⏹️ **结束节点**：工作流出口

详细使用指南请查看：[工作流实例管理指南](mindflow-dashboard-react/WORKFLOW_INSTANCES_GUIDE.md)

## 技术栈

- **后端**: Spring Boot 3.2.0, JPA, Kafka, Redis, MySQL, WebSocket
- **前端**: React 18, React Flow, Material-UI, React Router, Axios
- **认证**: JWT
- **消息队列**: Apache Kafka 7.4.0
- **数据库**: MySQL 8.0, Redis 7

## 快速开始

### 1. 启动基础设施

```bash
docker-compose up -d
```

这将启动：
- MySQL (端口 3306)
- Redis (端口 6379)
- Zookeeper (端口 2181)
- Kafka (端口 9092/9093)
- **Kafka UI** (端口 8090) - http://localhost:8090

### 2. 初始化数据库

```bash
mysql -u root -p < init.sql
```

### 3. 编译项目

```bash
mvn clean install
```

### 4. 启动微服务（按顺序）

**终端 1 - 启动 API 服务**
```bash
cd mindflow-api
mvn spring-boot:run
```

**终端 2 - 启动 Orchestrator 服务**
```bash
cd mindflow-orchestrator
mvn spring-boot:run
```

**终端 3 - 启动 Worker 服务**
```bash
cd mindflow-worker
mvn spring-boot:run
```

### 5. 启动前端

**终端 4 - 启动前端 (React)**
```bash
cd mindflow-dashboard-react
npm install
npm run dev
```

前端访问地址：http://localhost:5173

**默认登录账号：**
- 用户名：`admin`
- 密码：`admin123`

## API 接口

### 认证

**POST** `/api/auth/login` - 登录
```json
{
  "username": "admin",
  "password": "admin123"
}
```

### 工作流定义

- **POST** `/api/workflows/definitions` - 创建工作流定义
- **GET** `/api/workflows/definitions` - 获取所有工作流定义
- **GET** `/api/workflows/definitions/{id}` - 获取工作流定义详情
- **PUT** `/api/workflows/definitions/{id}` - 更新工作流定义

### 工作流实例

- **POST** `/api/workflows/instances?workflowDefinitionId={id}&input={input}` - 创建并执行工作流
- **GET** `/api/workflows/instances` - 获取所有工作流实例
- **GET** `/api/workflows/instances/{id}` - 获取工作流实例详情（包含节点状态）
- **POST** `/api/workflows/instances/{id}/terminate` - ⚠️ **终止运行中的工作流**
- **DELETE** `/api/workflows/instances/{id}` - 🗑️ **删除工作流实例**（仅限已完成或已终止的）

### WebSocket 实时推送

**连接端点**: `ws://localhost:8080/ws`

**订阅主题**: `/topic/workflow-status`

**消息格式**:
```json
{
  "workflowInstanceId": 1,
  "status": "RUNNING|SUCCESS|FAILED",
  "message": "状态描述",
  "timestamp": 1699000000000
}
```

## 工作流执行流程

```
1. 用户在前端创建工作流实例
   ↓
2. API 服务
   - 创建 WorkflowInstance 记录
   - 创建所有 NodeInstance 记录（状态：PENDING）
   - 发送 Kafka 消息到 mindflow-workflow-created
   ↓
3. Orchestrator 服务（消费 workflow-created）
   - 解析工作流配置
   - 构建依赖关系图
   - 找到入口节点（无依赖的节点）
   - 更新入口节点状态为 RUNNING
   - 发送入口节点任务到 mindflow-tasks
   ↓
4. Worker 服务（消费 tasks）
   - 执行任务（AI/HTTP/Email）
   - 更新节点状态（SUCCESS/FAILED）
   - ❗ 节点失败时，立即标记工作流为 FAILED
   - 发送完成事件到 mindflow-node-completed
   ↓
5. Orchestrator 服务（消费 node-completed）
   - 检查依赖该节点的下游节点
   - 找到所有依赖已完成的节点
   - 发送新任务到 mindflow-tasks
   - 📡 通过 Kafka 发送状态更新到前端
   ↓
6. API 服务
   - 监听状态更新 Kafka 消息
   - 通过 WebSocket 推送给前端
   ↓
7. 前端实时更新（不使用轮询）
```

## Kafka 主题

| 主题名称 | 生产者 | 消费者 | 用途 |
|---------|--------|--------|------|
| `mindflow-workflow-created` | api | orchestrator | 工作流创建通知 |
| `mindflow-tasks` | orchestrator | worker | 任务执行队列 |
| `mindflow-node-completed` | worker | orchestrator | 节点完成通知 |
| `mindflow-status-updates` | orchestrator | api | 状态更新推送 |

## 工作流配置示例

```json
{
  "name": "AI 数据处理工作流",
  "description": "从 API 获取数据，通过 AI 处理，发送邮件通知",
  "config": {
    "nodes": [
      {
        "id": "node1",
        "type": "http",
        "name": "获取数据",
        "config": {
          "url": "https://api.example.com/data",
          "method": "GET"
        }
      },
      {
        "id": "node2",
        "type": "ai",
        "name": "AI 分析",
        "config": {
          "prompt": "请分析以下数据并生成报告",
          "model": "gpt-3.5-turbo"
        }
      },
      {
        "id": "node3",
        "type": "email",
        "name": "发送报告",
        "config": {
          "to": "admin@example.com",
          "subject": "数据分析报告",
          "content": "报告已生成"
        }
      }
    ],
    "edges": [
      { "id": "edge1", "source": "node1", "target": "node2" },
      { "id": "edge2", "source": "node2", "target": "node3" }
    ]
  }
}
```

## 任务类型

| 类型 | 说明 | 配置参数 |
|------|------|----------|
| **ai** | AI 任务执行器 | `prompt`, `model` |
| **http** | HTTP 请求执行器 | `url`, `method`, `headers`, `body` |
| **email** | 邮件发送执行器 | `to`, `subject`, `content` |

## 监控工具

### Kafka UI
访问地址：http://localhost:8090

功能：
- 📊 查看所有 Kafka 主题
- 💬 实时查看消息内容
- 👥 监控消费者组和消费延迟
- ✉️ 手动发送测试消息

## 故障处理

### 🔴 节点失败处理
- 任何节点失败时，**立即标记工作流为 FAILED**
- 不再执行后续节点
- 记录失败原因到 `errorMessage` 字段

### ⚠️ 终止工作流
```bash
POST /api/workflows/instances/{id}/terminate
```
- 将工作流状态设置为 `TERMINATED`
- 终止所有 RUNNING 和 PENDING 状态的节点
- 不可恢复

### 🗑️ 删除工作流实例
```bash
DELETE /api/workflows/instances/{id}
```
- 只能删除 SUCCESS、FAILED、TERMINATED 状态的实例
- 级联删除所有节点实例
- 操作不可逆

## 扩展性

### 横向扩展 Worker

Worker 服务支持多实例部署，Kafka 会自动进行负载均衡：

```bash
# 启动多个 Worker 实例
java -jar mindflow-worker.jar --server.port=8082
java -jar mindflow-worker.jar --server.port=8083
java -jar mindflow-worker.jar --server.port=8084
```

### 添加自定义任务类型

1. 实现 `TaskExecutor` 接口
2. 添加 `@Component` 注解
3. 重新编译部署 worker 模块

## 默认账号

- 用户名: `admin`
- 密码: `admin123`

## 架构优势

✅ **完全解耦**: 服务间通过 Kafka 通信，无直接依赖  
✅ **实时推送**: WebSocket 实时更新，无需轮询  
✅ **快速失败**: 节点失败立即停止工作流  
✅ **独立部署**: 每个服务可独立启动、升级、回滚  
✅ **水平扩展**: Worker 可无限扩展，自动负载均衡  
✅ **容错性强**: 消息队列保证不丢失，支持重试  
✅ **易于维护**: 职责清晰，修改影响范围小  
✅ **符合微服务架构**: 遵循单一职责和服务自治原则

## 故障排查

### Kafka 连接失败
```bash
# 检查 Kafka 是否运行
docker ps | grep kafka
# 查看 Kafka 日志
docker logs mindflow-kafka
```

### 数据库连接失败
```bash
# 检查 MySQL 是否运行
docker ps | grep mysql
# 测试连接
mysql -h localhost -u root -p mindflow
```

### WebSocket 连接失败
- 检查 API 服务是否启动
- 检查防火墙是否阻止 WebSocket 连接
- 查看浏览器控制台错误信息

### 服务无法启动
- 确保端口未被占用（8080, 8081, 8082, 8090, 3000）
- 检查 Kafka、MySQL、Redis 是否正常运行
- 查看应用日志确认具体错误

## 许可证

MIT
