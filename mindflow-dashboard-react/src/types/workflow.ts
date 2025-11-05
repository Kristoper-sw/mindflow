// 工作流相关类型定义

export interface NodeConfig {
  [key: string]: any;
}

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  config: NodeConfig;
  x?: number;
  y?: number;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowConfig {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowDefinition {
  id?: number;
  name: string;
  description: string;
  config: WorkflowConfig;
  createdAt?: string;
  updatedAt?: string;
}

export interface NodeInstance {
  id: number;
  workflowInstanceId: number;
  nodeId: string;
  nodeType: string;
  nodeName: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TERMINATED';
  input?: string;
  output?: string;
  errorMessage?: string;
  startTime?: string;
  endTime?: string;
}

export interface WorkflowInstance {
  id?: number;
  workflowDefinitionId: number;
  workflowName?: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TERMINATED';
  input?: string;
  output?: string;
  errorMessage?: string;
  nodeInstances?: NodeInstance[];
  startTime: string;
  endTime?: string;
}

export interface WorkflowStatusUpdate {
  workflowInstanceId: number;
  status: string;
  message: string;
  timestamp: number;
}

