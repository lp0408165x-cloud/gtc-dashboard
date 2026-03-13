import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, Save, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://gtc-ai-platform.onrender.com';

const INITIAL = {
  ior_name: '', seizure_number: '', notice_date: '', declared_value: '',
  port: '', hts_code: '', goods_description: '', violation_statute: '',
  payment_status: '', cbp_history: '', value_change_desc: '',
  ownership_issue: '', timeline_raw: '', extra_notes: '',
};

function Field({ label, required, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
    />
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-white"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function SectionHeader({ letter, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-white text-xs font-bold">{letter}</span>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

export default function NewSeizureCasePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  const token = localStorage.getItem('gtc_token');

  const handleSubmit = async () => {
    if (!form.ior_name || !form.notice_date) {
      setError('请填写必填字段：进口商名称 和 收到通知日期');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/seizure-cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || '提交失败');
      }
      const data = await res.json();
      navigate(`/cases/seizure/${data.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/cases/seizure')} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">新建罚没应对案件</h1>
            </div>
            <p className="text-sm text-gray-500 mt-0.5 ml-9">填写案件基本信息，提交后 AI 自动生成分析报告</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? '提交中...' : '提交并生成分析'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="col-span-2 space-y-5">
          {/* A. Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <SectionHeader letter="A" title="基本信息" subtitle="案件核心识别信息" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="进口商名称" required>
                <Input value={form.ior_name} onChange={set('ior_name')} placeholder="Importer of Record 名称" />
              </Field>
              <Field label="CBP 案件编号">
                <Input value={form.seizure_number} onChange={set('seizure_number')} placeholder="Seizure / FP&F 编号" />
              </Field>
              <Field label="收到通知日期" required>
                <Input type="date" value={form.notice_date} onChange={set('notice_date')} />
              </Field>
              <Field label="申报货值 (USD)">
                <Input type="number" value={form.declared_value} onChange={set('declared_value')} placeholder="0.00" />
              </Field>
              <Field label="进口口岸">
                <Input value={form.port} onChange={set('port')} placeholder="如 Los Angeles, JFK" />
              </Field>
              <Field label="HTS 归类编码">
                <Input value={form.hts_code} onChange={set('hts_code')} placeholder="如 6109.10.00" />
              </Field>
              <div className="col-span-2">
                <Field label="货物品类描述">
                  <Input value={form.goods_description} onChange={set('goods_description')} placeholder="货物具体描述" />
                </Field>
              </div>
            </div>
          </div>

          {/* B. Violation */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <SectionHeader letter="B" title="违规情况" subtitle="CBP 指控的违规事项" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="CBP 引用法条" hint="如 19 USC §1592">
                <Input value={form.violation_statute} onChange={set('violation_statute')} placeholder="19 USC §1592" />
              </Field>
              <Field label="货款支付状态">
                <Select
                  value={form.payment_status}
                  onChange={set('payment_status')}
                  placeholder="选择状态"
                  options={[
                    { value: 'paid_documented', label: '已支付有凭证' },
                    { value: 'paid_no_docs', label: '已支付无凭证' },
                    { value: 'unpaid', label: '未支付' },
                    { value: 'unknown', label: '不清楚' },
                  ]}
                />
              </Field>
              <Field label="CBP 违规历史">
                <Select
                  value={form.cbp_history}
                  onChange={set('cbp_history')}
                  placeholder="选择历史记录"
                  options={[
                    { value: 'none', label: '无记录首次' },
                    { value: 'minor', label: '有过小额罚款' },
                    { value: 'unknown', label: '不清楚' },
                  ]}
                />
              </Field>
              <div></div>
              <div className="col-span-2">
                <Field label="货值是否变更及原因">
                  <Textarea value={form.value_change_desc} onChange={set('value_change_desc')} placeholder="说明货值变更情况，或填写「无变更」" />
                </Field>
              </div>
              <div className="col-span-2">
                <Field label="货权关系说明">
                  <Textarea value={form.ownership_issue} onChange={set('ownership_issue')} placeholder="说明进口商与货主关系，是否存在第三方等" />
                </Field>
              </div>
            </div>
          </div>

          {/* C. Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <SectionHeader letter="C" title="事件经过" subtitle="可直接粘贴聊天记录或邮件内容" />
            <Field label="时间线描述">
              <Textarea
                value={form.timeline_raw}
                onChange={set('timeline_raw')}
                placeholder="描述事件经过，包括何时下单、何时发货、何时被扣押、与海关的沟通经过等..."
                rows={5}
              />
            </Field>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* D. Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <SectionHeader letter="D" title="其他补充" subtitle="其他相关信息" />
            <Field label="补充信息">
              <Textarea
                value={form.extra_notes}
                onChange={set('extra_notes')}
                placeholder="任何其他有助于分析的信息..."
                rows={4}
              />
            </Field>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-100 p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-red-800">提交前注意</p>
            </div>
            <ul className="text-xs text-red-700 space-y-1.5">
              <li>• CBP Seizure 通知后 <strong>30天内</strong> 必须回应</li>
              <li>• FP&amp;F 案件可申请 Petition 减轻处罚</li>
              <li>• 提交后 AI 自动生成分析，约需 30 秒</li>
              <li>• 货款支付凭证是关键证据，尽早收集</li>
            </ul>
          </div>

          {/* Deadline Calculator */}
          {form.notice_date && (() => {
            const days = Math.ceil((new Date(new Date(form.notice_date).getTime() + 30 * 86400000) - new Date()) / 86400000);
            return (
              <div className={`rounded-xl border p-4 ${days <= 7 ? 'bg-red-50 border-red-200' : days <= 14 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                <p className="text-xs font-medium text-gray-600 mb-1">回复截止倒计时</p>
                <p className={`text-3xl font-bold ${days <= 7 ? 'text-red-600' : days <= 14 ? 'text-amber-600' : 'text-green-600'}`}>
                  {days > 0 ? `${days} 天` : '已过期'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  截止日期：{new Date(new Date(form.notice_date).getTime() + 30 * 86400000).toLocaleDateString('zh-CN')}
                </p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
