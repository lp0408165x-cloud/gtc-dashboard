import { useState, useEffect, useRef, Component } from 'react';
import {
  FileSearch, Upload, X, Loader2, Play, Download,
  CheckCircle2, AlertTriangle, HelpCircle, MinusCircle, FileText, Code,
} from 'lucide-react';
import { quickCheckAPI, filesAPI, toolsAPI } from '../services/api';

// 四色标记映射：一致 / 不一致 / 待核实 / 不适用
const MARK_CONFIG = {
  consistent:   { icon: CheckCircle2,  cls: 'text-emerald-600', bg: 'bg-emerald-50',  label: '一致' },
  inconsistent: { icon: AlertTriangle, cls: 'text-red-600',     bg: 'bg-red-50',      label: '不一致' },
  pending:      { icon: HelpCircle,    cls: 'text-amber-600',   bg: 'bg-amber-50',    label: '待核实' },
  na:           { icon: MinusCircle,   cls: 'text-gray-400',    bg: 'bg-gray-50',     label: '不适用' },
};

function normalizeMark(mark) {
  if (!mark) return 'na';
  const m = String(mark).toLowerCase();
  if (m.includes('一致') && !m.includes('不一致')) return 'consistent';
  if (m.includes('consistent') && !m.includes('inconsistent')) return 'consistent';
  if (m === 'ok' || m === 'pass') return 'consistent';
  if (m.includes('不一致') || m.includes('inconsistent') || m === 'conflict' || m === 'fail') return 'inconsistent';
  if (m.includes('待核实') || m.includes('pending') || m.includes('verify')) return 'pending';
  if (m.includes('不适用') || m.includes('na') || m.includes('n/a')) return 'na';
  return 'na';
}

const CONCLUSION_CONFIG = {
  pass:    { cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', text: '可放行（全部一致）' },
  clarify: { cls: 'bg-amber-100 text-amber-800 border-amber-300',       text: '需澄清后放行' },
  blocked: { cls: 'bg-red-100 text-red-800 border-red-300',             text: '存在硬伤须修正' },
};

const STEP_LABELS = ['上传', '预处理', '抽取字段'];

function safeText(v) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? '是' : '否';
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

// ============ 错误边界：报告区崩了也不白屏 ============
class ReportErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('报告渲染异常:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="mt-10 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="font-semibold text-amber-800 mb-2">报告渲染遇到问题</p>
          <p className="text-sm text-amber-700 mb-4">
            核查已完成，但展示报告时出现异常。下方是后端返回的原始数据，可供排查。
          </p>
          <RawJsonViewer data={this.props.rawReport} defaultOpen={true} />
        </div>
      );
    }
    return this.props.children;
  }
}

// ============ 原始 JSON 查看区（可折叠） ============
function RawJsonViewer({ data, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-2.5 bg-gray-50 text-sm text-gray-600 hover:bg-gray-100 transition"
      >
        <Code className="w-4 h-4" />
        {open ? '收起原始数据' : '查看原始数据（调试用）'}
      </button>
      {open && (
        <pre className="p-4 text-xs bg-gray-900 text-gray-100 overflow-auto max-h-96">
          {(() => {
            try {
              return JSON.stringify(data, null, 2);
            } catch {
              return String(data);
            }
          })()}
        </pre>
      )}
    </div>
  );
}

