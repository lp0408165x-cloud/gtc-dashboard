import axios from 'axios';

// API 基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://gtc-ai-platform.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加 Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gtc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gtc_token');
      localStorage.removeItem('gtc_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== 认证 API ====================

export const authAPI = {
 // 登录
login: async (email, password) => {
  const response = await api.post('/auth/login', {
    email: email,
    password: password
  });
  return response.data;
},

  // 注册
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // 获取当前用户
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// ==================== 案件 API ====================

export const casesAPI = {
  // 获取案件列表
  list: async (params = {}) => {
    const response = await api.get('/cases', { params });
    return response.data;
  },

  // 获取单个案件
  get: async (caseId) => {
    const response = await api.get(`/cases/${caseId}`);
    return response.data;
  },

  // 创建案件
  create: async (caseData) => {
    const response = await api.post('/cases', caseData);
    return response.data;
  },

  // 更新案件
  update: async (caseId, caseData) => {
    const response = await api.put(`/cases/${caseId}`, caseData);
    return response.data;
  },

  // 删除案件
  delete: async (caseId) => {
    const response = await api.delete(`/cases/${caseId}`);
    return response.data;
  },
};

// ==================== 文件 API ====================

export const filesAPI = {
  // 上传文件
  upload: async (caseId, file, fileType = 'document') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);

    const response = await api.post(`/files/upload/${caseId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // 获取案件文件列表
  listByCaseId: async (caseId) => {
    const response = await api.get(`/files/case/${caseId}`);
    return response.data;
  },

  // 删除文件
  delete: async (fileId) => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  },
};

// ==================== AI API ====================

export const aiAPI = {
  // AI 状态检查
  status: async () => {
    const response = await api.get('/ai/status');
    return response.data;
  },

  // Gemini 文档分析
  analyzeDocument: async (caseId, analysisType = 'risk_scan') => {
    const response = await api.post(`/ai/gemini/analyze/${caseId}`, {
      analysis_type: analysisType,
    });
    return response.data;
  },

  // Claude 申诉书生成
  generatePetition: async (caseId, petitionType = 'standard') => {
    const response = await api.post(`/ai/claude/petition/${caseId}`, {
      petition_type: petitionType,
    });
    return response.data;
  },

  // 获取 AI 分析历史
  getHistory: async (caseId) => {
    const response = await api.get(`/ai/history/${caseId}`);
    return response.data;
  },
};

export default api;
