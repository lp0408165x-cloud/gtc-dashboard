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
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email: email,
      password: password
    });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// ==================== 案件 API ====================

export const casesAPI = {
  list: async (params = {}) => {
    const response = await api.get('/cases/', { params });
    return response.data;
  },

  get: async (caseId) => {
    const response = await api.get(`/cases/${caseId}`);
    return response.data;
  },

  create: async (caseData) => {
    const response = await api.post('/cases/', caseData);
    return response.data;
  },

  update: async (caseId, caseData) => {
    const response = await api.put(`/cases/${caseId}`, caseData);
    return response.data;
  },

  delete: async (caseId) => {
    const response = await api.delete(`/cases/${caseId}`);
    return response.data;
  },
};

// ==================== 文件 API ====================

export const filesAPI = {
  upload: async (caseId, file, fileType = 'document') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);

    const response = await api.post(`/files/upload/${caseId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  listByCaseId: async (caseId) => {
    const response = await api.get(`/files/case/${caseId}`);
    return response.data;
  },

  delete: async (fileId) => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  },
};

// ==================== AI API ====================

export const aiAPI = {
  status: async () => {
    const response = await api.get('/ai/status');
    return response.data;
  },

  analyzeDocument: async (caseId, analysisType = 'risk_scan') => {
    const response = await api.post(`/ai/${caseId}/risk-analysis`, {
      analysis_type: analysisType,
    });
    return response.data;
  },

  generatePetition: async (caseId, petitionType = 'standard') => {
    const response = await api.post(`/ai/${caseId}/petition`, {
      petition_type: petitionType,
    });
    return response.data;
  },

  getHistory: async (caseId) => {
    const response = await api.get(`/ai/${caseId}/runs`);
    return response.data;
  },
};

export default api;
