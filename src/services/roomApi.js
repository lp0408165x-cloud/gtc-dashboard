// 案件室：登录、本人信息、案件室内容与上传
// 登录相关接口不需要 token；其余需要。
import api from './api';
import { detailText } from '../utils/apiError';

export const roomAPI = {
  // 打开专属链接：校验链接，拿到脱敏邮箱与案件名
  inviteInfo: (token) => api.get(`/room/invite/${token}`).then((r) => r.data),
  // 向邀请邮箱发验证码
  inviteSendCode: (token) => api.post(`/room/invite/${token}/send-code`).then((r) => r.data),
  // 已加入的成员：按邮箱要验证码
  requestCode: (email) => api.post('/room/login/request-code', { email }).then((r) => r.data),
  // 核对验证码（首次经邀请时带 inviteToken）
  verify: (email, code, inviteToken = null) =>
    api.post('/room/login/verify', { email, code, invite_token: inviteToken }).then((r) => r.data),
  // 当前账号加入的案件
  me: () => api.get('/room/me').then((r) => r.data),

  // 案件室首页：案件头、待您提供、已提交
  caseRoom: (caseId) => api.get(`/room/cases/${caseId}`).then((r) => r.data),
  // 上传一个文件到任务；onProgress(0–100)
  upload: (caseId, taskId, file, onProgress) => {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return api.post(`/room/cases/${caseId}/tasks/${taskId}/files`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
      },
    }).then((r) => r.data);
  },
  // 本人文件的签名链接
  fileLink: (fileId, download = false) =>
    api.get(`/room/files/${fileId}/link`, { params: download ? { download: true } : {} }).then((r) => r.data.url),
};

// 后端错误 → 可显示的文字（字符串、422 数组、{message} 对象都能处理）
export const errorText = (err, fallback = '操作失败，请稍后重试') =>
  detailText(err?.response?.data?.detail, fallback);

// 微信内置浏览器
export const isWeChat = () => /MicroMessenger/i.test(navigator.userAgent || '');
