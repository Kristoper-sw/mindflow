import React, { useState, useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Paper,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Button,
  ButtonGroup,
  Alert,
  InputAdornment,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  ExpandMore,
  Search,
  Add,
  ZoomIn,
  ZoomOut,
  FitScreen,
  Delete,
  AutoFixHigh,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// 导入自定义节点
import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';
import HttpNode from './nodes/HttpNode';
import AiNode from './nodes/AiNode';

// 节点类型配置
const nodeTypes = {
  start: StartNode,
  end: EndNode,
  http: HttpNode,
  ai: AiNode,
};

// 节点库配置
const nodeLibrary = [
  {
    type: 'start',
    label: '开始节点',
    icon: '▶️',
    description: '标记流程入口（仅用于显示）',
    category: '基础',
  },
  {
    type: 'http',
    label: 'HTTP 请求',
    icon: '🌐',
    description: '发送 HTTP 请求',
    category: '工具',
  },
  {
    type: 'ai',
    label: 'AI 处理',
    icon: '🤖',
    description: '调用 AI 模型',
    category: 'AI',
  },
  {
    type: 'end',
    label: '结束节点',
    icon: '⏹️',
    description: '标记流程出口（仅用于显示）',
    category: '基础',
  },
];

// 样式化组件
const EditorContainer = styled(Box)({
  display: 'flex',
  height: 'calc(100vh - 200px)',
  minHeight: '600px',
  background: '#fafafa',
  borderRadius: '8px',
  overflow: 'hidden',
});

const NodePanel = styled(Paper)(({ theme }) => ({
  width: '320px',
  background: '#ffffff',
  borderRight: `1px solid ${theme.palette.grey[200]}`,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const PanelHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: `1px solid ${theme.palette.grey[200]}`,
  background: 'white',
}));

const SearchBox = styled(Box)(({ theme }) => ({
  padding: '12px 16px',
  borderBottom: `1px solid ${theme.palette.grey[200]}`,
  background: 'white',
}));

const NodeCategories = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  background: 'white',
});

const NodeItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  background: 'white',
  border: `1px solid ${theme.palette.grey[200]}`,
  borderRadius: '8px',
  cursor: 'grab',
  transition: 'all 0.2s ease',
  boxShadow: 'rgba(0, 0, 0, 0.05) 0px 0px 0px 1px',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow:
      'rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    transform: 'translateY(-2px)',
  },
  '&:active': {
    cursor: 'grabbing',
  },
}));

const NodeIcon = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  fontSize: '18px',
  flexShrink: 0,
  background: '#f5f5f5',
});

const CanvasArea = styled(Box)({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  background: 'white',
});

const Toolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '16px',
  padding: '12px 16px',
  background: 'white',
  borderBottom: `1px solid ${theme.palette.grey[200]}`,
}));

const ConfigPanel = styled(Paper)(({ theme }) => ({
  width: '350px',
  background: 'white',
  borderLeft: `1px solid ${theme.palette.grey[200]}`,
  padding: '20px',
  overflowY: 'auto',
}));

