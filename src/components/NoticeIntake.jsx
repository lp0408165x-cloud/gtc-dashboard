// ============================================================
// 新建案件页 · 通知进件（1c.5，仅内部角色）
//
//   NoticeUploadCard：上传 CBP 通知（PDF / JPG / PNG / .eml，20 MB 内）→ 后端读取 → 结果回填表单
//   FieldNote：表单字段下方的读取说明——置信度、是否在原文中找到、原文依据、需要注意的问题
//   DerivedDeadlineConfirm：回复期限按原文推算时，专家勾选确认后才能立案
//   读不出的字段留空，由专家手填；页面文字不出现「AI」「智能」「自动生成」
// ============================================================
import { useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Eye, FileText, Loader2, Upload, X } from 'lucide-react';
import { noticeIntakeAPI, NOTICE_ACCEPT, NOTICE_MAX_MB } from '../services/noticeIntakeApi';
import { detailText } from '../utils/apiError';
import { openSignedLink, isViewable } from '../utils/openSignedLink';

const CONF = {
  high: { label: '置信度 高', cls: 'bg-green-100 text-green-700' },
  medium: { label: '置信度 中', cls: 'bg-amber-100 text-amber-700' },
  low: { label: '置信度 低', cls: 'bg-red-100 text-red-700' },
  none: { label: '未读出', cls: 'bg-gray-100 text-gray-500' },
};

const norm = (v) => String(v ?? '').trim();

// field：后端读取结果里的一个字段；suggested：回填时的值；current：表单当前值
export function FieldNote({ field, suggested, current, derived = false }) {
  const [open, setOpen] = useState(false);
  if (!field) return null;
  const conf = CONF[field.confidence] || CONF.none;
  const edited = norm(suggested) !== '' && current !== undefined && norm(suggested) !== norm(current);
  const warn = field.confidence === 'low' || field.confidence === 'none' || field.verified === false;
  return (
    <div className={`mt-1.5 text-xs rounded-lg px-2.5 py-1.5 ${warn ? 'bg-red-50' : 'bg-gray-50'}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`px-1.5 py-0.5 rounded ${conf.cls}`}>{conf.label}</span>
        {derived && <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">推算</span>}
        {field.verified === true && <span className="text-green-700">原文中已找到</span>}
        {field.verified === false && <span className="text-red-600">原文中未找到依据</span>}
        {field.verified == null && field.evidence && <span className="text-gray-500">图片或扫描件，未能自动核对原文</span>}
        {edited && <span className="text-gtc-navy">已手动修改</span>}
        {field.evidence && (
          <button type="button" onClick={() => setOpen(!open)}
                  className="ml-auto inline-flex items-center gap-0.5 text-gtc-navy hover:underline">
            原文依据 {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>
      {open && field.evidence && (
        <p className="mt-1.5 px-2 py-1 bg-white border border-gray-200 rounded font-mono text-[11px] text-gray-700 whitespace-pre-wrap break-words">
          {field.evidence}
        </p>
      )}
      {(field.issues || []).map((t) => (
        <p key={t} className="mt-1 text-amber-700 flex gap-1"><AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />{t}</p>
      ))}
    </div>
  );
}

export function NoticeUploadCard({ intake, onResult, onClear }) {
  const input = useRef(null);
  const [phase, setPhase] = useState('idle');      // idle | uploading | reading
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState('');

  const pick = async (file) => {
    if (!file) return;
    setErr('');
    if (file.size > NOTICE_MAX_MB * 1024 * 1024) { setErr(`文件超过 ${NOTICE_MAX_MB} MB，请直接在下方手填`); return; }
    setPhase('uploading'); setProgress(0);
    try {
      const res = await noticeIntakeAPI.extract(file, (p) => { setProgress(p); if (p >= 100) setPhase('reading'); });
      onResult(res);
    } catch (ex) {
      setErr(detailText(ex?.response?.data?.detail, '上传失败，请稍后重试，或直接在下方手填'));
    } finally {
      setPhase('idle');
      if (input.current) input.current.value = '';
    }
  };

  if (intake) {
    const discard = async () => {
      try { await noticeIntakeAPI.discard(intake.intake_id); } catch { /* 丢弃失败不影响手填；7 天后自动清理 */ }
      onClear();
    };
    const viewable = isViewable(intake.file.name);
    const view = () => openSignedLink(noticeIntakeAPI.linkPath(intake.intake_id, !viewable), { fileName: intake.file.name });
    return (
      <div className={`rounded-xl border p-4 mb-6 ${intake.error ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
        <div className="flex flex-wrap items-center gap-3">
          <FileText className="w-5 h-5 text-gtc-navy shrink-0" />
          <div className="min-w-0 mr-auto">
            <p className="font-medium text-gtc-navy truncate">{intake.file.name}</p>
            <p className="text-xs text-gray-600">
              {intake.error ? intake.error : '已从通知读取。带说明的字段请逐项核对；读不出的留空，请手填。'}
            </p>
          </div>
          {intake.file.available && (
            <button type="button" onClick={view} className="inline-flex items-center gap-1 text-sm text-gtc-navy hover:underline">
              <Eye className="w-4 h-4" />{viewable ? '查看原通知' : '下载原通知'}
            </button>
          )}
          <button type="button" onClick={discard} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600">
            <X className="w-4 h-4" />不用此通知
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">立案后原通知会存为案件的第一份文件。</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-gray-300 p-5 mb-6 text-center"
         onDragOver={(e) => e.preventDefault()}
         onDrop={(e) => { e.preventDefault(); if (phase === 'idle') pick(e.dataTransfer.files?.[0]); }}>
      {phase === 'idle' ? (
        <>
          <Upload className="w-7 h-7 text-gray-400 mx-auto mb-2" />
          <p className="font-medium text-gtc-navy">上传 CBP 通知，从通知读取案件信息</p>
          <p className="text-xs text-gray-500 mt-1">
            PDF、JPG、PNG 截图或 .eml 邮件，{NOTICE_MAX_MB} MB 以内、PDF 不超过 50 页。也可以跳过，直接在下方手填。
          </p>
          <button type="button" onClick={() => input.current?.click()}
                  className="mt-3 px-4 py-2 rounded-lg bg-gtc-navy text-white text-sm hover:bg-gtc-blue">选择文件</button>
          <input ref={input} type="file" accept={NOTICE_ACCEPT} className="hidden" aria-label="选择 CBP 通知文件"
                 onChange={(e) => pick(e.target.files?.[0])} />
        </>
      ) : (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 py-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          {phase === 'uploading' ? `正在上传 ${progress}%` : '正在读取通知，请稍候…'}
        </div>
      )}
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </div>
  );
}

export function DerivedDeadlineConfirm({ basis, confirmed, onChange }) {
  return (
    <label className="mt-2 flex items-start gap-2 text-sm bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-blue-900">
      <input type="checkbox" checked={confirmed} onChange={(e) => onChange(e.target.checked)} className="mt-0.5" />
      <span>此回复期限是按通知原文推算的{basis ? `（原文：「${basis}」）` : ''}，我已核对无误。</span>
    </label>
  );
}
