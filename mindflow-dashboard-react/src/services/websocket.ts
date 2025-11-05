import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { WorkflowStatusUpdate } from '../types/workflow';

class WebSocketService {
  private client: Client | null = null;
  private subscribers: Map<string, (message: WorkflowStatusUpdate) => void> = new Map();

  connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        debug: (str) => {
          console.log('[STOMP]', str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.onConnect = () => {
        console.log('WebSocket 已连接');
        
        // 订阅工作流状态更新
        this.client?.subscribe('/topic/workflow-status', (message) => {
          const update: WorkflowStatusUpdate = JSON.parse(message.body);
          this.subscribers.forEach((callback) => callback(update));
        });

        resolve();
      };

      this.client.onStompError = (frame) => {
        console.error('STOMP 错误:', frame.headers['message']);
        reject(new Error(frame.headers['message']));
      };

      this.client.activate();
    });
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.subscribers.clear();
      console.log('WebSocket 已断开');
    }
  }

  subscribe(id: string, callback: (message: WorkflowStatusUpdate) => void): void {
    this.subscribers.set(id, callback);
  }

  unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

export default new WebSocketService();

