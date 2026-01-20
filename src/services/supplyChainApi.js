import api from './api';

export const supplyChainAPI = {
  // 获取任务模板列表
  getTaskTemplates: async () => {
    const response = await api.get('/supply-chain/task-templates');
    return response.data;
  },

  // 获取单个任务模板详情
  getTaskTemplate: async (templateId) => {
    const response = await api.get(`/supply-chain/task-templates/${templateId}`);
    return response.data;
  },

  // 获取认证类型列表
  getCertifications: async () => {
    const response = await api.get('/supply-chain/certifications');
    return response.data;
  },

  // 创建供应链审查案件
  createReview: async (reviewData) => {
    const response = await api.post('/supply-chain/reviews', reviewData);
    return response.data;
  },

  // 获取审查案件列表
  listReviews: async (params = {}) => {
    const response = await api.get('/supply-chain/reviews', { params });
    return response.data;
  },

  // 获取单个审查案件详情
  getReview: async (reviewId) => {
    const response = await api.get(`/supply-chain/reviews/${reviewId}`);
    return response.data;
  },

  // 上传文件到审查案件
  uploadFile: async (reviewId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/supply-chain/reviews/${reviewId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // 删除审查案件中的文件
  deleteFile: async (reviewId, fileId) => {
    const response = await api.delete(`/supply-chain/reviews/${reviewId}/files/${fileId}`);
    return response.data;
  },

  // 获取系统提示词预览
  getPromptPreview: async (reviewId) => {
    const response = await api.get(`/supply-chain/reviews/${reviewId}/prompt`);
    return response.data;
  },

  // 执行供应链审查
  processReview: async (reviewId) => {
    const response = await api.post(`/supply-chain/reviews/${reviewId}/process`);
    return response.data;
  },

  // 获取审查报告
  getReport: async (reviewId) => {
    const response = await api.get(`/supply-chain/reviews/${reviewId}/report`);
    return response.data;
  },

  // 下载审查报告
  downloadReport: async (reviewId) => {
    const response = await api.get(`/supply-chain/reviews/${reviewId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // 删除审查案件
  deleteReview: async (reviewId) => {
    const response = await api.delete(`/supply-chain/reviews/${reviewId}`);
    return response.data;
  },
};

export default supplyChainAPI;
