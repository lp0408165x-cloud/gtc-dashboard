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
    
    // 浏览器 WebSocket 不能带 Authorization 头，token 放在子协议里（后端 deps.accept_internal_websocket）
    const token = localStorage.getItem('gtc_token');
    const ws = new WebSocket(`${WS_BASE}/api/v1/agent/ws/${caseId}`, token ? ['bearer', token] : undefined);
    let failed = false;
    
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
      failed = true;
      onError && onError({ message: 'WebSocket connection failed' });
    };
    
    ws.onclose = (event) => {
      console.log('Agent WebSocket closed');
      if (failed) return;
      if (event.code === 4401) onError && onError({ message: '登录已过期，请重新登录' });
      else if (event.code === 4403) onError && onError({ message: '当前账号无权使用此功能' });
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