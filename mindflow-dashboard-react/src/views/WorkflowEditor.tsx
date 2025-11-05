import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  Snackbar,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import FlowEditor from '../components/FlowEditor';
import { workflowDefinitionAPI } from '../api/workflow';
import type { WorkflowDefinition } from '../types/workflow';
import type { Node, Edge } from 'reactflow';

const WorkflowEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (id) {
      loadWorkflow();
    }
  }, [id]);

  const loadWorkflow = async () => {
    try {
      const response = await workflowDefinitionAPI.getById(Number(id));
      const data = response.data;
      setWorkflow(data);
      setName(data.name);
      setDescription(data.description);
    } catch (error) {
      console.error('加载工作流失败:', error);
      setSnackbar({
        open: true,
        message: '加载工作流失败',
        severity: 'error',
      });
    }
  };

  const handleSave = async (nodes: Node[], edges: Edge[]) => {
    try {
      // 过滤掉开始和结束节点，后端不需要处理这些
      const businessNodes = nodes.filter(
        (node) => node.type !== 'start' && node.type !== 'end'
      );
      
      // 获取所有业务节点的 ID
      const businessNodeIds = new Set(businessNodes.map((n) => n.id));
      
      // 过滤边：只保留连接业务节点的边
      const businessEdges = edges.filter(
        (edge) => businessNodeIds.has(edge.source) && businessNodeIds.has(edge.target)
      );

      const config = {
        nodes: businessNodes.map((node) => ({
          id: node.id,
          type: node.type || 'default',
          name: node.data.label,
          config: node.data.config || {},
          x: Math.round(node.position.x),
          y: Math.round(node.position.y),
        })),
        edges: businessEdges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })),
      };

      const workflowData = {
        name: name || '未命名工作流',
        description: description || '',
        config,
      };

      if (id) {
        await workflowDefinitionAPI.update(Number(id), workflowData);
        setSnackbar({
          open: true,
          message: '工作流更新成功！',
          severity: 'success',
        });
      } else {
        await workflowDefinitionAPI.create(workflowData);
        setSnackbar({
          open: true,
          message: '工作流创建成功！',
          severity: 'success',
        });
        setTimeout(() => navigate('/workflows'), 1500);
      }
    } catch (error) {
      console.error('保存工作流失败:', error);
      setSnackbar({
        open: true,
        message: '保存工作流失败',
        severity: 'error',
      });
    }
  };

  // 转换工作流配置为 React Flow 格式
  const initialNodes: Node[] =
    workflow?.config.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: { x: node.x || 0, y: node.y || 0 },
      data: {
        label: node.name,
        config: node.config,
      },
    })) || [];

  const initialEdges: Edge[] =
    workflow?.config.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })) || [];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/workflows')}
          sx={{ mb: 2 }}
        >
          返回列表
        </Button>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" sx={{ mb: 3 }}>
            {id ? '编辑工作流' : '创建工作流'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="工作流名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="描述"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              size="small"
            />
          </Box>
        </Paper>
      </Box>

      <FlowEditor
        key={workflow?.id || 'new'}
        onSave={handleSave}
        initialNodes={initialNodes}
        initialEdges={initialEdges}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default WorkflowEditor;

