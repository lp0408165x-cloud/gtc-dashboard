import { useState, useEffect, useRef, Component } from 'react';
import {
  FileSearch, Upload, X, Loader2, Play, Download,
  CheckCircle2, AlertTriangle, HelpCircle, MinusCircle, FileText, Code,
} from 'lucide-react';
import { quickCheckAPI, filesAPI, toolsAPI } from '../services/api';

// 四色标记映射：✅一致 / ⚡不一致 / ⚠️待核实 / ➖不适用
const MARK_CONFIG = {
  consistent:   { icon: CheckCircle2,  cls: 'text-emerald-600', bg: 'bg-emerald-50',  label: '一致' },
  inconsistent: { icon: AlertTriangle, cls: 'text-red-600',     bg: 'bg-red-50',      label: '不一致' },
  pending:      { icon: HelpCircle,    cls: 'text-amber-600',   bg: 'bg-amber-50',    label: '待核实' },
  na:           { icon: MinusCircle,   cls: 'text-gray-400',    bg: 'bg-gray-50',     label: '不适用' },
};

function normalizeMark(mark) {
  if (!mark) return 'na';
  const m = String(mark).toLowerCase();
  if (m.includes('\u2705') || m.includes('consistent') || m === 'ok' || m === 'pass') return 'consistent';
  if (m.includes('\u26a1') || m.includes('inconsistent') || m === 'conflict' || m === 'fail') return 'inconsistent';
  if (m.includes('\u26a0') || m.includes('pending') || m.includes('verify')) return 'pending';
  if (m.includes('\u2796') || m.includes('na') || m.includes('n/a')) return 'na';
  return 'na';
}

const CONCLUSION_CONFIG = {
  pass:    { cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', text: '\u53ef\u653e\u884c\uff08\u5168\u90e8\u4e00\u81f4\uff09' },
  clarify: { cls: 'bg-amber-100 text-amber-800 border-amber-300',       text: '\u9700\u6f84\u6e05\u540e\u653e\u884c' },
  blocked: { cls: 'bg-red-100 text-red-800 border-red-300',             text: '\u5b58\u5728\u786c\u4f24\u987b\u4fee\u6b63' },
};

const STEP_LABELS = ['\u4e0a\u4f20', '\u9884\u5904\u7406', '\u62bd\u53d6\u5b57\u6bb5'];

function safeText(v) {
  if (v === null || v === undefined) return '\u2014';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? '\u662f' : '\u5426';
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

// ============ \u9519\u8bef\u8fb9\u754c\uff1a\u62a5\u544a\u533a\u5d29\u4e86\u4e5f\u4e0d\u767d\u5c4f ============
class ReportErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('\u62a5\u544a\u6e32\u67d3\u5f02\u5e38:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="mt-10 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="font-semibold text-amber-800 mb-2">\u62a5\u544a\u6e32\u67d3\u9047\u5230\u95ee\u9898</p>
          <p className="text-sm text-amber-700 mb-4">
            \u6838\u67e5\u5df2\u5b8c\u6210\uff0c\u4f46\u5c55\u793a\u62a5\u544a\u65f6\u51fa\u73b0\u5f02\u5e38\u3002\u4e0b\u65b9\u662f\u540e\u7aef\u8fd4\u56de\u7684\u539f\u59cb\u6570\u636e\uff0c\u53ef\u4f9b\u6392\u67e5\u3002
          </p>
          <RawJsonViewer data={this.props.rawReport} defaultOpen={true} />
        </div>
      );
    }
    return this.props.children;
  }
}