interface FlowEditorProps {
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

let nodeId = 1;

const FlowEditor: React.FC<FlowEditorProps> = ({
  onSave,
  initialNodes = [],
  initialEdges = [],
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setEdge] = useState<Edge | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<string>('基础');

  // 节点分类过滤
  const filteredNodes = useMemo(() => {
    const categories = [
      { name: '基础', icon: '⚙️', nodes: [] as typeof nodeLibrary },
      { name: 'AI', icon: '🤖', nodes: [] as typeof nodeLibrary },
      { name: '工具', icon: '🔧', nodes: [] as typeof nodeLibrary },
    ];

    const query = searchQuery.toLowerCase();

    nodeLibrary.forEach((node) => {
      if (
        !query ||
        node.label.toLowerCase().includes(query) ||
        node.description.toLowerCase().includes(query)
      ) {
        const category = categories.find((c) => c.name === node.category);
        if (category) {
          category.nodes.push(node);
        }
      }
    });

    return categories.filter((c) => c.nodes.length > 0);
  }, [searchQuery]);

  // 连接节点
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // 拖拽开始
  const onDragStart = (event: React.DragEvent, nodeType: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeType));
    event.dataTransfer.effectAllowed = 'move';
  };

  // 拖拽结束
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // 放置节点
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const nodeData = JSON.parse(
        event.dataTransfer.getData('application/reactflow')
      );

      if (!nodeData || !reactFlowInstance || !reactFlowBounds) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${nodeData.type}_${nodeId++}`,
        type: nodeData.type,
        position,
        data: {
          label: nodeData.label,
          config: getDefaultConfig(nodeData.type),
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // 获取默认配置
  const getDefaultConfig = (type: string) => {
    const configs: { [key: string]: any } = {
      http: { method: 'GET', url: '', headers: '' },
      ai: { apiKey: '', model: 'gpt-3.5-turbo', prompt: '' },
      start: {},
      end: {},
    };
    return configs[type] || {};
  };

  // 节点点击
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setEdge(null);
  }, []);

  // 边点击
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setEdge(edge);
    setSelectedNode(null);
  }, []);

  // 更新节点
  const updateNodeData = (nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = { ...node, data: { ...node.data, ...data } };
          // 同步更新 selectedNode（如果正在编辑这个节点）
          if (selectedNode && selectedNode.id === nodeId) {
            setSelectedNode(updatedNode);
          }
          return updatedNode;
        }
        return node;
      })
    );
  };

  // 删除节点
  const deleteNode = () => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setSelectedNode(null);
    }
  };

  // 删除边
  const deleteEdge = () => {
    if (selectedEdge) {
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id));
      setEdge(null);
    }
  };

  // 工具栏功能
  const handleZoomIn = () => reactFlowInstance?.zoomIn();
  const handleZoomOut = () => reactFlowInstance?.zoomOut();
  const handleFitView = () => reactFlowInstance?.fitView();
  const handleClear = () => {
    if (window.confirm('确定要清空画布吗？')) {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
      setEdge(null);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(nodes, edges);
    }
  };

  return (
    <EditorContainer>
      {/* 左侧节点面板 */}
      <NodePanel elevation={0}>
        <PanelHeader>
          <Typography variant="h6" sx={{ fontSize: '15px', fontWeight: 600 }}>
            📦 节点库
          </Typography>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '22px',
              height: '22px',
              px: '6px',
              bgcolor: 'primary.main',
              color: 'white',
              borderRadius: '11px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {nodeLibrary.length}
          </Box>
        </PanelHeader>

        <SearchBox>
          <TextField
            fullWidth
            size="small"
            placeholder="搜索节点..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </SearchBox>

        <NodeCategories>
          {filteredNodes.map((category) => (
            <Accordion
              key={category.name}
              expanded={expanded === category.name}
              onChange={() =>
                setExpanded(expanded === category.name ? '' : category.name)
              }
              elevation={0}
              sx={{ '&:before': { display: 'none' } }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    flex: 1,
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{category.icon}</span>
                  <Typography sx={{ fontSize: '14px', fontWeight: 500, flex: 1 }}>
                    {category.name}
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '20px',
                      height: '20px',
                      px: '6px',
                      bgcolor: 'grey.100',
                      color: 'grey.700',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    {category.nodes.length}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: '8px' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {category.nodes.map((node) => (
                    <NodeItem
                      key={node.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, node)}
                    >
                      <NodeIcon>{node.icon}</NodeIcon>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'grey.900',
                          }}
                        >
                          {node.label}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '11px',
                            color: 'grey.700',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {node.description}
                        </Typography>
                      </Box>
                    </NodeItem>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </NodeCategories>
      </NodePanel>

      {/* 中间画布区域 */}
      <CanvasArea>
        <Toolbar>
          <Alert severity="info" sx={{ flex: 1, maxWidth: '700px' }}>
            💡 拖拽节点到画布并连线。开始/结束节点仅用于标记流程，不会被执行。
          </Alert>
          <ButtonGroup size="small">
            <Button startIcon={<ZoomIn />} onClick={handleZoomIn}>
              放大
            </Button>
            <Button startIcon={<ZoomOut />} onClick={handleZoomOut}>
              缩小
            </Button>
            <Button startIcon={<FitScreen />} onClick={handleFitView}>
              适应
            </Button>
          </ButtonGroup>
          <ButtonGroup size="small">
            <Button startIcon={<Delete />} onClick={handleClear}>
              清空
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleSave}
            >
              保存
            </Button>
          </ButtonGroup>
        </Toolbar>

        <Box ref={reactFlowWrapper} sx={{ flex: 1, bgcolor: '#fafafa' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background color="#aaa" gap={16} />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </Box>
      </CanvasArea>

      {/* 右侧配置面板 */}
      <ConfigPanel elevation={0}>
        <Typography variant="h6" sx={{ mb: 2, fontSize: '15px', fontWeight: 600 }}>
          {selectedNode
            ? '节点配置'
            : selectedEdge
            ? '连线配置'
            : '使用指南'}
        </Typography>

        {!selectedNode && !selectedEdge && (
          <Box>
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                📖 快速开始
              </Typography>
              <Typography variant="body2" component="ol" sx={{ pl: 2.5 }}>
                <li>从左侧拖拽节点到画布</li>
                <li>从节点右侧圆点拖动到另一个节点左侧圆点创建连线</li>
                <li>点击节点配置参数</li>
                <li>保存工作流</li>
              </Typography>
            </Paper>
          </Box>
        )}

        {selectedNode && (
          <Box>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="节点名称"
                size="small"
                value={selectedNode.data.label}
                onChange={(e) =>
                  updateNodeData(selectedNode.id, { label: e.target.value })
                }
              />
            </FormControl>

            {selectedNode.type === 'http' && (
              <>
                <Divider sx={{ my: 2 }}>HTTP 配置</Divider>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel size="small">请求方法</InputLabel>
                  <Select
                    size="small"
                    value={selectedNode.data.config?.method || 'GET'}
                    label="请求方法"
                    onChange={(e: SelectChangeEvent) =>
                      updateNodeData(selectedNode.id, {
                        config: {
                          ...selectedNode.data.config,
                          method: e.target.value,
                        },
                      })
                    }
                  >
                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem value="POST">POST</MenuItem>
                    <MenuItem value="PUT">PUT</MenuItem>
                    <MenuItem value="DELETE">DELETE</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <TextField
                    label="URL"
                    size="small"
                    value={selectedNode.data.config?.url || ''}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, {
                        config: {
                          ...selectedNode.data.config,
                          url: e.target.value,
                        },
                      })
                    }
                    placeholder="https://api.example.com"
                  />
                </FormControl>
              </>
            )}

            {selectedNode.type === 'ai' && (
              <>
                <Divider sx={{ my: 2 }}>AI 配置</Divider>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <TextField
                    label="API Key"
                    size="small"
                    type="password"
                    value={selectedNode.data.config?.apiKey || ''}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, {
                        config: {
                          ...selectedNode.data.config,
                          apiKey: e.target.value,
                        },
                      })
                    }
                  />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <TextField
                    label="模型"
                    size="small"
                    value={selectedNode.data.config?.model || ''}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, {
                        config: {
                          ...selectedNode.data.config,
                          model: e.target.value,
                        },
                      })
                    }
                    placeholder="gpt-3.5-turbo"
                  />
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <TextField
                    label="提示词"
                    size="small"
                    multiline
                    rows={4}
                    value={selectedNode.data.config?.prompt || ''}
                    onChange={(e) =>
                      updateNodeData(selectedNode.id, {
                        config: {
                          ...selectedNode.data.config,
                          prompt: e.target.value,
                        },
                      })
                    }
                    placeholder="请输入提示词..."
                  />
                </FormControl>
              </>
            )}

            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={deleteNode}
              startIcon={<Delete />}
            >
              删除节点
            </Button>
          </Box>
        )}

        {selectedEdge && (
          <Box>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <TextField
                label="连线ID"
                size="small"
                value={selectedEdge.id}
                disabled
              />
            </FormControl>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={deleteEdge}
              startIcon={<Delete />}
            >
              删除连线
            </Button>
          </Box>
        )}
      </ConfigPanel>
    </EditorContainer>
  );
};

const FlowEditorWrapper: React.FC<FlowEditorProps> = (props) => (
  <ReactFlowProvider>
    <FlowEditor {...props} />
  </ReactFlowProvider>
);

export default FlowEditorWrapper;

