// ============================================================
// 后端 422 校验错误 → 中文提示
//
// FastAPI 的 422 返回 detail 数组：[{type, loc, msg, input, ctx}, ...]。
// 页面普遍写 setError(err.response?.data?.detail)，数组直接渲染会让 React 整页崩（#31）。
// api.js 的响应拦截器在这里把数组换成一段「字段名：原因」的字符串，页面代码不用改。
// ============================================================

const FIELD_LABELS = {
  case_title: '案件标题',
  case_type: '案件类型',
  case_number: '案件编号',
  cbp_deadline: 'CBP 截止日期',
  declared_value: '申报货值',
  product_description: '产品描述',
  port_of_entry: '入境口岸',
  hts_code: 'HTS 编码',
  seizure_number: '扣押编号',
  law_basis: '法律依据',
  status: '状态',
  email: '邮箱',
  password: '密码',
  old_password: '原密码',
  new_password: '新密码',
  full_name: '姓名',
  company_name: '公司名称',
  phone: '电话',
  code: '验证码',
  member_role: '成员身份',
  display_name: '称呼',
  title: '标题',
  due_at: '截止日期',
  file: '文件',
};

// 按 pydantic v2 的错误类型给中文原因；没列到的用后端原文
const TYPE_REASONS = {
  missing: '必填',
  string_type: '需要文字',
  int_parsing: '需要整数',
  int_type: '需要整数',
  float_parsing: '需要数字',
  float_type: '需要数字',
  decimal_parsing: '需要数字',
  bool_parsing: '需要是或否',
  date_parsing: '日期格式不正确',
  date_from_datetime_parsing: '日期格式不正确',
  datetime_parsing: '日期时间格式不正确',
  datetime_from_date_parsing: '日期格式不正确',
  string_too_short: '内容太短',
  string_too_long: '内容太长',
  string_pattern_mismatch: '格式不正确',
  value_error: null,           // 自定义校验，用后端给的原因
  enum: '取值不在允许范围内',
  literal_error: '取值不在允许范围内',
  greater_than: '数值太小',
  greater_than_equal: '数值太小',
  less_than: '数值太大',
  less_than_equal: '数值太大',
  json_invalid: '请求格式不正确',
  uuid_parsing: '编号格式不正确',
  url_parsing: '链接格式不正确',
};

function fieldName(loc) {
  // loc 形如 ["body", "cbp_deadline"] / ["query", "limit"] / ["body", "items", 0, "name"]
  const parts = (Array.isArray(loc) ? loc : [loc]).filter(
    (p) => !['body', 'query', 'path', 'header', 'cookie'].includes(p)
  );
  if (!parts.length) return '';
  const key = [...parts].reverse().find((p) => typeof p === 'string') ?? String(parts[0]);
  return FIELD_LABELS[key] || key;
}

function reason(item) {
  const mapped = TYPE_REASONS[item?.type];
  if (mapped) return mapped;
  const msg = String(item?.msg || '格式不正确');
  return msg.replace(/^Value error,\s*/i, '');
}

export function formatValidationDetail(detail) {
  if (!Array.isArray(detail)) return typeof detail === 'string' ? detail : '';
  const lines = detail.map((item) => {
    const f = fieldName(item?.loc);
    return f ? `${f}：${reason(item)}` : reason(item);
  });
  return [...new Set(lines)].join('；') || '提交的内容有误，请检查后重试';
}

export const UPLOAD_FAILED = '文件上传失败，请重试或联系我们';

/** 把后端 detail（字符串 / 422 数组 / {error, message} 对象）转成可以直接显示的文字 */
export function detailText(detail, fallback) {
  if (typeof detail === 'string' && detail) return detail;
  if (Array.isArray(detail)) return formatValidationDetail(detail);
  if (detail && typeof detail.message === 'string' && detail.message) return detail.message;
  return fallback;
}
