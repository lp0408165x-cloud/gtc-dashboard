import api from './api';

// GTC-C 货件脊柱（路线图 Step 1）
// 后端：backend/app/api/routes/shipments.py，挂在 /api/v1/shipments
// 权限与可用动作由后端决定：列表 / 详情每条记录带 available_actions，前端只按它渲染按钮。
export const shipmentsAPI = {
  // 登录后先调：{ user_id, company_id, company_name, tenant_type, capabilities[] }
  // tenant_type: gtc | exporter | ior | service_provider
  getContext: async () => {
    const response = await api.get('/shipments/context');
    return response.data;
  },

  // 按角色限定的货件列表：{ tenant_type, items[] }，可按 status 过滤
  list: async (status) => {
    const response = await api.get('/shipments/', {
      params: status ? { status } : undefined,
    });
    return response.data;
  },

  // 创建货件（exporter / gtc）：{ description?, incoterm?, declared_value?, currency?, exporter_company_id? }
  // exporter_company_id 仅 gtc 代出口商建单时使用
  create: async (body) => {
    const response = await api.post('/shipments/', body);
    return response.data;
  },

  // 详情：基本字段 + gate_decisions[] / assignments[] / entries[] / tool_results[]
  get: async (id) => {
    const response = await api.get(`/shipments/${id}`);
    return response.data;
  },

  // 状态流转：{ action, payload? }，成功返回更新后的货件；越权 / 状态不允许返回 400 { detail }
  // 需要 payload 的动作：
  //   gate_decide    { decision: pass|reject|review, gap_list?, reasons? }
  //   manual_review  { decision: pass|reject }
  //   assign_ior     { ior_company_id, reason? }
  //   ior_reject     { note? }
  //   file_entry     { entry_no, port_code, bond_ref? }
  transition: async (id, action, payload) => {
    const body = { action };
    if (payload !== undefined && payload !== null) body.payload = payload;
    const response = await api.post(`/shipments/${id}/transition`, body);
    return response.data;
  },

  // 留痕：[{ id, from_status, to_status, action, actor_user_id, actor_tenant_type, payload, created_at }]
  events: async (id) => {
    const response = await api.get(`/shipments/${id}/events`);
    return response.data;
  },
};

export default shipmentsAPI;
