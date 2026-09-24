// 案件室 · 专家侧（仅内部角色）：成员、任务、验收、文件
import api from './api';

// 只有日期的截止日按当天 12:00 UTC 存：美东、北京看到的是同一天（后端批量建任务同一规则）
export const dateToDue = (yyyyMmDd) => (yyyyMmDd ? `${yyyyMmDd}T12:00:00Z` : null);
export const dueToDate = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

export const caseRoomStaffAPI = {
  // 成员（1b 接口）
  members: (caseId, includeRevoked = false) =>
    api.get(`/cases/${caseId}/members`, { params: { include_revoked: includeRevoked } }).then((r) => r.data),
  invite: (caseId, body) => api.post(`/cases/${caseId}/invites`, body).then((r) => r.data),
  revoke: (caseId, memberId) => api.delete(`/cases/${caseId}/members/${memberId}`).then((r) => r.data),
  loginCode: (caseId, memberId) => api.post(`/cases/${caseId}/members/${memberId}/login-code`).then((r) => r.data),

  // 任务
  tasks: (caseId) => api.get(`/cases/${caseId}/tasks`).then((r) => r.data),
  createTask: (caseId, body) => api.post(`/cases/${caseId}/tasks`, body).then((r) => r.data),
  updateTask: (caseId, taskId, body) => api.patch(`/cases/${caseId}/tasks/${taskId}`, body).then((r) => r.data),
  reorder: (caseId, taskIds) => api.post(`/cases/${caseId}/tasks/reorder`, { task_ids: taskIds }).then((r) => r.data),
  bulk: (caseId, text, confirm, assigneeMemberId = null) =>
    api.post(`/cases/${caseId}/tasks/bulk`, { text, confirm, assignee_member_id: assigneeMemberId }).then((r) => r.data),
  accept: (caseId, taskId) => api.post(`/cases/${caseId}/tasks/${taskId}/accept`).then((r) => r.data),
  returnTask: (caseId, taskId, reason) =>
    api.post(`/cases/${caseId}/tasks/${taskId}/return`, { reason }).then((r) => r.data),

  // 文件：本案全部文件打包（带 token，所以走 axios 取 blob）
  zip: async (caseId) => {
    const r = await api.get(`/cases/${caseId}/files.zip`, { responseType: 'blob', timeout: 0 });
    const cd = r.headers['content-disposition'] || '';
    const m = cd.match(/filename\*=UTF-8''([^;]+)/i);
    return { blob: r.data, name: m ? decodeURIComponent(m[1]) : `案件_${caseId}_全部文件.zip` };
  },
};

// blob 请求失败时 data 是 Blob，先读成 JSON 再取 detail
export async function blobErrorText(err, fallback) {
  try {
    const data = err?.response?.data;
    if (data instanceof Blob) {
      const body = JSON.parse(await data.text());
      if (typeof body?.detail === 'string') return body.detail;
    }
  } catch { /* 忽略 */ }
  return fallback;
}
