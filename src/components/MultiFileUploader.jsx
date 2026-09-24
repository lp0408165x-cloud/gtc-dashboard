// ============================================================
// 多文件上传（案件室任务、首次资料共用）
//
//   - 「选择文件」可多选；「拍照」直接调起相机（微信内置浏览器里两种入口都要有）
//   - 逐个上传，显示进度；失败的可单独重试或移除
//   - 前端先按 limits 挡一遍格式和大小，后端还会再校验
//
// props:
//   uploadOne(file, onProgress) => Promise   上传一个文件
//   limits { max_mb, extensions, formats }   后端返回的上传限制
//   onAllDone()                              队列里的文件全部成功后调用一次
//   pickLabel                                「选择文件」按钮文字
//   compact                                  小尺寸，不显示格式说明
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, CheckCircle2, Clock, Loader2, Paperclip, RotateCcw, X } from 'lucide-react';
import { detailText, UPLOAD_FAILED } from '../utils/apiError';

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.heic,.heif,.doc,.docx,.xls,.xlsx,.zip,application/pdf,image/*';

export const fmtSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round((b || 0) / 1024))} KB`);

function extOf(name) {
  const i = name.lastIndexOf('.');
  return i > 0 ? name.slice(i + 1).toLowerCase() : '';
}

function precheck(file, limits) {
  const ext = extOf(file.name);
  const okExt = ext ? limits.extensions.includes(ext) : /^image\//.test(file.type) || file.type === 'application/pdf';
  if (!okExt) return `不支持该文件格式，请上传 ${limits.formats}`;
  if (file.size > limits.max_mb * 1048576) return `单个文件不能超过 ${limits.max_mb} MB`;
  if (file.size === 0) return '文件为空，请重新选择';
  return '';
}

let seq = 0;

export default function MultiFileUploader({ uploadOne, limits, onAllDone, pickLabel = '选择文件', compact = false }) {
  const [items, setItems] = useState([]);
  const busy = useRef(false);
  const pickRef = useRef(null);
  const camRef = useRef(null);

  const patch = (id, p) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const add = (fileList) => {
    const next = Array.from(fileList || []).map((file) => {
      const err = precheck(file, limits);
      return { id: ++seq, file, progress: 0, status: err ? 'invalid' : 'pending', error: err };
    });
    if (next.length) setItems((xs) => [...xs, ...next]);
  };

  // 逐个上传：手机网络下并发容易全部超时
  useEffect(() => {
    if (busy.current) return;
    const item = items.find((x) => x.status === 'pending');
    if (!item) {
      if (items.length > 0 && items.every((x) => x.status === 'done')) onAllDone?.();
      return;
    }
    busy.current = true;
    patch(item.id, { status: 'uploading', progress: 0, error: '' });
    uploadOne(item.file, (p) => patch(item.id, { progress: p }))
      .then(() => patch(item.id, { status: 'done', progress: 100 }))
      .catch((ex) => patch(item.id, {
        status: 'error',
        error: ex?.response ? detailText(ex.response.data?.detail, UPLOAD_FAILED) : '网络不稳定，上传中断，请重试',
      }))
      .finally(() => { busy.current = false; setItems((xs) => [...xs]); });
  }, [items]);  // eslint-disable-line react-hooks/exhaustive-deps

  const remove = (id) => setItems((xs) => xs.filter((x) => x.id !== id));
  const retry = (id) => patch(id, { status: 'pending', progress: 0, error: '' });
  const h = compact ? 'h-10 text-sm' : 'h-11';

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => pickRef.current?.click()}
                className={`flex-1 ${h} rounded-xl bg-gtc-navy text-white font-medium flex items-center justify-center gap-1.5 active:scale-[0.99]`}>
          <Paperclip className="w-4 h-4" />{pickLabel}
        </button>
        <button type="button" onClick={() => camRef.current?.click()}
                className={`${h} px-4 rounded-xl border border-gtc-navy text-gtc-navy font-medium flex items-center justify-center gap-1.5 active:scale-[0.99]`}>
          <Camera className="w-4 h-4" />拍照
        </button>
        {/* 两个 input：选文件允许多选、多种格式；拍照只要图片并直接调起相机 */}
        <input ref={pickRef} type="file" multiple accept={ACCEPT} className="hidden"
               onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden"
               onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      </div>
      {!compact && (
        <p className="text-xs text-gray-400">可多选。支持 {limits.formats}，单个文件不超过 {limits.max_mb} MB。</p>
      )}

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((x) => (
            <li key={x.id} className="bg-slate-50 border border-gray-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                {x.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  : x.status === 'uploading' ? <Loader2 className="w-4 h-4 text-gtc-navy animate-spin shrink-0" />
                  : x.status === 'pending' ? <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                <span className="flex-1 min-w-0 text-sm text-gray-800 truncate">{x.file.name}</span>
                <span className="text-xs text-gray-400 shrink-0">{fmtSize(x.file.size)}</span>
                {x.status === 'error' && (
                  <button type="button" onClick={() => retry(x.id)}
                          className="shrink-0 text-xs text-gtc-navy flex items-center gap-0.5 px-1.5 py-1">
                    <RotateCcw className="w-3.5 h-3.5" />重试
                  </button>
                )}
                {(x.status === 'error' || x.status === 'invalid') && (
                  <button type="button" onClick={() => remove(x.id)} aria-label="移除"
                          className="shrink-0 text-gray-400 p-1"><X className="w-4 h-4" /></button>
                )}
              </div>
              {x.status === 'uploading' && (
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gtc-navy transition-all" style={{ width: `${x.progress}%` }} />
                </div>
              )}
              {x.error && <p className="mt-1 text-xs text-red-600">{x.error}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
