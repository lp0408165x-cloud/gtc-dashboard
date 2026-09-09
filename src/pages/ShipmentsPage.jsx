import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Ship, Plus, RefreshCw, Loader2, X, AlertTriangle, Filter,
  ClipboardList, ShieldCheck, Users, FileText, Wrench, History,
  Upload, FileSearch, CheckCircle2, Play,
} from 'lucide-react';
import { shipmentsAPI } from '../services/shipmentsApi';
import { filesAPI, toolsAPI, quickCheckAPI } from '../services/api';

// ══════════════════════════════════════════════════════════
// 状态 / 动作字典（与 backend/app/services/shipment_state_machine.py 对齐）
// 权限不在前端判断：按钮只按后端返回的 available_actions 渲染
// ══════════════════════════════════════════════════════════
const STATUS_CONFIG = {
  created:       { label: '已创建',   cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  docs_uploaded: { label: '单证已传', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  tools_run:     { label: '工具已跑', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  gate_rejected: { label: '闸门拒绝', cls: 'bg-red-50 text-red-700 border-red-200' },
  gate_review:   { label: '待人工复核', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  gate_passed:   { label: '闸门通过', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ior_assigned:  { label: '已分配 IOR', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  entry_filed:   { label: '已报关',   cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  released:      { label: '已放行',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  post_audit:    { label: '事后审计', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  closed:        { label: '已关闭',   cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  case_opened:   { label: '已立案',   cls: 'bg-red-50 text-red-700 border-red-200' },
};

const ACTION_LABELS = {
  upload_docs: '单证上传', run_tools: '运行工具', gate_decide: '闸门判定', manual_review: '人工复核',
  resubmit: '补件重提', assign_ior: '分配IOR', ior_accept: '接受分配', ior_reject: '拒绝分配',
  file_entry: '报关', release: '放行', start_audit: '事后审计', close: '关闭', open_case: '立案',
};

// IOR 视图突出显示的四个动作
const IOR_PRIMARY_ACTIONS = ['ior_accept', 'ior_reject', 'file_entry', 'release'];

// 需要弹窗收集 payload 的动作；其余动作直接调用
// field.type: radio | text | number | textarea(lines → 数组)
const PAYLOAD_FORMS = {
  gate_decide: {
    title: '闸门判定',
    fields: [
      { key: 'decision', label: '判定结果', type: 'radio', required: true,
        options: [{ v: 'pass', l: '通过 pass' }, { v: 'reject', l: '拒绝 reject' }, { v: 'review', l: '转人工 review' }] },
      { key: 'gap_list', label: '缺口清单（每行一条）', type: 'lines', placeholder: '箱号不一致\n发票金额与装箱单不符' },
      { key: 'reasons', label: '判定理由（每行一条）', type: 'lines' },
    ],
    build: (v) => ({ decision: v.decision, gap_list: v.gap_list || [], reasons: v.reasons || [] }),
  },
  manual_review: {
    title: '人工复核',
    fields: [
      { key: 'decision', label: '复核结果', type: 'radio', required: true,
        options: [{ v: 'pass', l: '通过 pass' }, { v: 'reject', l: '拒绝 reject' }] },
      { key: 'note', label: '备注', type: 'textarea' },
    ],
    build: (v) => ({ decision: v.decision, reasons: v.note?.trim() ? [v.note.trim()] : [] }),
  },
  assign_ior: {
    title: '分配 IOR',
    fields: [
      { key: 'ior_company_id', label: 'IOR 公司 ID', type: 'number', required: true, defaultValue: 12 },
      { key: 'category', label: '分配理由类别', type: 'text', placeholder: 'match' },
    ],
    build: (v) => ({ ior_company_id: Number(v.ior_company_id), reason: { category: v.category || '' } }),
  },
  ior_reject: {
    title: '拒绝分配',
    fields: [{ key: 'note', label: '拒绝说明', type: 'text' }],
    build: (v) => ({ note: v.note || '' }),
  },
  file_entry: {
    title: '报关',
    fields: [
      { key: 'entry_no', label: 'Entry 号', type: 'text', required: true, placeholder: 'TEST-001' },
      { key: 'port_code', label: '口岸代码', type: 'text', required: true, placeholder: '5201' },
      { key: 'bond_ref', label: 'Bond 编号', type: 'text' },
    ],
    build: (v) => ({ entry_no: v.entry_no, port_code: v.port_code, bond_ref: v.bond_ref || undefined }),
  },
};

// 单证类型（登记到 shipment_documents 的 doc_type）
const DOC_TYPES = [
  { v: 'CI', l: 'CI 商业发票' },
  { v: 'PL', l: 'PL 装箱单' },
  { v: 'BL', l: 'BL 提单' },
  { v: 'COO', l: 'COO 原产地证' },
  { v: 'OTHER', l: '其他' },
];

// 核查结论码配色（与 QuickCheckPage 一致）
const CONCLUSION_CONFIG = {
  pass:    { cls: 'bg-emerald-50 text-emerald-800 border-emerald-300', text: '可放行（全部一致）' },
  clarify: { cls: 'bg-amber-50 text-amber-800 border-amber-300',       text: '需澄清后放行' },
  blocked: { cls: 'bg-red-50 text-red-800 border-red-300',             text: '存在硬伤须修正' },
};

// 单文件处理链路：与 QuickCheckPage 相同，末尾多一步登记到货件
const UPLOAD_STEPS = ['上传', '预处理', '抽取字段', '登记'];

// 只有出口商与运营可以传单证 / 跑工具（与状态机 run_tools 的 allowed 一致）
const TOOL_TENANTS = ['exporter', 'gtc'];

const VIEW_CONFIG = {
  exporter: { title: '我的货件', hint: '只显示本公司创建的货件' },
  ior:      { title: '分配给我的货件', hint: '只显示已分配给本公司的货件' },
  gtc:      { title: '货件通道 · 运营', hint: '显示全部货件，可按状态筛选' },
  service_provider: { title: '服务商货件', hint: '显示委托本公司的货件' },
};

const inputCls = 'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gtc-gold focus:ring-1 focus:ring-gtc-gold transition-all';
const labelCls = 'block text-sm font-medium text-gtc-navy mb-1.5';
const btnPrimary = 'inline-flex items-center gap-1.5 bg-gtc-gold text-gtc-navy px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gtc-gold/90 transition-colors disabled:opacity-50';
const btnSecondary = 'inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gtc-navy px-3 py-1.5 rounded-lg text-xs font-medium hover:border-gtc-gold hover:bg-gray-50 transition-colors disabled:opacity-50';

const fmtTime = (s) => {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d) ? String(s) : d.toLocaleString('zh-CN', { hour12: false });
};
const errText = (e) => e?.response?.data?.detail || e?.message || '请求失败';

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || { label: status || '—', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return <span className={`inline-block px-2 py-0.5 rounded-md border text-xs font-medium whitespace-nowrap ${c.cls}`}>{c.label}</span>;
}

// ══════════════════════════════════════════════════════════
// 通用弹窗（payload 收集 / 新建货件共用）
// ══════════════════════════════════════════════════════════
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gtc-navy">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gtc-navy"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function PayloadModal({ action, onSubmit, onClose, busy }) {
  const form = PAYLOAD_FORMS[action];
  const [values, setValues] = useState(() =>
    Object.fromEntries(form.fields.map((f) => [f.key, f.defaultValue ?? ''])));
  const [err, setErr] = useState('');

  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    for (const f of form.fields) {
      if (f.required && (values[f.key] === '' || values[f.key] === undefined)) {
        setErr(`请填写「${f.label}」`); return;
      }
    }
    const normalized = { ...values };
    form.fields.filter((f) => f.type === 'lines').forEach((f) => {
      normalized[f.key] = String(values[f.key] || '').split('\n').map((s) => s.trim()).filter(Boolean);
    });
    onSubmit(form.build(normalized));
  };

  return (
    <Modal title={form.title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {form.fields.map((f) => (
          <div key={f.key}>
            <label className={labelCls}>{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</label>
            {f.type === 'radio' && (
              <div className="flex flex-wrap gap-3">
                {f.options.map((o) => (
                  <label key={o.v} className="flex items-center gap-2 text-sm text-gtc-navy cursor-pointer">
                    <input type="radio" name={f.key} value={o.v} checked={values[f.key] === o.v}
                      onChange={() => set(f.key, o.v)} className="accent-gtc-gold" />
                    {o.l}
                  </label>
                ))}
              </div>
            )}
            {(f.type === 'text' || f.type === 'number') && (
              <input type={f.type} value={values[f.key]} placeholder={f.placeholder}
                onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
            )}
            {(f.type === 'textarea' || f.type === 'lines') && (
              <textarea rows={3} value={values[f.key]} placeholder={f.placeholder}
                onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
            )}
          </div>
        ))}
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>取消</button>
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}确认
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CreateModal({ onSubmit, onClose, busy }) {
  const [v, setV] = useState({ description: '', incoterm: 'FOB', declared_value: '', currency: 'USD' });
  const set = (k, x) => setV((s) => ({ ...s, [k]: x }));
  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      description: v.description || null,
      incoterm: v.incoterm || null,
      declared_value: v.declared_value === '' ? null : Number(v.declared_value),
      currency: v.currency || 'USD',
    });
  };
  return (
    <Modal title="新建货件" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>描述</label>
          <input value={v.description} onChange={(e) => set('description', e.target.value)} className={inputCls} placeholder="货物描述 / 合同号" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Incoterm</label>
            <select value={v.incoterm} onChange={(e) => set('incoterm', e.target.value)} className={inputCls}>
              {['EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>币种</label>
            <select value={v.currency} onChange={(e) => set('currency', e.target.value)} className={inputCls}>
              {['USD', 'CNY', 'EUR'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>申报价值</label>
          <input type="number" min="0" step="0.01" value={v.declared_value} onChange={(e) => set('declared_value', e.target.value)} className={inputCls} placeholder="0.00" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>取消</button>
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}创建
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════
// 右侧抽屉：详情 + 留痕
// ══════════════════════════════════════════════════════════
function Section({ icon: Icon, title, count, children }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-sm font-semibold text-gtc-navy">
        <Icon className="w-4 h-4 text-gtc-gold" />{title}
        {count !== undefined && <span className="ml-auto text-xs text-gray-400">{count} 条</span>}
      </div>
      <div className="p-4 text-sm">{children}</div>
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{k}</span>
      <span className="text-gtc-navy text-right break-all">{v ?? '—'}</span>
    </div>
  );
}

function DocsAndCheck({ shipmentId, documents, onChanged }) {
  const [caseId, setCaseId] = useState(null);
  const [caseErr, setCaseErr] = useState('');
  const [files, setFiles] = useState([]);
  const [registered, setRegistered] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [err, setErr] = useState('');
  const inputRef = useRef(null);

  // 影子案件：文件上传 / 抽取全部挂在它下面
  useEffect(() => {
    let alive = true;
    setCaseErr('');
    shipmentsAPI.getCase(shipmentId)
      .then((d) => { if (alive) setCaseId(d.case_id); })
      .catch((e) => { if (alive) setCaseErr(errText(e)); });
    return () => { alive = false; };
  }, [shipmentId]);

  const addFiles = (fileList) => {
    const arr = Array.from(fileList).map((f, i) => ({
      key: `${Date.now()}_${i}_${f.name}`,
      name: f.name,
      file: f,
      docType: 'OTHER',
      status: 'pending',
      step: 0,
      error: '',
    }));
    setFiles((prev) => [...prev, ...arr]);
  };

  const setDocType = (key, v) =>
    setFiles((prev) => prev.map((x) => (x.key === key ? { ...x, docType: v } : x)));

  const removeFile = (key) => setFiles((prev) => prev.filter((x) => x.key !== key));

  // 逐个文件：上传 → 预处理 → 抽取 → 登记到货件
  const processAll = async () => {
    if (!caseId || !files.length) return;
    setProcessing(true);
    setErr('');
    const done = [];

    for (const f of files) {
      if (f.status === 'done') continue;
      const patch = (p) =>
        setFiles((prev) => prev.map((x) => (x.key === f.key ? { ...x, ...p } : x)));
      try {
        patch({ status: 'processing', step: 0, error: '' });
        const up = await filesAPI.upload(caseId, f.file, 'document');
        const fileId = up.file_id || up.id;
        patch({ step: 1 });

        await toolsAPI.preprocess(fileId);
        patch({ step: 2 });

        await toolsAPI.classifyExtract(fileId);
        patch({ step: 3 });

        const doc = await shipmentsAPI.addDocument(shipmentId, {
          file_id: fileId,
          doc_type: f.docType,
        });
        done.push({ ...doc, file_name: doc.file_name || f.name });
        patch({ status: 'done' });
      } catch (e) {
        patch({ status: 'error', error: errText(e) });
      }
    }

    if (done.length) {
      setRegistered((prev) => [...prev, ...done]);
      onChanged?.();
    }
    setProcessing(false);
  };

  const runCheck = async () => {
    setRunning(true);
    setErr('');
    try {
      const res = await shipmentsAPI.runCrossCheck(shipmentId);
      // 运行接口不返回明细，明细从案件级报告接口取（同一张报告）
      let full = null;
      try {
        full = await quickCheckAPI.getReport(res.case_id);
      } catch {
        full = null;
      }
      setReport({
        conclusion_code: res.conclusion_code || full?.conclusion_code,
        conclusion: full?.conclusion || res.report?.conclusion,
        doc_count: full?.doc_count ?? res.report?.doc_count,
        inconsistencies: full?.inconsistencies || [],
        detailLoaded: !!full,
      });
      onChanged?.();
    } catch (e) {
      setErr(errText(e));
    } finally {
      setRunning(false);
    }
  };

  // 详情接口暂未返回 documents，回落到本次上传登记的
  const docList = Array.isArray(documents) && documents.length ? documents : registered;
  const conclusion = report ? (CONCLUSION_CONFIG[report.conclusion_code] || null) : null;

  return (
    <Section icon={FileSearch} title="单证与核查">
      {caseErr && <p className="text-red-600 mb-3">{caseErr}</p>}

      {/* 上传区 */}
      <div
        onClick={() => !processing && inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:border-gtc-gold transition-colors"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
          className="hidden"
          onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }}
        />
        <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
        <p className="text-sm text-gray-600">点击选择单证（可多选）</p>
        <p className="text-xs text-gray-400 mt-0.5">PDF / 图片 / Excel，至少 2 份才能交叉核对</p>
      </div>

      {/* 待处理文件 */}
      {files.length > 0 && (
        <div className="mt-3 border border-gray-200 rounded-xl divide-y divide-gray-100">
          {files.map((f) => (
            <div key={f.key} className="flex items-center gap-2 px-3 py-2">
              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gtc-navy truncate">{f.name}</p>
                {f.status === 'processing' && (
                  <p className="text-[11px] text-gray-400">{UPLOAD_STEPS[f.step] || '处理中'}…</p>
                )}
                {f.status === 'error' && <p className="text-[11px] text-red-500 truncate">{f.error}</p>}
              </div>
              <select
                value={f.docType}
                disabled={processing || f.status === 'done'}
                onChange={(e) => setDocType(f.key, e.target.value)}
                className="text-[11px] border border-gray-200 rounded-lg px-1.5 py-1 bg-white disabled:bg-gray-50"
              >
                {DOC_TYPES.map((d) => <option key={d.v} value={d.v}>{d.l}</option>)}
              </select>
              {f.status === 'processing' && <Loader2 className="w-3.5 h-3.5 text-gtc-gold animate-spin" />}
              {f.status === 'done' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              {f.status === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
              {!processing && f.status !== 'done' && (
                <button onClick={() => removeFile(f.key)} className="text-gray-300 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 操作 */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={processAll}
          disabled={!caseId || processing || !files.some((f) => f.status !== 'done')}
          className={btnSecondary}
        >
          {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          上传并抽取
        </button>
        <button onClick={runCheck} disabled={running || processing} className={btnPrimary}>
          {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          运行单证核查
        </button>
      </div>

      {err && <p className="mt-3 text-xs text-red-600">{err}</p>}

      {/* 已登记单证 */}
      <div className="mt-4">
        <p className="text-xs font-semibold text-gtc-navy mb-1.5">已登记单证（{docList.length}）</p>
        {!docList.length ? (
          <p className="text-xs text-gray-400">暂无</p>
        ) : (
          <ul className="space-y-1">
            {docList.map((d) => (
              <li key={d.id} className="flex items-center gap-2 text-xs">
                <FileText className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                <span className="text-gtc-navy truncate flex-1">{d.file_name || `文件 #${d.file_id}`}</span>
                <span className="text-gray-400">{d.doc_type || 'OTHER'}</span>
                {d.version > 1 && <span className="text-gray-300">v{d.version}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 核查结果 */}
      {report && (
        <div className="mt-4">
          <div className={`px-4 py-3 rounded-xl border ${conclusion?.cls || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
            <p className="font-semibold text-sm">
              {conclusion?.text || report.conclusion || report.conclusion_code || '核查完成'}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              结论码 {report.conclusion_code || '—'}
              {report.doc_count != null && ` · 核对 ${report.doc_count} 份单证`}
              {` · 不一致 ${report.inconsistencies.length} 项`}
            </p>
          </div>

          {report.inconsistencies.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-xl overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200 bg-gray-50">
                    <th className="px-3 py-2 font-medium">字段</th>
                    <th className="px-3 py-2 font-medium">文件 A</th>
                    <th className="px-3 py-2 font-medium">文件 B</th>
                  </tr>
                </thead>
                <tbody>
                  {report.inconsistencies.map((f, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0 align-top">
                      <td className="px-3 py-2 text-gtc-navy font-medium whitespace-nowrap">{f.field_cn}</td>
                      <td className="px-3 py-2">
                        <p className="text-gray-400">{f.doc_a}</p>
                        <p className="text-red-600 break-all">{f.value_a}</p>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-gray-400">{f.doc_b}</p>
                        <p className="text-red-600 break-all">{f.value_b}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!report.detailLoaded && (
            <p className="mt-2 text-xs text-gray-400">明细报告读取失败，仅显示结论。</p>
          )}
        </div>
      )}
    </Section>
  );
}

function Drawer({ shipmentId, onClose, refreshKey, tenantType, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true); setError('');
    Promise.all([shipmentsAPI.get(shipmentId), shipmentsAPI.events(shipmentId)])
      .then(([d, ev]) => { if (alive) { setDetail(d); setEvents(Array.isArray(ev) ? ev : []); } })
      .catch((e) => alive && setError(errText(e)))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [shipmentId, refreshKey]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-xl h-full shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs text-gray-400">货件详情</p>
            <h2 className="font-bold text-gtc-navy">{detail?.shipment_no || `#${shipmentId}`}</h2>
          </div>
          <div className="flex items-center gap-3">
            {detail && <StatusBadge status={detail.status} />}
            <button onClick={onClose} className="text-gray-400 hover:text-gtc-navy"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {loading && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin" />加载中…</div>}
          {error && <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"><AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}</div>}
          {detail && (
            <>
              <Section icon={ClipboardList} title="基本信息">
                <KV k="货件号" v={detail.shipment_no} />
                <KV k="状态" v={<StatusBadge status={detail.status} />} />
                <KV k="描述" v={detail.description} />
                <KV k="Incoterm" v={detail.incoterm} />
                <KV k="申报价值" v={detail.declared_value != null ? `${detail.declared_value} ${detail.currency || ''}` : null} />
                <KV k="出口商公司 ID" v={detail.exporter_company_id} />
                <KV k="IOR 公司 ID" v={detail.ior_company_id} />
                <KV k="闸门规则版本" v={detail.gate_rule_version} />
                <KV k="创建时间" v={fmtTime(detail.created_at)} />
                <KV k="更新时间" v={fmtTime(detail.updated_at)} />
              </Section>

              {TOOL_TENANTS.includes(tenantType) && (
                <DocsAndCheck
                  shipmentId={shipmentId}
                  documents={detail.documents}
                  onChanged={onChanged}
                />
              )}

              <Section icon={ShieldCheck} title="闸门记录" count={detail.gate_decisions?.length || 0}>
                {!detail.gate_decisions?.length ? <p className="text-gray-400">暂无</p> : detail.gate_decisions.map((g) => (
                  <div key={g.id} className="py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gtc-navy">{g.decision}</span>
                      <span className="text-xs text-gray-400">{g.decided_by ? `人工 #${g.decided_by}` : '引擎'} · {g.rule_version} · {fmtTime(g.created_at)}</span>
                    </div>
                    {g.gap_list?.length > 0 && <p className="text-xs text-red-600 mt-1">缺口：{g.gap_list.join('；')}</p>}
                    {g.reasons?.length > 0 && <p className="text-xs text-gray-500 mt-1">理由：{g.reasons.join('；')}</p>}
                  </div>
                ))}
              </Section>

              <Section icon={Users} title="IOR 分配" count={detail.assignments?.length || 0}>
                {!detail.assignments?.length ? <p className="text-gray-400">暂无</p> : detail.assignments.map((a) => (
                  <div key={a.id} className="py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-gtc-navy">IOR 公司 #{a.ior_company_id}</span>
                      <span className="text-xs font-medium text-gtc-navy">{a.status}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {a.reason?.category ? `理由：${a.reason.category} · ` : ''}{a.response_note ? `回复：${a.response_note} · ` : ''}{fmtTime(a.created_at)}
                    </p>
                  </div>
                ))}
              </Section>

              <Section icon={FileText} title="Entry" count={detail.entries?.length || 0}>
                {!detail.entries?.length ? <p className="text-gray-400">暂无</p> : detail.entries.map((e) => (
                  <div key={e.id} className="py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gtc-navy">{e.entry_no || '—'}</span>
                      <span className="text-xs font-medium text-gtc-navy">{e.release_status}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">口岸 {e.port_code || '—'} · 报关 {fmtTime(e.filed_at)}{e.released_at ? ` · 放行 ${fmtTime(e.released_at)}` : ''}</p>
                  </div>
                ))}
              </Section>

              <Section icon={Wrench} title="工具结果" count={detail.tool_results?.length || 0}>
                {!detail.tool_results?.length ? <p className="text-gray-400">暂无（Step 2 接入）</p> : detail.tool_results.map((t) => (
                  <KV key={t.id} k={t.tool_name} v={`${t.conclusion_code || '—'} · ${fmtTime(t.created_at)}`} />
                ))}
              </Section>

              <Section icon={History} title="留痕" count={events.length}>
                {!events.length ? <p className="text-gray-400">暂无</p> : (
                  <ol className="space-y-2">
                    {events.map((ev) => (
                      <li key={ev.id} className="flex gap-3 text-xs">
                        <span className="text-gray-400 whitespace-nowrap w-32 flex-shrink-0">{fmtTime(ev.created_at)}</span>
                        <span className="text-gtc-navy">
                          <span className="font-medium">{ACTION_LABELS[ev.action] || ev.action}</span>
                          <span className="text-gray-400"> · {ev.actor_tenant_type} #{ev.actor_user_id}</span>
                          <span className="text-gray-400"> · {ev.from_status || '∅'} → {ev.to_status}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// 列表（三种视图共用）
// ══════════════════════════════════════════════════════════
function ShipmentTable({ items, tenantType, onOpen, onAction, busyId }) {
  if (!items.length) {
    return <div className="text-center text-sm text-gray-400 py-12">暂无货件</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
            <th className="py-2.5 pr-4 font-medium">货件号</th>
            <th className="py-2.5 pr-4 font-medium">状态</th>
            <th className="py-2.5 pr-4 font-medium">出口商公司ID</th>
            <th className="py-2.5 pr-4 font-medium">IOR公司ID</th>
            <th className="py-2.5 pr-4 font-medium">更新时间</th>
            <th className="py-2.5 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => {
            const actions = Array.isArray(s.available_actions) ? s.available_actions : [];
            return (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/60">
                <td className="py-3 pr-4">
                  <button onClick={() => onOpen(s.id)} className="font-medium text-gtc-navy hover:text-gtc-gold underline-offset-2 hover:underline">
                    {s.shipment_no || `#${s.id}`}
                  </button>
                  {s.description && <p className="text-xs text-gray-400 truncate max-w-[16rem]">{s.description}</p>}
                </td>
                <td className="py-3 pr-4"><StatusBadge status={s.status} /></td>
                <td className="py-3 pr-4 text-gray-600 tabular-nums">{s.exporter_company_id ?? '—'}</td>
                <td className="py-3 pr-4 text-gray-600 tabular-nums">{s.ior_company_id ?? '—'}</td>
                <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{fmtTime(s.updated_at)}</td>
                <td className="py-3">
                  {!actions.length ? <span className="text-xs text-gray-300">—</span> : (
                    <div className="flex flex-wrap gap-1.5">
                      {actions.map((a) => {
                        const primary = tenantType === 'ior' ? IOR_PRIMARY_ACTIONS.includes(a) : false;
                        return (
                          <button key={a} disabled={busyId === s.id} onClick={() => onAction(s, a)}
                            className={primary ? btnPrimary : btnSecondary}>
                            {busyId === s.id && <Loader2 className="w-3 h-3 animate-spin" />}
                            {ACTION_LABELS[a] || a}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// 页面
// ══════════════════════════════════════════════════════════
export default function ShipmentsPage() {
  const [ctx, setCtx] = useState(null);
  const [ctxError, setCtxError] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [drawerId, setDrawerId] = useState(null);
  const [drawerKey, setDrawerKey] = useState(0);
  const [pending, setPending] = useState(null);   // { shipment, action } 等待弹窗
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const tenantType = ctx?.tenant_type;
  const view = VIEW_CONFIG[tenantType] || VIEW_CONFIG.exporter;

  // 1. 挂载先取上下文，决定视图
  useEffect(() => {
    shipmentsAPI.getContext()
      .then(setCtx)
      .catch((e) => { setCtxError(errText(e)); setLoading(false); });
  }, []);

  // 2. 拉列表（gtc 可按状态筛选）
  const load = useCallback(async () => {
    if (!tenantType) return;
    setLoading(true); setError('');
    try {
      const data = await shipmentsAPI.list(tenantType === 'gtc' ? statusFilter || undefined : undefined);
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, [tenantType, statusFilter]);

  useEffect(() => { load(); }, [load]);

  // 3. 动作：需要 payload 的先弹窗，其余直接调用
  const handleAction = (shipment, action) => {
    if (PAYLOAD_FORMS[action]) { setPending({ shipment, action }); return; }
    runTransition(shipment.id, action, undefined);
  };

  const runTransition = async (id, action, payload) => {
    setBusyId(id); setError('');
    try {
      const updated = await shipmentsAPI.transition(id, action, payload);
      setItems((list) => list.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      setPending(null);
      if (drawerId === id) setDrawerKey((k) => k + 1);
      // ior 视图接受/拒绝后列表范围可能变化，重新拉一次
      if (tenantType === 'ior' || action === 'assign_ior') await load();
    } catch (e) {
      setError(`${ACTION_LABELS[action] || action}失败：${errText(e)}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (body) => {
    setBusyId('create'); setError('');
    try {
      await shipmentsAPI.create(body);
      setShowCreate(false);
      await load();
    } catch (e) {
      setError(`创建失败：${errText(e)}`);
    } finally {
      setBusyId(null);
    }
  };

  // ---------- 渲染 ----------
  if (ctxError) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">无法获取货件通道上下文</p>
            <p className="text-sm mt-1">{ctxError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 标题 */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gtc-navy flex items-center gap-2">
            <Ship className="w-7 h-7 text-gtc-gold" />
            {ctx ? view.title : '货件通道'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {ctx ? <>{view.hint} · {ctx.company_name || `公司 #${ctx.company_id}`} · 角色 <span className="font-medium text-gtc-navy">{tenantType}</span></> : '正在识别角色…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tenantType === 'gtc' && (
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-400" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gtc-gold">
                <option value="">全部状态</option>
                {Object.entries(STATUS_CONFIG).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
              </select>
            </div>
          )}
          <button onClick={load} disabled={loading || !tenantType} className={btnSecondary} title="刷新">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />刷新
          </button>
          {tenantType === 'exporter' && (
            <button onClick={() => setShowCreate(true)} className={btnPrimary}>
              <Plus className="w-3.5 h-3.5" />新建货件
            </button>
          )}
        </div>
      </div>

      {/* 错误 */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-3 rounded-2xl text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-700"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* 列表 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        {loading && !items.length
          ? <div className="flex items-center gap-2 text-sm text-gray-500 py-8 justify-center"><Loader2 className="w-4 h-4 animate-spin" />加载中…</div>
          : <ShipmentTable items={items} tenantType={tenantType} onOpen={setDrawerId} onAction={handleAction} busyId={busyId} />}
      </div>

      <p className="text-xs text-gray-400">
        操作按钮由后端按角色与当前状态返回，闸门权在平台、放行权在 IOR。所有状态变更均写入留痕。
      </p>

      {/* 弹窗 / 抽屉 */}
      {showCreate && <CreateModal onSubmit={handleCreate} onClose={() => setShowCreate(false)} busy={busyId === 'create'} />}
      {pending && (
        <PayloadModal
          action={pending.action}
          busy={busyId === pending.shipment.id}
          onClose={() => setPending(null)}
          onSubmit={(payload) => runTransition(pending.shipment.id, pending.action, payload)}
        />
      )}
      {drawerId != null && (
        <Drawer
          shipmentId={drawerId}
          refreshKey={drawerKey}
          tenantType={tenantType}
          onClose={() => setDrawerId(null)}
          onChanged={async () => { setDrawerKey((k) => k + 1); await load(); }}
        />
      )}
    </div>
  );
}
