// ==================== 用户管理 API ====================

import api from './api';

export const usersAPI = {
  // 获取用户列表
  list: async () => {
    const response = await api.get('/users/');
    return response.data;
  },

  // 邀请新员工
  invite: async (email, roleName, companyId = null) => {
    const response = await api.post('/users/invite', {
      email,
      role_name: roleName,
      company_id: companyId,
    });
    return response.data;
  },

  // 接受邀请（不需要登录）
  acceptInvite: async (token, password, fullName) => {
    const response = await api.post('/users/accept-invite', {
      token,
      password,
      full_name: fullName,
    });
    return response.data;
  },

  // 获取邀请列表
  listInvitations: async () => {
    const response = await api.get('/users/invitations');
    return response.data;
  },

  // 更新用户（启用/禁用/改角色）
  update: async (userId, data) => {
    const response = await api.patch(`/users/${userId}`, data);
    return response.data;
  },

  // 终止用户
  terminate: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },
};

export default usersAPI;
