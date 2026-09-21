import api from './api';
import { WS_BASE } from '../config/line';

export const agentAPI = {
  // HTTP 模式分析
  analyze: async (caseId, options = {}) => {
    const response = await api.post('/agent/analyze', {
      case_id: caseId,
      options
    });
    return response.data;
  },

  // WebSocket 实时分析
  analyzeWithProgress: (caseId, callbacks = {}) => {
    const { onProgress, onComplete, onError, onStart } = callbacks;
    
    const ws = new WebSocket(`${WS_BASE}/api/v1/agent/ws/${caseId}`);
    
    ws.onopen = () => {
      console.log('Agent WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'started':
          onStart && onStart(message.data);
          break;
        case 'progress':
          onProgress && onProgress(message.data);
          break;
        case 'completed':
          onComplete && onComplete(message.data);
          ws.close();
          break;
        case 'error':
          onError && onError(message.data);
          ws.close();
          break;
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      onError && onError({ message: 'WebSocket connection failed' });
    };
    
    ws.onclose = () => {
      console.log('Agent WebSocket closed');
    };
    
    return ws;
  },

  // 获取分析状态
  getStatus: async (caseId) => {
    const response = await api.get(`/agent/status/${caseId}`);
    return response.data;
  }
};

export default agentAPI;