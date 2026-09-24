// 案件室：登录与本人信息
// 登录相关接口不需要 token；/room/me 需要。
import api from './api';

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
};

// 后端错误 detail 可能是字符串或校验错误数组
export const errorText = (err, fallback = '操作失败，请稍后重试') => {
  const d = err?.response?.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((e) => e.msg).filter(Boolean).join('；') || fallback;
  return fallback;
};
