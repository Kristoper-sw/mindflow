import api from './axios';
import type { WorkflowDefinition, WorkflowInstance } from '../types/workflow';

// 认证 API
export const authAPI = {
  login: (username: string, password: string) => 
    api.post('/auth/login', { username, password }),
};

// 工作流定义 API
export const workflowDefinitionAPI = {
  getAll: () => 
    api.get<WorkflowDefinition[]>('/workflows/definitions'),
  
  getById: (id: number) => 
    api.get<WorkflowDefinition>(`/workflows/definitions/${id}`),
  
  create: (data: Omit<WorkflowDefinition, 'id'>) => 
    api.post<WorkflowDefinition>('/workflows/definitions', data),
  
  update: (id: number, data: Omit<WorkflowDefinition, 'id'>) => 
    api.put<WorkflowDefinition>(`/workflows/definitions/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/workflows/definitions/${id}`),
};

// 工作流实例 API
export const workflowInstanceAPI = {
  getAll: () => 
    api.get<WorkflowInstance[]>('/workflows/instances'),
  
  getById: (id: number) => 
    api.get<WorkflowInstance>(`/workflows/instances/${id}`),
  
  create: (workflowDefinitionId: number, input?: string) => 
    api.post<WorkflowInstance>(
      `/workflows/instances?workflowDefinitionId=${workflowDefinitionId}${input ? `&input=${encodeURIComponent(input)}` : ''}`
    ),
  
  terminate: (id: number) => 
    api.post(`/workflows/instances/${id}/terminate`),
  
  delete: (id: number) => 
    api.delete(`/workflows/instances/${id}`),
};

