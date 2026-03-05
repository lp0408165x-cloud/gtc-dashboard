import { useState, useEffect } from 'react';
import { Send, Plus, FileText, CheckCircle, Clock, AlertCircle, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react';

const SUBMISSION_METHODS = ['ACE系统', '邮件', '快递/邮寄', '传真', '其他'];
const SUBMISSION_STATUSES = [
  { value: 'submitted', label: '已提交', color: 'bg-blue-100 text-blue-700' },
  { value: 'acknowledged', label: 'CBP已确认', color: 'bg-purple-100 text-purple-700' },
  { value: 'pending_response', label: '等待回复', color: 'bg-amber-100 text-amber-700' },
  { value: 'responded', label: 'CBP已回复', color: 'bg-green-100 text-green-700' },
  { value: 'closed', label: '已结案', color: 'bg-gray-100 text-gray-700' },
];

const API_BASE = import.meta.env.VITE_API_URL || 'https://gtc-ai-platform.onrender.com';

const SubmissionLog = ({ caseId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({
    submitted_at: new Date().toISOString().split('T')[0],
    method: 'ACE系统',
    recipient: '',
    subject: '',
    files_submitted: '',
    notes: '',
    status: 'submitted',
    cbp_reference: '',
  });

  useEffect(() => { fetchSubmissions(); }, [caseId]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/cases/${caseId}/submissions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('gtc_token')}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      // 后端未实现时静默失败，使用本地状态
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.subject.trim()) { alert('请填写提交主题'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/cases/${caseId}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('gtc_token')}`,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newRecord = await res.json();
        setSubmissions([newRecord, ...submissions]);
      } else {
        // 后端未实现，本地记录
        const localRecord = {
          id: Date.now(),
          ...form,
          created_at: new Date().toISOString(),
          local: true,
        };
        setSubmissions([localRecord, ...submissions]);
      }
      setShowForm(false);
      setForm({
        submitted_at: new Date().toISOString().split('T')[0],
        method: 'ACE系统',
        recipient: '',
        subject: '',
        files_submitted: '',
        notes: '',
        status: 'submitted',
        cbp_reference: '',
      });
    } catch (err) {
      const localRecord = { id: Date.now(), ...form, created_at: new Date().toISOString(), local: true };
      setSubmissions([localRecord, ...submissions]);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (subId, newStatus) => {
    try {
      await fetch(`${API_BASE}/api/v1/cases/${caseId}/submissions/${subId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('gtc_token')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {}
    setSubmissions(submissions.map(s => s.id === subId ? { ...s, status: newStatus } : s));
  };

  const getStatusConfig = (status) =>
    SUBMISSION_STATUSES.find(s => s.value === status) || SUBMISSION_STATUSES[0];

  const f = (key) => ({
    value: form[key] ?? '',
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Send className="w-5 h-5 text-gtc-navy" />
          <h3 className="font-semibold text-gtc-navy">提交记录</h3>
          {submissions.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{submissions.length} 条</span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gtc-navy text-white text-sm hover:bg-gtc-blue"
        >
          <Plus className="w-4 h-4" /> 记录提交
        </button>
      </div>

      {/* 新增表单 */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-blue-800 text-sm">新增提交记录</h4>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-gray-400" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">提交日期 *</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" {...f('submitted_at')} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">提交方式</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" {...f('method')}>
                {SUBMISSION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">提交主题 *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="如 CF-28 Response – Entry NXU99948802" {...f('subject')} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">收件方（CBP联系人）</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="如 CBP Los Angeles / Officer Name" {...f('recipient')} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">CBP参考号</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="CBP回执号/ACE参考号" {...f('cbp_reference')} />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">状态</label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" {...f('status')}>
                {SUBMISSION_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">提交文件清单</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="如：Cover Letter, CI, BL, COO, Exhibit A-F" {...f('files_submitted')} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">备注</label>
              <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="补充说明、跟进事项..." {...f('notes')} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm hover:bg-gray-300">取消</button>
            <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              保存记录
            </button>
          </div>
        </div>
      )}

      {/* 记录列表 */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Send className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">暂无提交记录</p>
          <p className="text-xs mt-1">每次向CBP提交材料后，点击"记录提交"留存记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub, idx) => {
            const statusConfig = getStatusConfig(sub.status);
            const isExpanded = expandedId === sub.id;
            return (
              <div key={sub.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                >
                  {/* 序号 */}
                  <div className="w-7 h-7 rounded-full bg-gtc-navy/10 text-gtc-navy flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {submissions.length - idx}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{sub.subject}</p>
                    <p className="text-xs text-gray-500">
                      {sub.submitted_at} · {sub.method}
                      {sub.recipient && ` · ${sub.recipient}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={sub.status}
                      onChange={(e) => { e.stopPropagation(); updateStatus(sub.id, e.target.value); }}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${statusConfig.color}`}
                    >
                      {SUBMISSION_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-2 bg-gray-50 text-sm">
                    {sub.cbp_reference && <p><span className="text-gray-400">CBP参考号：</span>{sub.cbp_reference}</p>}
                    {sub.files_submitted && (
                      <div>
                        <p className="text-gray-400 mb-1">提交文件：</p>
                        <div className="flex flex-wrap gap-1.5">
                          {sub.files_submitted.split(',').map((f, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{f.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {sub.notes && <p><span className="text-gray-400">备注：</span>{sub.notes}</p>}
                    {sub.local && <p className="text-xs text-amber-600">⚠️ 本地记录（后端API未就绪）</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubmissionLog;
