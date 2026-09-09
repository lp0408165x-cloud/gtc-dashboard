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

  // ---- Step 2a：工具结果写入脊柱 ----

  // 影子案件（不存在则由后端创建）：{ shipment_id, shipment_no, case_id, case_type, company_id }
  // 文件上传 / 预处理 / 抽取全部复用案件链路，用这个 case_id
  getCase: async (id) => {
    const response = await api.get(`/shipments/${id}/case`);
    return response.data;
  },

  // 登记单证：{ file_id, doc_type } → shipment_documents
  addDocument: async (id, body) => {
    const response = await api.post(`/shipments/${id}/documents`, body);
    return response.data;
  },

  // 跑单证核查：报告照旧写 cross_check_reports，同时写一条 tool_results
  // 返回 { tool_result_id, case_id, shipment_status, conclusion_code, report }
  // 注意：report 不含 inconsistencies，明细需另取 /cases/{case_id}/cross-check/report
  runCrossCheck: async (id) => {
    const response = await api.post(`/shipments/${id}/tools/cross-check/run`);
    return response.data;
  },

  // 下载核查报告（双语 Word），返回 blob。
  // 仅已解锁（订阅生效）或 gtc 运营可调；未解锁后端返回 402/403，前端按 detail 提示。
  downloadCrossCheckReport: async (id) => {
    const response = await api.get(`/shipments/${id}/tools/cross-check/report`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // 通用工具结果写入：{ tool_name, conclusion_code?, result?, run_id? }
  // 货件处于 docs_uploaded 时后端会自动流转到 tools_run
  addToolResult: async (id, body) => {
    const response = await api.post(`/shipments/${id}/tool-results`, body);
    return response.data;
  },
};

export default shipmentsAPI;
