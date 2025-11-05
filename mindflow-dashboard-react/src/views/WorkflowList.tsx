import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Add, Edit, Delete, PlayArrow } from '@mui/icons-material';
import { workflowDefinitionAPI } from '../api/workflow';
import type { WorkflowDefinition } from '../types/workflow';

const WorkflowList: React.FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });
  const [deleteDialog, setDeleteDialog] = useState({ 
    open: false, 
    workflowId: null as number | null,
    workflowName: '' 
  });

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await workflowDefinitionAPI.getAll();
      setWorkflows(response.data);
    } catch (error) {
      console.error('加载工作流列表失败:', error);
    }
  };

  const handleDelete = async () => {
    const { workflowId } = deleteDialog;
    if (!workflowId) return;

    try {
      await workflowDefinitionAPI.delete(workflowId);
      setSnackbar({
        open: true,
        message: '工作流删除成功！',
        severity: 'success',
      });
      loadWorkflows();
    } catch (error: any) {
      console.error('删除工作流失败:', error);
      const errorMsg = error.response?.data?.message || error.message || '删除工作流失败';
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: 'error',
      });
    } finally {
      setDeleteDialog({ open: false, workflowId: null, workflowName: '' });
    }
  };

  const openDeleteDialog = (workflow: WorkflowDefinition) => {
    setDeleteDialog({
      open: true,
      workflowId: workflow.id!,
      workflowName: workflow.name,
    });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4">工作流列表</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/workflow/create')}
        >
          创建工作流
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>名称</TableCell>
              <TableCell>描述</TableCell>
              <TableCell>节点数</TableCell>
              <TableCell>创建时间</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workflows.map((workflow) => (
              <TableRow key={workflow.id}>
                <TableCell>{workflow.id}</TableCell>
                <TableCell>{workflow.name}</TableCell>
                <TableCell>{workflow.description}</TableCell>
                <TableCell>{workflow.config?.nodes?.length || 0}</TableCell>
                <TableCell>
                  {workflow.createdAt
                    ? new Date(workflow.createdAt).toLocaleString()
                    : '-'}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/workflow/edit/${workflow.id}`)}
                    title="编辑"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/instances?workflowId=${workflow.id}`)}
                    title="执行记录"
                  >
                    <PlayArrow />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => openDeleteDialog(workflow)}
                    title="删除"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, workflowId: null, workflowName: '' })}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要删除工作流 <strong>"{deleteDialog.workflowName}"</strong> 吗？
            <br />
            此操作不可恢复。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialog({ open: false, workflowId: null, workflowName: '' })}
          >
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

export default WorkflowList;

