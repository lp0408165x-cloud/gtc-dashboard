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

// ============================================================
// v8 新增：会员订阅 API
// ============================================================
export const subscriptionAPI = {
  // 获取所有套餐
  getPlans: async () => {
    const response = await api.get('/subscription/plans');
    return response.data;
  },
  // 获取当前订阅状态
  getCurrent: async () => {
    const response = await api.get('/subscription/current');
    return response.data;
  },
  // 创建订阅
  create: async (plan, paymentMethod = 'bank_transfer', period = 'monthly') => {
    const response = await api.post('/subscription/create', {
      plan,
      payment_method: paymentMethod,
      period,
    });
    return response.data;
  },
  // 续费
  renew: async (period = 'monthly') => {
    const response = await api.post('/subscription/renew', { period });
    return response.data;
  },
  // 升级套餐
  upgrade: async (newPlan) => {
    const response = await api.post('/subscription/upgrade', { new_plan: newPlan });
    return response.data;
  },
  // 取消订阅
  cancel: async (reason = '') => {
    const response = await api.post('/subscription/cancel', { reason });
    return response.data;
  },
  // 获取当月用量
  getUsage: async () => {
    const response = await api.get('/subscription/usage');
    return response.data;
  },
};

// ============================================================
// v8 新增：支付 API
// ============================================================
export const paymentAPI = {
  // 查询支付状态
  getStatus: async (tradeNo) => {
    const response = await api.get(`/payment/status/${tradeNo}`);
    return response.data;
  },
  // 支付历史
  getHistory: async (params = {}) => {
    const response = await api.get('/payment/history', { params });
    return response.data;
  },
};

// ============================================================
// v8 新增：资料库 API
// ============================================================
export const resourcesAPI = {
  // 获取资料列表
  list: async (params = {}) => {
    const response = await api.get('/resources/', { params });
    return response.data;
  },
  // 获取资料详情
  get: async (resourceId) => {
    const response = await api.get(`/resources/${resourceId}`);
    return response.data;
  },
  // 下载资料
  download: async (resourceId) => {
    const response = await api.get(`/resources/${resourceId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
  // 上传资料（管理员）
  upload: async (formData) => {
    const response = await api.post('/resources/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  // 删除资料（管理员）
  delete: async (resourceId) => {
    const response = await api.delete(`/resources/${resourceId}`);
    return response.data;
  },
};

// ============================================================
// v8 新增：AI 客服 API
// ============================================================
export const chatAPI = {
  // 发送消息
  sendMessage: async (message, sessionId = null) => {
    const response = await api.post('/chat/message', {
      message,
      session_id: sessionId,
    });
    return response.data;
  },
  // 获取会话列表
  getSessions: async () => {
    const response = await api.get('/chat/sessions');
    return response.data;
  },
  // 获取会话消息
  getMessages: async (sessionId) => {
    const response = await api.get(`/chat/sessions/${sessionId}/messages`);
    return response.data;
  },
  // 关闭会话
  closeSession: async (sessionId) => {
    const response = await api.post(`/chat/sessions/${sessionId}/close`);
    return response.data;
  },
};
   // ============ Training API ============
const trainingAPI = {
  // 课程列表
  getCourses: async (category = '') => {
    const params = category ? `?category=${category}` : '';
    const response = await api.get(`/training/courses${params}`);
    return response.data;
  },

  // 课程详情
  getCourseDetail: async (courseId) => {
    const response = await api.get(`/training/courses/${courseId}`);
    return response.data;
  },

  // 报名课程
  enrollCourse: async (courseId) => {
    const response = await api.post(`/training/courses/${courseId}/enroll`);
    return response.data;
  },

  // 获取课时内容
  getLesson: async (lessonId) => {
    const response = await api.get(`/training/lessons/${lessonId}`);
    return response.data;
  },

  // 标记课时完成
  completeLesson: async (lessonId) => {
    const response = await api.post(`/training/lessons/${lessonId}/complete`);
    return response.data;
  },

  // 课程进度
  getCourseProgress: async (courseId) => {
    const response = await api.get(`/training/courses/${courseId}/progress`);
    return response.data;
  },

  // 获取考试题目
  getExamQuestions: async (courseId) => {
    const response = await api.get(`/training/courses/${courseId}/exam`);
    return response.data;
  },

  // 提交考试
  submitExam: async (courseId, answers) => {
    const response = await api.post(`/training/courses/${courseId}/exam`, { answers });
    return response.data;
  },

  // 考试记录
  getExams: async () => {
    const response = await api.get('/training/exams');
    return response.data;
  },

  // 证书列表
  getCertificates: async () => {
    const response = await api.get('/training/certificates');
    return response.data;
  },

  // 证书详情
  getCertificate: async (certId) => {
    const response = await api.get(`/training/certificates/${certId}`);
    return response.data;
  },

  // 验证证书（公开）
  verifyCertificate: async (certNumber) => {
    const response = await api.get(`/training/certificates/verify/${certNumber}`);
    return response.data;
  },

  // ---- 管理员 ----
  admin: {
    createCourse: async (data) => {
      const response = await api.post('/training/admin/courses', data);
      return response.data;
    },
    updateCourse: async (courseId, data) => {
      const response = await api.put(`/training/admin/courses/${courseId}`, data);
      return response.data;
    },
    createLesson: async (data) => {
      const response = await api.post('/training/admin/lessons', data);
      return response.data;
    },
    updateLesson: async (lessonId, data) => {
      const response = await api.put(`/training/admin/lessons/${lessonId}`, data);
      return response.data;
    },
    createQuestion: async (data) => {
      const response = await api.post('/training/admin/questions', data);
      return response.data;
    },
    getQuestions: async (moduleCode) => {
      const response = await api.get(`/training/admin/questions/${moduleCode}`);
      return response.data;
    },
    deleteQuestion: async (questionId) => {
      const response = await api.delete(`/training/admin/questions/${questionId}`);
      return response.data;
    },
    getStats: async () => {
      const response = await api.get('/training/admin/stats');
      return response.data;
    }
  }
};

export default api;
export { trainingAPI };
