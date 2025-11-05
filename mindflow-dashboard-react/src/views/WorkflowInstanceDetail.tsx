import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  ExpandMore,
  CheckCircle,
  Error,
  HourglassEmpty,
  PlayArrow,
  StopCircle,
} from '@mui/icons-material';
import { workflowInstanceAPI } from '../api/workflow';
import type { WorkflowInstance } from '../types/workflow';

interface NodeInstance {
  id: number;
  workflowInstanceId: number;
  nodeId: string;
  nodeType: string;
  nodeName: string;
  status: string;
  input?: string;
  output?: string;
  errorMessage?: string;
  startTime?: string;
  endTime?: string;
}

const WorkflowInstanceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [instance, setInstance] = useState<WorkflowInstance | null>(null);
  const [nodeInstances, setNodeInstances] = useState<NodeInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstanceDetail();
    
    // 如果实例正在运行，每2秒刷新一次
    const interval = setInterval(() => {
      if (instance?.status === 'RUNNING') {
        loadInstanceDetail();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [id, instance?.status]);

  const loadInstanceDetail = async () => {
    try {
      const response = await workflowInstanceAPI.getById(Number(id));
      setInstance(response.data);
      setNodeInstances(response.data.nodeInstances || []);
      setLoading(false);
    } catch (error) {
      console.error('加载工作流实例详情失败:', error);
      setLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig: { [key: string]: { label: string; color: any; icon: any } } = {
      PENDING: { label: '待执行', color: 'default', icon: <HourglassEmpty fontSize="small" /> },
      RUNNING: { label: '运行中', color: 'primary', icon: <PlayArrow fontSize="small" /> },
      SUCCESS: { label: '已完成', color: 'success', icon: <CheckCircle fontSize="small" /> },
      FAILED: { label: '失败', color: 'error', icon: <Error fontSize="small" /> },
      TERMINATED: { label: '已终止', color: 'warning', icon: <StopCircle fontSize="small" /> },
    };
    
    const config = statusConfig[status] || { label: status, color: 'default', icon: null };
    return (
      <Chip 
        label={config.label} 
        color={config.color} 
        size="small"
        icon={config.icon}
      />
    );
  };

  const formatDuration = (start?: string, end?: string) => {
    if (!start) return '-';
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    
    if (duration < 1) return '< 1秒';
    if (duration < 60) return `${duration}秒`;
    if (duration < 3600) return `${Math.floor(duration / 60)}分${duration % 60}秒`;
    return `${Math.floor(duration / 3600)}小时${Math.floor((duration % 3600) / 60)}分`;
  };

  const formatJson = (jsonStr?: string) => {
    if (!jsonStr) return '-';
    try {
      return JSON.stringify(JSON.parse(jsonStr), null, 2);
    } catch {
      return jsonStr;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Typography>加载中...</Typography>
      </Container>
    );
  }

  if (!instance) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert severity="error">工作流实例不存在</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/instances')}
          sx={{ mt: 2 }}
        >
          返回列表
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/instances')}
          sx={{ mb: 2 }}
        >
          返回执行记录
        </Button>

        <Typography variant="h4" sx={{ mb: 3 }}>
          工作流执行详情
        </Typography>

        {/* 实例概览 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  实例ID
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {instance.id}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">
                  工作流名称
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {instance.workflowName || `工作流 ${instance.workflowDefinitionId}`}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">
                  状态
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {getStatusChip(instance.status)}
                </Box>

                {instance.errorMessage && (
                  <>
                    <Typography variant="subtitle2" color="text.secondary">
                      错误信息
                    </Typography>
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {instance.errorMessage}
                    </Alert>
                  </>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  开始时间
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {instance.startTime
                    ? new Date(instance.startTime).toLocaleString()
                    : '-'}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">
                  结束时间
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {instance.endTime
                    ? new Date(instance.endTime).toLocaleString()
                    : instance.status === 'RUNNING' ? '运行中...' : '-'}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">
                  执行时长
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {formatDuration(instance.startTime, instance.endTime)}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle2">输入参数</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
                      {formatJson(instance.input)}
                    </Paper>
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle2">输出结果</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
                      {formatJson(instance.output)}
                    </Paper>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 节点执行详情 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            节点执行详情
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>节点名称</TableCell>
                  <TableCell>节点类型</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>开始时间</TableCell>
                  <TableCell>结束时间</TableCell>
                  <TableCell>执行时长</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {nodeInstances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">暂无节点执行记录</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  nodeInstances.map((node) => (
                    <React.Fragment key={node.id}>
                      <TableRow>
                        <TableCell>{node.nodeName}</TableCell>
                        <TableCell>{node.nodeType}</TableCell>
                        <TableCell>{getStatusChip(node.status)}</TableCell>
                        <TableCell>
                          {node.startTime
                            ? new Date(node.startTime).toLocaleString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {node.endTime
                            ? new Date(node.endTime).toLocaleString()
                            : node.status === 'RUNNING' ? '运行中...' : '-'}
                        </TableCell>
                        <TableCell>
                          {formatDuration(node.startTime, node.endTime)}
                        </TableCell>
                      </TableRow>
                      {(node.input || node.output || node.errorMessage) && (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ py: 0, borderBottom: 0 }}>
                            <Box sx={{ py: 2 }}>
                              {node.input && (
                                <Accordion>
                                  <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="body2">节点输入</Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <Paper
                                      variant="outlined"
                                      sx={{
                                        p: 1,
                                        bgcolor: 'grey.50',
                                        fontFamily: 'monospace',
                                        fontSize: '0.75rem',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-all',
                                      }}
                                    >
                                      {formatJson(node.input)}
                                    </Paper>
                                  </AccordionDetails>
                                </Accordion>
                              )}

                              {node.output && (
                                <Accordion>
                                  <AccordionSummary expandIcon={<ExpandMore />}>
                                    <Typography variant="body2">节点输出</Typography>
                                  </AccordionSummary>
                                  <AccordionDetails>
                                    <Paper
                                      variant="outlined"
                                      sx={{
                                        p: 1,
                                        bgcolor: 'grey.50',
                                        fontFamily: 'monospace',
                                        fontSize: '0.75rem',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-all',
                                      }}
                                    >
                                      {formatJson(node.output)}
                                    </Paper>
                                  </AccordionDetails>
                                </Accordion>
                              )}

                              {node.errorMessage && (
                                <Alert severity="error" sx={{ mt: 1 }}>
                                  <Typography variant="body2">
                                    <strong>错误信息：</strong>
                                    {node.errorMessage}
                                  </Typography>
                                </Alert>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
};

export default WorkflowInstanceDetail;