// ============ \u539f\u59cb JSON \u67e5\u770b\u533a\uff08\u53ef\u6298\u53e0\uff09 ============
function RawJsonViewer({ data, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-2.5 bg-gray-50 text-sm text-gray-600 hover:bg-gray-100 transition"
      >
        <Code className="w-4 h-4" />
        {open ? '\u6536\u8d77\u539f\u59cb\u6570\u636e' : '\u67e5\u770b\u539f\u59cb\u6570\u636e\uff08\u8c03\u8bd5\u7528\uff09'}
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
        setSessionError('\u521d\u59cb\u5316\u5931\u8d25\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u6216\u91cd\u65b0\u767b\u5f55');
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
        const msg = e.response?.data?.detail || e.message || '\u5904\u7406\u5931\u8d25';
        update({ status: 'error', error: typeof msg === 'string' ? msg : '\u5904\u7406\u5931\u8d25' });
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
      const msg = e.response?.data?.detail || '\u6838\u67e5\u5931\u8d25\uff0c\u8bf7\u786e\u8ba4\u5df2\u6210\u529f\u62bd\u53d6\u81f3\u5c11 2 \u4efd\u5355\u8bc1';
      alert(typeof msg === 'string' ? msg : '\u6838\u67e5\u5931\u8d25');
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
      a.download = `\u5355\u8bc1\u6838\u67e5\u62a5\u544a_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('\u5bfc\u51fa\u5931\u8d25');
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
        <h1 className="text-2xl font-display font-bold text-gtc-navy">\u5355\u8bc1\u667a\u80fd\u6838\u67e5</h1>
        <span className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded-full font-semibold">NEW</span>
      </div>
      <p className="text-gray-500 mb-8">
        \u4e0a\u4f20\u591a\u4efd\u5355\u8bc1\uff08\u63d0\u5355 B/L\u3001\u5546\u4e1a\u53d1\u7968 CI\u3001\u88c5\u7bb1\u5355 PL\u3001\u539f\u4ea7\u5730\u8bc1 COO \u7b49\uff09\uff0c\u7cfb\u7edf\u81ea\u52a8\u4ea4\u53c9\u6838\u5bf9\u6838\u5fc3\u5b57\u6bb5\uff0c\u8f93\u51fa\u56db\u8272\u6807\u8bb0\u62a5\u544a\u3002\u65e0\u9700\u7acb\u6848\uff0c\u5373\u4f20\u5373\u67e5\u3002
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
        <p className="text-gray-600 font-medium">\u70b9\u51fb\u6216\u62d6\u62fd\u4e0a\u4f20\u5355\u8bc1</p>
        <p className="text-gray-400 text-sm mt-1">\u652f\u6301 PDF / \u56fe\u7247 / Excel\uff0c\u81f3\u5c11 2 \u4efd\u624d\u80fd\u6838\u5bf9</p>
      </div>

      {files.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-5 py-3">
              <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gtc-navy truncate">{f.name}</p>
                {f.status === 'processing' && (
                  <p className="text-xs text-gray-400">{STEP_LABELS[f.step] || '\u5904\u7406\u4e2d'}\u2026</p>
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
            {processing ? '\u5904\u7406\u4e2d\u2026' : '\u89e3\u6790\u5355\u8bc1'}
          </button>
          <button
            onClick={runCheck}
            disabled={!canRun}
            className="flex items-center gap-2 px-5 py-2.5 bg-gtc-gold text-gtc-navy rounded-xl font-semibold disabled:opacity-40 hover:opacity-90 transition"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? '\u6838\u67e5\u4e2d\u2026' : `\u5f00\u59cb\u6838\u67e5\uff08${doneCount} \u4efd\u5c31\u7eea\uff09`}
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

// ============ \u62a5\u544a\u5c55\u793a\uff08\u5168\u9762\u5bb9\u9519\uff09 ============
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
          <p className="text-xs uppercase tracking-wide opacity-70">\u6838\u67e5\u7ed3\u8bba</p>
          <p className="text-xl font-bold">{cc.text}</p>
        </div>
        <button
          onClick={onExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-white/70 rounded-xl font-medium disabled:opacity-50 hover:bg-white transition"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          \u5bfc\u51fa\u62a5\u544a
        </button>
      </div>

      {reviewedDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gtc-navy mb-3">\u5df2\u5ba1\u9605\u5355\u8bc1\uff08{reviewedDocs.length}\uff09</h3>
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
          <h3 className="text-sm font-semibold text-gtc-navy mb-3">\u6838\u5fc3 10 \u9879\u6838\u5bf9</h3>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-left">
                  <th className="px-5 py-3 font-medium">\u6838\u5bf9\u9879</th>
                  <th className="px-5 py-3 font-medium w-32">\u7ed3\u679c</th>
                  <th className="px-5 py-3 font-medium">\u8bf4\u660e</th>
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
          <h3 className="text-sm font-semibold text-gtc-navy mb-3">\u4e0d\u4e00\u81f4\u660e\u7ec6\uff08{findings.length}\uff09</h3>
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
                      <p className="text-xs text-gray-400 mb-1">{safeText(item.doc_a) === '\u2014' ? '\u6587\u4ef6 A' : safeText(item.doc_a)}</p>
                      <p className="text-gtc-navy break-words">{safeText(item.value_a)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">{safeText(item.doc_b) === '\u2014' ? '\u6587\u4ef6 B' : safeText(item.doc_b)}</p>
                      <p className="text-gtc-navy break-words">{safeText(item.value_b)}</p>
                    </div>
                  </div>
                  {item.impact && (
                    <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                      \u5f71\u54cd\u73af\u8282\uff1a{safeText(item.impact)}
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
          \u62a5\u544a\u5df2\u751f\u6210\uff0c\u4f46\u672a\u89e3\u6790\u5230\u6838\u5fc3 10 \u9879\u6216\u4e0d\u4e00\u81f4\u660e\u7ec6\u3002\u8bf7\u67e5\u770b\u4e0b\u65b9\u539f\u59cb\u6570\u636e\u786e\u8ba4\u540e\u7aef\u8fd4\u56de\u7ed3\u6784\u3002
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
