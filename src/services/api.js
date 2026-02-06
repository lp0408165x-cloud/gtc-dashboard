import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://gtc-ai-platform.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
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

  // === P0：人工介入 API ===
  changeStatus: async (caseId, newStatus, reason = '') => {
    const response = await api.post(`/cases/${caseId}/status`, {
      new_status: newStatus,
      reason: reason,
    });
    return response.data;
  },
  assign: async (caseId, assignedToUserId, note = '') => {
    const response = await api.post(`/cases/${caseId}/assign`, {
      assigned_to_user_id: assignedToUserId,
      note: note,
    });
    return response.data;
  },
  humanOverride: async (caseId, overrideData) => {
    const response = await api.post(`/cases/${caseId}/human-override`, overrideData);
    return response.data;
  },

  // === NEW: AI辅助编辑聊天 ===
  aiChat: async (caseId, messages, field = null, currentContent = null) => {
    const response = await api.post(`/cases/${caseId}/ai-chat`, {
      messages: messages,
      field: field,
      current_content: currentContent,
    });
    return response.data;
  },
};

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
  download: async (fileId) => {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
  delete: async (fileId) => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  },
};

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

export const toolsAPI = {
  preprocess: async (fileId, options = {}) => {
    const response = await api.post('/tools/preprocess', {
      file_id: fileId,
      ocr_mode: options.ocrMode || 'auto',
      language: options.language || 'eng',
      max_pages: options.maxPages || 100,
    });
    return response.data;
  },
  classifyExtract: async (fileId, options = {}) => {
    const response = await api.post('/tools/classify-extract', {
      file_id: fileId,
      doc_kind_hint: options.docKindHint || null,
      force_reclassify: options.forceReclassify || false,
    });
    return response.data;
  },
  consistencyCheck: async (caseId, options = {}) => {
    const response = await api.post('/tools/consistency-check', {
      case_id: caseId,
      rule_ids: options.ruleIds || null,
      include_passed: options.includePassed !== false,
    });
    return response.data;
  },
  riskScan: async (caseId, options = {}) => {
    const response = await api.post('/tools/risk-scan', {
      case_id: caseId,
      entity_names: options.entityNames || null,
      include_extracted: options.includeExtracted !== false,
      match_threshold: options.matchThreshold || 0.55,
    });
    return response.data;
  },
  getAvailable: async () => {
    const response = await api.get('/tools/available');
    return response.data;
  },
  getHealth: async () => {
    const response = await api.get('/tools/health');
    return response.data;
  },
};

export const usersAPI = {
  list: async (params = {}) => {
    const response = await api.get('/users/', { params });
    return response.data;
  },
};

export default api;
