import { useState } from 'react';
import { casesAPI } from '../services/api';
import { Edit3, Save, X, Loader2, FileText, MapPin, Package } from 'lucide-react';

const CASE_TYPES = ['CF-28', 'CF-29', 'UFLPA', 'WRO', 'Detention', 'Seizure', 'AD/CVD', 'Section 301', 'Other'];
const PORTS = ['LA', 'CA', 'NY', 'NJ', 'TX', 'WA', 'FL', 'GA', 'IL', 'Other'];

const CaseInfoEditor = ({ caseData, onSaved }) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const startEdit = () => {
    setForm({
      case_title: caseData.case_title || '',
      case_type: caseData.case_type || '',
      case_number: caseData.case_number || caseData.seizure_number || '',
      cbp_deadline: caseData.cbp_deadline ? new Date(caseData.cbp_deadline).toISOString().split('T')[0] : '',
      declared_value: caseData.declared_value || '',
      port_of_entry: caseData.port_of_entry || '',
      hts_code: caseData.hts_code || '',
      law_basis: caseData.law_basis || '',
      product_description: caseData.product_description || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.declared_value) payload.declared_value = parseFloat(payload.declared_value);
      if (payload.cbp_deadline === '') payload.cbp_deadline = null;
      const updated = await casesAPI.update(caseData.id, payload);
      onSaved(updated);
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.detail || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const f = (key) => ({
    value: form[key] ?? '',
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={startEdit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gtc-gold text-gtc-navy text-sm font-medium hover:bg-amber-400 transition-colors"
          >
            <Edit3 className="w-4 h-4" /> 编辑案件信息
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 基本信息 */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="font-medium text-gtc-navy flex items-center gap-2">
              <FileText className="w-4 h-4" /> 基本信息
            </h3>
            <p className="text-sm"><span className="text-gray-400">案件标题：</span>{caseData.case_title || '-'}</p>
            <p className="text-sm"><span className="text-gray-400">案件类型：</span>{caseData.case_type || '-'}</p>
            <p className="text-sm"><span className="text-gray-400">报关号 (Entry #)：</span>{caseData.case_number || caseData.seizure_number || '-'}</p>
            <p className="text-sm"><span className="text-gray-400">CBP截止日期：</span>
              {caseData.cbp_deadline
                ? <span className={`font-medium ${new Date(caseData.cbp_deadline) < new Date() ? 'text-red-600' : new Date(caseData.cbp_deadline) - new Date() < 7 * 86400000 ? 'text-amber-600' : 'text-gray-800'}`}>
                    {new Date(caseData.cbp_deadline).toLocaleDateString('zh-CN')}
                  </span>
                : '-'}
            </p>
            <p className="text-sm"><span className="text-gray-400">报关货值：</span>{caseData.declared_value ? `$${Number(caseData.declared_value).toLocaleString()}` : '-'}</p>
            <p className="text-sm"><span className="text-gray-400">创建时间：</span>{new Date(caseData.created_at).toLocaleString('zh-CN')}</p>
          </div>
          {/* 查扣详情 */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <h3 className="font-medium text-gtc-navy flex items-center gap-2">
              <MapPin className="w-4 h-4" /> 查扣详情
            </h3>
            <p className="text-sm"><span className="text-gray-400">口岸：</span>{caseData.port_of_entry || '-'}</p>
            <p className="text-sm"><span className="text-gray-400">HTS编码：</span>{caseData.hts_code || '-'}</p>
            <p className="text-sm"><span className="text-gray-400">法律依据：</span>{caseData.law_basis || '-'}</p>
          </div>
        </div>

        {caseData.product_description && (
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-medium text-gtc-navy mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" /> 案情简介
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{caseData.product_description}</p>
          </div>
        )}
      </div>
    );
  }

  // 编辑模式
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ✏️ 编辑模式 — 修改完成后点击保存
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            保存
          </button>
          <button
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm hover:bg-gray-300"
          >
            <X className="w-4 h-4" /> 取消
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 案件标题 */}
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">案件标题 *</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gtc-gold focus:border-transparent" {...f('case_title')} />
        </div>

        {/* 案件类型 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">案件类型</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gtc-gold focus:border-transparent" {...f('case_type')}>
            <option value="">-- 选择 --</option>
            {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* 报关号 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">报关号 (Entry #)</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gtc-gold focus:border-transparent" placeholder="如 NXU99948802" {...f('case_number')} />
        </div>

        {/* CBP截止日期 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">CBP截止日期</label>
          <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gtc-gold focus:border-transparent" {...f('cbp_deadline')} />
        </div>

        {/* 报关货值 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">报关货值 (USD)</label>
          <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gtc-gold focus:border-transparent" placeholder="0.00" {...f('declared_value')} />
        </div>

        {/* 口岸 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">口岸</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gtc-gold focus:border-transparent" placeholder="如 CA, NY, LA" {...f('port_of_entry')} />
        </div>

        {/* HTS编码 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">HTS编码</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gtc-gold focus:border-transparent" placeholder="如 6109.10.0012" {...f('hts_code')} />
        </div>

        {/* 法律依据 */}
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">法律依据</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gtc-gold focus:border-transparent" placeholder="如 19 USC 1307, UFLPA Section 3" {...f('law_basis')} />
        </div>

        {/* 案情简介 */}
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">案情简介</label>
          <textarea rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gtc-gold focus:border-transparent" placeholder="描述案件背景、海关质疑点、已知风险等..." {...f('product_description')} />
        </div>
      </div>
    </div>
  );
};

export default CaseInfoEditor;
