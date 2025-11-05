import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Chip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { 
  Visibility, 
  Delete, 
  StopCircle, 
  PlayArrow, 
  ArrowBack,
  Refresh,
} from '@mui/icons-material';
import { workflowInstanceAPI, workflowDefinitionAPI } from '../api/workflow';
import type { WorkflowInstance, WorkflowDefinition } from '../types/workflow';

const WorkflowInstances: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workflowId = searchParams.get('workflowId');

  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [filterWorkflowId, setFilterWorkflowId] = useState<string>(workflowId || '');
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });
  const [deleteDialog, setDeleteDialog] = useState({ 
    open: false, 
    instanceId: null as number | null 
  });
  const [executeDialog, setExecuteDialog] = useState({ 
    open: false, 
    workflowId: null as number | null,
    input: '{}'
  });

  useEffect(() => {
    loadWorkflows();
    loadInstances();
    
    // 每5秒自动刷新一次（用于显示运行中的实例）
    const interval = setInterval(() => {
      loadInstances();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [filterWorkflowId]);

  const loadWorkflows = async () => {
    try {
      const response = await workflowDefinitionAPI.getAll();
      setWorkflows(response.data);
    } catch (error) {
      console.error('加载工作流列表失败:', error);
    }
  };

  const loadInstances = async () => {
    try {
      const response = await workflowInstanceAPI.getAll();
      let data = response.data;
      
      // 按 workflowDefinitionId 过滤
      if (filterWorkflowId) {
        data = data.filter(inst => inst.workflowDefinitionId === Number(filterWorkflowId));
      }
      
      setInstances(data);
    } catch (error) {
      console.error('加载工作流实例列表失败:', error);
    }
  };

  const handleExecute = async () => {
    const { workflowId, input } = executeDialog;
    if (!workflowId) return;

    try {
      await workflowInstanceAPI.create(workflowId, input);
      setSnackbar({
        open: true,
        message: '工作流执行已启动！',
        severity: 'success',
      });
      loadInstances();
    } catch (error: any) {
      console.error('执行工作流失败:', error);
      const errorMsg = error.response?.data?.message || error.message || '执行工作流失败';
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: 'error',
      });
    } finally {
      setExecuteDialog({ open: false, workflowId: null, input: '{}' });
    }
  };

  const handleTerminate = async (id: number) => {
    try {
      await workflowInstanceAPI.terminate(id);
      setSnackbar({
        open: true,
        message: '工作流已终止！',
        severity: 'success',
      });
      loadInstances();
    } catch (error: any) {
      console.error('终止工作流失败:', error);
      const errorMsg = error.response?.data?.message || error.message || '终止工作流失败';
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: 'error',
      });
    }
  };

  const handleDelete = async () => {
    const { instanceId } = deleteDialog;
    if (!instanceId) return;

    try {
      await workflowInstanceAPI.delete(instanceId);
      setSnackbar({
        open: true,
        message: '工作流实例删除成功！',
        severity: 'success',
      });
      loadInstances();
    } catch (error: any) {
      console.error('删除工作流实例失败:', error);
      const errorMsg = error.response?.data?.message || error.message || '删除工作流实例失败';
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: 'error',
      });
    } finally {
      setDeleteDialog({ open: false, instanceId: null });
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig: { [key: string]: { label: string; color: any } } = {
      PENDING: { label: '待执行', color: 'default' },
      RUNNING: { label: '运行中', color: 'primary' },
      SUCCESS: { label: '已完成', color: 'success' },
      FAILED: { label: '失败', color: 'error' },
      TERMINATED: { label: '已终止', color: 'warning' },
    };
    
    const config = statusConfig[status] || { label: status, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const formatDuration = (start: string, end?: string) => {
    if (!start) return '-';
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    
    if (duration < 60) return `${duration}秒`;
    if (duration < 3600) return `${Math.floor(duration / 60)}分${duration % 60}秒`;
    return `${Math.floor(duration / 3600)}小时${Math.floor((duration % 3600) / 60)}分`;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/workflows')}
            >
              返回工作流列表
            </Button>
            <Typography variant="h4">工作流执行记录</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={() => {
              const firstWorkflow = workflows[0];
              if (firstWorkflow) {
                setExecuteDialog({ 
                  open: true, 
                  workflowId: firstWorkflow.id!, 
                  input: '{}' 
                });
              }
            }}
            disabled={workflows.length === 0}
          >
            执行工作流
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel>筛选工作流</InputLabel>
              <Select
                value={filterWorkflowId}
                label="筛选工作流"
                onChange={(e: SelectChangeEvent) => setFilterWorkflowId(e.target.value)}
              >
                <MenuItem value="">全部</MenuItem>
                {workflows.map((wf) => (
                  <MenuItem key={wf.id} value={wf.id}>
                    {wf.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              startIcon={<Refresh />}
              onClick={loadInstances}
              size="small"
            >
              刷新
            </Button>
          </Box>
        </Paper>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>实例ID</TableCell>
              <TableCell>工作流</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>开始时间</TableCell>
              <TableCell>结束时间</TableCell>
              <TableCell>执行时长</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {instances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">暂无执行记录</Typography>
                </TableCell>
              </TableRow>
            ) : (
              instances.map((instance) => (
                <TableRow key={instance.id}>
                  <TableCell>{instance.id}</TableCell>
                  <TableCell>{instance.workflowName || `工作流 ${instance.workflowDefinitionId}`}</TableCell>
                  <TableCell>{getStatusChip(instance.status)}</TableCell>
                  <TableCell>
                    {instance.startTime
                      ? new Date(instance.startTime).toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {instance.endTime
                      ? new Date(instance.endTime).toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {formatDuration(instance.startTime, instance.endTime)}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/instances/${instance.id}`)}
                      title="查看详情"
                    >
                      <Visibility />
                    </IconButton>
                    {instance.status === 'RUNNING' && (
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleTerminate(instance.id!)}
                        title="终止执行"
                      >
                        <StopCircle />
                      </IconButton>
                    )}
                    {(instance.status === 'SUCCESS' || 
                      instance.status === 'FAILED' || 
                      instance.status === 'TERMINATED') && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteDialog({ open: true, instanceId: instance.id! })}
                        title="删除"
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 执行工作流对话框 */}
      <Dialog
        open={executeDialog.open}
        onClose={() => setExecuteDialog({ open: false, workflowId: null, input: '{}' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>执行工作流</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>选择工作流</InputLabel>
            <Select
              value={executeDialog.workflowId || ''}
              label="选择工作流"
              onChange={(e: SelectChangeEvent) => 
                setExecuteDialog({ ...executeDialog, workflowId: Number(e.target.value) })
              }
            >
              {workflows.map((wf) => (
                <MenuItem key={wf.id} value={wf.id}>
                  {wf.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="输入参数 (JSON)"
            fullWidth
            multiline
            rows={4}
            value={executeDialog.input}
            onChange={(e) => setExecuteDialog({ ...executeDialog, input: e.target.value })}
            placeholder='{"key": "value"}'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExecuteDialog({ open: false, workflowId: null, input: '{}' })}>
            取消
          </Button>
          <Button 
            onClick={handleExecute} 
            variant="contained" 
            disabled={!executeDialog.workflowId}
          >
            执行
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, instanceId: null })}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要删除这条执行记录吗？
            <br />
            此操作不可恢复。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, instanceId: null })}>
            取消
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 消息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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

export default WorkflowInstances;

