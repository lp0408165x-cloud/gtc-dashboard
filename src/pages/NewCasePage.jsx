import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { casesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isInternal } from '../utils/roles';
import { NoticeUploadCard, FieldNote, DerivedDeadlineConfirm } from '../components/NoticeIntake';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  CheckCircle,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';

// CBP 联系人：表单里拆成五个输入框，提交时合成 cbp_contact
const CONTACT_FIELDS = [
  ['name', '姓名'], ['title', '职位'], ['office', '所属办公室'], ['phone', '电话'], ['email', '邮箱'],
];
const contactOf = (fd) => Object.fromEntries(CONTACT_FIELDS.map(([k]) => [k, (fd[`contact_${k}`] || '').trim() || null]));
const contactText = (c) => CONTACT_FIELDS.map(([k]) => c?.[k]).filter(Boolean).join(' · ');

const NewCasePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const internal = isInternal(user);                  // 通知进件只对内部角色开放
  const [intake, setIntake] = useState(null);         // 后端返回的进件结果
  const [suggested, setSuggested] = useState(null);   // 回填时的值（判断「已手动修改」）
  const [deadlineConfirmed, setDeadlineConfirmed] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    case_title: '',
    case_type: '',
    case_number: '',
    cbp_deadline: '',
    product_description: '',
    declared_value: '',
    port_of_entry: '',
    hts_code: '',
    notice_date: '',
    ...Object.fromEntries(CONTACT_FIELDS.map(([k]) => [`contact_${k}`, ''])),
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 通知读取结果回填：只填读出来的字段，读不出的保留专家已填的内容
  const applyIntake = (res) => {
    setIntake(res);
    setDeadlineConfirmed(false);
    setError('');
    if (!res.form) { setSuggested(null); return; }
    const f = res.form;
    const next = { ...formData };
    for (const k of ['case_title', 'case_type', 'case_number', 'port_of_entry', 'hts_code', 'notice_date', 'cbp_deadline']) {
      if (f[k]) next[k] = f[k];
    }
    for (const [k] of CONTACT_FIELDS) {
      if (f.cbp_contact?.[k]) next[`contact_${k}`] = f.cbp_contact[k];
    }
    setFormData(next);
    setSuggested({ ...f, cbp_contact: contactOf(next) });
  };
  const clearIntake = () => { setIntake(null); setSuggested(null); setDeadlineConfirmed(false); };

  const fields = intake?.fields || null;
  const rd = fields?.reply_deadline;
  // 推算的回复期限：日期没被专家改过时，要勾选确认
  const derivedActive = Boolean(rd?.derived && rd.value && formData.cbp_deadline === rd.value);
  const note = (formKey, fieldKey, extra = {}) =>
    fields ? <FieldNote field={fields[fieldKey]} suggested={suggested?.[formKey]} current={formData[formKey]} {...extra} /> : null;

  const handleNext = () => {
    if (!formData.case_title.trim()) {
      setError('请填写案件标题');
      return;
    }
    if (derivedActive && !deadlineConfirmed) {
      setError('回复期限是按通知原文推算的，请核对后勾选确认');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);
    try {
      // 没填的字段发 null，不发 ""（"" 在日期、数字字段上会校验失败）
      const caseData = Object.fromEntries(
        Object.entries(formData)
          .filter(([k]) => !k.startsWith('contact_'))
          .map(([k, v]) => [k, typeof v === 'string' && !v.trim() ? null : v])
      );
      if (caseData.declared_value != null) caseData.declared_value = parseFloat(caseData.declared_value);
      const contact = contactOf(formData);
      caseData.cbp_contact = Object.values(contact).some(Boolean) ? contact : null;
      if (intake) {
        caseData.notice_intake_id = intake.intake_id;
        caseData.cbp_deadline_confirmed = derivedActive && deadlineConfirmed;
      }
      const newCase = await casesAPI.create(caseData);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/cases/${newCase.id}?tab=files`);
      }, 1500);
    } catch (err) {
      const detail = err.response?.data?.detail;
      // 订阅/用量检查返回的是对象 {error, message}，只取文字，不能直接渲染对象
      setError((typeof detail === 'string' && detail) || detail?.message || '创建案件失败，请稍后重试');
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const caseTypeLabel = {
    'CF-28': 'CF-28 信息请求',
    'CF-29': 'CF-29 行动通知',
    UFLPA: 'UFLPA 强迫劳动扣押',
    WRO: 'WRO 暂扣令',
    'AD/CVD': '反倾销/反补贴',
    'Section 301': '301条款',
    Seizure: '扣押/没收',
    Other: '其他',
  };

  const steps = [
    { number: 1, title: '基本信息', icon: FileText },
    { number: 2, title: '确认提交', icon: ClipboardList },
  ];

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gtc-navy mb-2">
            {intake ? '立案成功！' : '案件创建成功！'}
          </h2>
          <p className="text-gray-500 mb-6">正在跳转到案件详情页面...</p>
          <div className="w-8 h-8 border-2 border-gtc-gold/30 border-t-gtc-gold rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gtc-navy mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>
        <h1 className="text-2xl font-display font-bold text-gtc-navy">新建案件</h1>
        <p className="text-gray-500">填写海关查扣案件基本信息</p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div
                className={`flex items-center gap-3 ${
                  step >= s.number ? 'text-gtc-navy' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    step >= s.number
                      ? 'bg-gtc-gold text-gtc-navy'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="font-medium hidden sm:block">{s.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-24 sm:w-48 h-1 mx-4 rounded ${
                    step > s.number ? 'bg-gtc-gold' : 'bg-gray-200'
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Step 1: 基本信息 */}
        {step === 1 && (
          <div className="space-y-6">
            {internal && <NoticeUploadCard intake={intake} onResult={applyIntake} onClear={clearIntake} />}
            <h2 className="text-lg font-display font-bold text-gtc-navy mb-6">
              基本信息
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                案件标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="case_title"
                value={formData.case_title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                placeholder="例如：XX公司太阳能电池板查扣案件"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                案件类型
              </label>
              <select
                name="case_type"
                value={formData.case_type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
              >
                <option value="">请选择案件类型</option>
                <option value="CF-28">CF-28 信息请求</option>
                <option value="CF-29">CF-29 行动通知</option>
                <option value="UFLPA">UFLPA 强迫劳动扣押</option>
                <option value="WRO">WRO 暂扣令</option>
                <option value="AD/CVD">反倾销/反补贴</option>
                <option value="Section 301">301条款</option>
                <option value="Seizure">扣押/没收</option>
                <option value="Other">其他</option>
              </select>
              {note('case_type', 'case_type')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  报关号 (Entry #)
                </label>
                <input
                  type="text"
                  name="case_number"
                  value={formData.case_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                  placeholder="例如：XXX-XXXXXXX-X"
                />
                {note('case_number', 'entry_number')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CBP 截止日期（回复期限）
                </label>
                <input
                  type="date"
                  name="cbp_deadline"
                  value={formData.cbp_deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                />
                {note('cbp_deadline', 'reply_deadline', { derived: derivedActive })}
                {derivedActive && (
                  <DerivedDeadlineConfirm basis={rd.basis} confirmed={deadlineConfirmed} onChange={setDeadlineConfirmed} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  报关货值 (USD)
                </label>
                <input
                  type="number"
                  name="declared_value"
                  value={formData.declared_value}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                  placeholder="例如：50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  口岸 (Port of Entry)
                </label>
                <input
                  type="text"
                  name="port_of_entry"
                  value={formData.port_of_entry}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                  placeholder="例如：Los Angeles, CA"
                />
                {note('port_of_entry', 'port')}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTS编码
              </label>
              <input
                type="text"
                name="hts_code"
                value={formData.hts_code}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                placeholder="例如：8541.40.6020"
              />
              {note('hts_code', 'hts_code')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  通知日期
                </label>
                <input
                  type="date"
                  name="notice_date"
                  value={formData.notice_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                />
                {note('notice_date', 'notice_date')}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CBP 联系人
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CONTACT_FIELDS.map(([k, label]) => (
                  <input
                    key={k}
                    type={k === 'email' ? 'email' : 'text'}
                    name={`contact_${k}`}
                    value={formData[`contact_${k}`]}
                    onChange={handleChange}
                    aria-label={`CBP 联系人${label}`}
                    placeholder={label}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                  />
                ))}
              </div>
              {fields && (
                <FieldNote field={fields.cbp_contact} suggested={contactText(suggested?.cbp_contact)}
                           current={contactText(contactOf(formData))} />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                案情简介
              </label>
              <textarea
                name="product_description"
                value={formData.product_description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all resize-none"
                placeholder="简要描述案件背景、查扣情况及已知信息..."
              />
            </div>
          </div>
        )}

        {/* Step 2: 确认提交 */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-display font-bold text-gtc-navy mb-2">
              确认案件信息
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              请确认以下信息无误后提交。产品、供应商等详细信息可在案件工作区继续补充。
            </p>

            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <Row label="案件标题" value={formData.case_title} required />
              <Row
                label="案件类型"
                value={formData.case_type ? caseTypeLabel[formData.case_type] : '—'}
              />
              <Row label="报关号 (Entry #)" value={formData.case_number || '—'} />
              <Row
                label="CBP 截止日期（回复期限）"
                value={formData.cbp_deadline ? `${formData.cbp_deadline}${derivedActive ? '（按通知原文推算，已确认）' : ''}` : '—'}
              />
              <Row label="通知日期" value={formData.notice_date || '—'} />
              <Row label="CBP 联系人" value={contactText(contactOf(formData)) || '—'} />
              <Row
                label="报关货值"
                value={
                  formData.declared_value
                    ? `USD ${Number(formData.declared_value).toLocaleString()}`
                    : '—'
                }
              />
              <Row label="口岸" value={formData.port_of_entry || '—'} />
              <Row label="HTS编码" value={formData.hts_code || '—'} />
              <Row label="案情简介" value={formData.product_description || '—'} multiline />
              {intake && <Row label="原通知" value={`${intake.file.name}（立案后存为案件第一份文件）`} />}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
              创建后可在案件工作区继续填写：产品信息、供应商信息、上传文件、案件分析等。
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gtc-navy transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回修改
            </button>
          ) : (
            <div></div>
          )}

          {step === 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 bg-gtc-navy text-white px-6 py-3 rounded-xl font-medium hover:bg-gtc-blue transition-colors"
            >
              下一步：确认信息
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 bg-gtc-gold text-gtc-navy px-8 py-3 rounded-xl font-medium hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gtc-navy/30 border-t-gtc-navy rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {intake ? '立案' : '确认创建'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// 确认页小组件
const Row = ({ label, value, required, multiline }) => (
  <div className={`flex ${multiline ? 'flex-col gap-1' : 'items-start justify-between'}`}>
    <span className="text-sm text-gray-500 min-w-[120px]">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </span>
    <span
      className={`text-sm font-medium text-gtc-navy ${
        multiline ? 'whitespace-pre-wrap' : 'text-right max-w-xs'
      }`}
    >
      {value}
    </span>
  </div>
);

export default NewCasePage;