const QuickCheckPage = () => {
  const [quickCaseId, setQuickCaseId] = useState(null);
  const [sessionError, setSessionError] = useState('');
  const [files, setFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await quickCheckAPI.session();
        setQuickCaseId(res.quick_case_id);
      } catch (e) {
        setSessionError('初始化失败，请刷新页面或重新登录');
      }
    })();
  }, []);

  const addFiles = (fileList) => {
    const arr = Array.from(fileList).map((f, i) => ({
      id: `${Date.now()}_${i}_${f.name}`,
      name: f.name,
      file: f,
      status: 'pending',
      step: 0,
      fileId: null,
      error: '',
    }));
    setFiles((prev) => [...prev, ...arr]);
    setReport(null);
  };

  const handleSelect = (e) => {
    if (e.target.files?.length) addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropRef.current?.classList.remove('border-gtc-gold');
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setReport(null);
  };

  const processAll = async () => {
    if (!quickCaseId || !files.length) return;
    setProcessing(true);
    setReport(null);

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.status === 'done') continue;

      const update = (patch) =>
        setFiles((prev) => prev.map((x) => (x.id === f.id ? { ...x, ...patch } : x)));

      try {
        update({ status: 'processing', step: 0, error: '' });
        const up = await filesAPI.upload(quickCaseId, f.file, 'document');
        const fileId = up.file_id || up.id;
        update({ fileId, step: 1 });

        await toolsAPI.preprocess(fileId);
        update({ step: 2 });

        await toolsAPI.classifyExtract(fileId);
        update({ status: 'done', step: 3 });
      } catch (e) {
        const msg = e.response?.data?.detail || e.message || '处理失败';
        update({ status: 'error', error: typeof msg === 'string' ? msg : '处理失败' });
      }
    }

    setProcessing(false);
  };

  const runCheck = async () => {
    if (!quickCaseId) return;
    setRunning(true);
    try {
      await quickCheckAPI.run(quickCaseId);
      const rep = await quickCheckAPI.getReport(quickCaseId);
      setReport(rep);
    } catch (e) {
      const msg = e.response?.data?.detail || '核查失败，请确认已成功抽取至少 2 份单证';
      alert(typeof msg === 'string' ? msg : '核查失败');
    } finally {
      setRunning(false);
    }
  };

  const exportReport = async () => {
    if (!quickCaseId) return;
    setExporting(true);
    try {
      const blob = await quickCheckAPI.export(quickCaseId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `单证核查报告_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const doneCount = files.filter((f) => f.status === 'done').length;
  const canRun = doneCount >= 2 && !processing && !running;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <FileSearch className="w-8 h-8 text-gtc-gold" />
        <h1 className="text-2xl font-display font-bold text-gtc-navy">单证智能核查</h1>
        <span className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded-full font-semibold">NEW</span>
      </div>
      <p className="text-gray-500 mb-8">
        上传多份单证（提单 B/L、商业发票 CI、装箱单 PL、原产地证 COO 等），系统自动交叉核对核心字段，输出四色标记报告。无需立案，即传即查。
      </p>

      {sessionError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {sessionError}
        </div>
      )}

      <div
        ref={dropRef}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); dropRef.current?.classList.add('border-gtc-gold'); }}
        onDragLeave={() => dropRef.current?.classList.remove('border-gtc-gold')}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center cursor-pointer hover:border-gtc-gold transition-colors bg-white"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
          onChange={handleSelect}
          className="hidden"
        />
        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">点击或拖拽上传单证</p>
        <p className="text-gray-400 text-sm mt-1">支持 PDF / 图片 / Excel，至少 2 份才能核对</p>
      </div>

      {files.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-5 py-3">
              <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gtc-navy truncate">{f.name}</p>
                {f.status === 'processing' && (
                  <p className="text-xs text-gray-400">{STEP_LABELS[f.step] || '处理中'}…</p>
                )}
                {f.status === 'error' && (
                  <p className="text-xs text-red-500 truncate">{f.error}</p>
                )}
              </div>
              {f.status === 'processing' && <Loader2 className="w-4 h-4 text-gtc-gold animate-spin" />}
              {f.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              {f.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
              {!processing && (
                <button onClick={() => removeFile(f.id)} className="text-gray-300 hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={processAll}
            disabled={processing || files.every((f) => f.status === 'done')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gtc-navy text-white rounded-xl font-medium disabled:opacity-40 hover:opacity-90 transition"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {processing ? '处理中…' : '解析单证'}
          </button>
          <button
            onClick={runCheck}
            disabled={!canRun}
            className="flex items-center gap-2 px-5 py-2.5 bg-gtc-gold text-gtc-navy rounded-xl font-semibold disabled:opacity-40 hover:opacity-90 transition"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? '核查中…' : `开始核查（${doneCount} 份就绪）`}
          </button>
        </div>
      )}

      {report && (
        <ReportErrorBoundary rawReport={report}>
          <ReportView report={report} onExport={exportReport} exporting={exporting} />
        </ReportErrorBoundary>
      )}
    </div>
  );
};

// ============ 报告展示（全面容错） ============
function ReportView({ report, onExport, exporting }) {
  const r = report || {};
  const conclusionCode = r.conclusion_code || r.conclusionCode || 'clarify';
  const cc = CONCLUSION_CONFIG[conclusionCode] || CONCLUSION_CONFIG.clarify;

  const reviewedDocs = Array.isArray(r.reviewed_docs) ? r.reviewed_docs
                     : Array.isArray(r.reviewedDocs) ? r.reviewedDocs
                     : [];
  const core10 = Array.isArray(r.core10_result) ? r.core10_result
               : Array.isArray(r.core10) ? r.core10
               : Array.isArray(r.core_10) ? r.core_10
               : [];
  const findings = Array.isArray(r.findings) ? r.findings : [];

  return (
    <div className="mt-10 space-y-8">
      <div className={`flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border ${cc.cls}`}>
        <div>
          <p className="text-xs uppercase tracking-wide opacity-70">核查结论</p>
          <p className="text-xl font-bold">{cc.text}</p>
        </div>
        <button
          onClick={onExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-white/70 rounded-xl font-medium disabled:opacity-50 hover:bg-white transition"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          导出报告
        </button>
      </div>

      {reviewedDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gtc-navy mb-3">已审阅单证（{reviewedDocs.length}）</h3>
          <div className="flex flex-wrap gap-2">
            {reviewedDocs.map((d, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gtc-navy">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                {safeText(d?.doc_type || d?.type || d?.name || d)}
              </span>
            ))}
          </div>
        </div>
      )}

      {core10.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gtc-navy mb-3">核心 10 项核对</h3>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-left">
                  <th className="px-5 py-3 font-medium">核对项</th>
                  <th className="px-5 py-3 font-medium w-32">结果</th>
                  <th className="px-5 py-3 font-medium">说明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {core10.map((row, i) => {
                  const item = row || {};
                  const key = normalizeMark(item.mark || item.status);
                  const conf = MARK_CONFIG[key] || MARK_CONFIG.na;
                  const Icon = conf.icon;
                  return (
                    <tr key={i}>
                      <td className="px-5 py-3 text-gtc-navy">{safeText(item.field_cn || item.field || item.label)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${conf.bg} ${conf.cls} font-medium`}>
                          <Icon className="w-4 h-4" />
                          {conf.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{safeText(item.note || item.detail)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {findings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gtc-navy mb-3">不一致明细（{findings.length}）</h3>
          <div className="space-y-3">
            {findings.map((fd, i) => {
              const item = fd || {};
              const key = normalizeMark(item.mark || item.status);
              const conf = MARK_CONFIG[key] || MARK_CONFIG.inconsistent;
              const Icon = conf.icon;
              return (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gtc-navy">
                      {safeText(item.field_cn || item.field_en || item.field)}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${conf.bg} ${conf.cls} text-sm font-medium`}>
                      <Icon className="w-4 h-4" />
                      {conf.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">{safeText(item.doc_a) === '—' ? '文件 A' : safeText(item.doc_a)}</p>
                      <p className="text-gtc-navy break-words">{safeText(item.value_a)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">{safeText(item.doc_b) === '—' ? '文件 B' : safeText(item.doc_b)}</p>
                      <p className="text-gtc-navy break-words">{safeText(item.value_b)}</p>
                    </div>
                  </div>
                  {item.impact && (
                    <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                      影响环节：{safeText(item.impact)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {r.summary && (
        <div className="bg-gtc-navy/5 rounded-2xl p-5 text-sm text-gtc-navy leading-relaxed">
          {safeText(r.summary)}
        </div>
      )}

      {core10.length === 0 && findings.length === 0 && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700">
          报告已生成，但未解析到核心 10 项或不一致明细。请查看下方原始数据确认后端返回结构。
        </div>
      )}

      <RawJsonViewer data={report} />

      <p className="text-center text-xs text-gray-400 pt-4">
        GTC-C Global | https://gtc-ai-global.com/ | Platform: https://gtc-dashboard.onrender.com/
      </p>
    </div>
  );
}

export default QuickCheckPage;
