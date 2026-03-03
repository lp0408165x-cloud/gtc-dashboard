import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { casesAPI } from '../services/api';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  CheckCircle,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';

const NewCasePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    detention_reason: '',
    cbp_case_number: '',
    cbp_deadline: '',
    notes: '',
    estimated_value: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (!formData.title.trim()) {
      setError('请填写案件标题');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);
    try {
      const caseData = {
        ...formData,
        estimated_value: formData.estimated_value
          ? parseFloat(formData.estimated_value)
          : null,
      };
      const newCase = await casesAPI.create(caseData);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/cases/${newCase.id}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || '创建案件失败，请稍后重试');
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
            案件创建成功！
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
            <h2 className="text-lg font-display font-bold text-gtc-navy mb-6">
              基本信息
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                案件标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
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
                name="detention_reason"
                value={formData.detention_reason}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  报关号 (Entry #)
                </label>
                <input
                  type="text"
                  name="cbp_case_number"
                  value={formData.cbp_case_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                  placeholder="例如：XXX-XXXXXXX-X"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CBP 截止日期
                </label>
                <input
                  type="date"
                  name="cbp_deadline"
                  value={formData.cbp_deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                报关货值 (USD)
              </label>
              <input
                type="number"
                name="estimated_value"
                value={formData.estimated_value}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                placeholder="例如：50000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                案情简介
              </label>
              <textarea
                name="notes"
                value={formData.notes}
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
              <Row label="案件标题" value={formData.title} required />
              <Row
                label="案件类型"
                value={
                  formData.detention_reason
                    ? caseTypeLabel[formData.detention_reason]
                    : '—'
                }
              />
              <Row
                label="报关号 (Entry #)"
                value={formData.cbp_case_number || '—'}
              />
              <Row
                label="CBP 截止日期"
                value={formData.cbp_deadline || '—'}
              />
              <Row
                label="报关货值"
                value={
                  formData.estimated_value
                    ? `USD ${Number(formData.estimated_value).toLocaleString()}`
                    : '—'
                }
              />
              <Row
                label="案情简介"
                value={formData.notes || '—'}
                multiline
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
              创建后可在案件工作区继续填写：产品信息、供应商信息、上传文件、AI 分析等。
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
                  确认创建
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
