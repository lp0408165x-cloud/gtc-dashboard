// 1c.5 通知进件（仅内部角色）：上传 CBP 通知读取立案字段；立案走 casesAPI.create（带 notice_intake_id）
import api from './api';

export const NOTICE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.eml,application/pdf,image/jpeg,image/png,message/rfc822';
export const NOTICE_MAX_MB = 20;

export const noticeIntakeAPI = {
  // onProgress(0–100)：上传进度；传完后后端读取还要一会儿
  extract: (file, onProgress) => {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return api.post('/notice-intake/extract', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,
      onUploadProgress: (e) => { if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100)); },
    }).then((r) => r.data);
  },
  get: (id) => api.get(`/notice-intake/${id}`).then((r) => r.data),
  discard: (id) => api.post(`/notice-intake/${id}/discard`).then((r) => r.data),
  // 查看原通知走 openSignedLink（传这个路径）
  linkPath: (id, download = false) => `/notice-intake/${id}/link${download ? '?download=true' : ''}`,
};
