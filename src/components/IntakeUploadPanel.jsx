import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, AlertCircle, CheckCircle, Loader2, Sparkles, AlertTriangle, Eye, RotateCcw, Download, Plus, History,
} from 'lucide-react';

import api from '../services/api';
import { openSignedLink } from '../utils/openSignedLink';
import { detailText } from '../utils/apiError';
import MultiFileUploader, { fmtSize } from './MultiFileUploader';

const SLOT_ICONS = { '1': '📋', '2': '📨', '3': '📦' };
const URGENCY_COLOR = {
  CRITICAL: 'text-red-600 bg-red-50 border-red-200',
  HIGH:     'text-orange-600 bg-orange-50 border-orange-200',
  MEDIUM:   'text-amber-600 bg-amber-50 border-amber-200',
  LOW:      'text-blue-600 bg-blue-50 border-blue-200',
};

export default function IntakeUploadPanel({ caseId, onAnalysisComplete }) {
  const [slots, setSlots]           = useState([]);
  const [intakeStatus, setIntakeStatus] = useState('pending');
  const [canAnalyze, setCanAnalyze] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [analyzing, setAnalyzing]   = useState(false);
  const [error, setError]           = useState(null);

  const [limits, setLimits]         = useState(null);

  // ── 获取槽位状态 ──
  const fetchSlots = useCallback(async () => {
    try {
      const { data } = await api.get(`/intake/${caseId}/slots`);
      setSlots(data.slots || []);
      setLimits(data.upload);
      setIntakeStatus(data.intake_status);
      setCanAnalyze(data.can_analyze);
      if (data.analysis_complete) {
        await fetchResult();
      }
    } catch (e) {
      setError(detailText(e.response?.data?.detail, '获取状态失败'));
    } finally {
      setLoading(false);
    }
  }, [caseId]);  // eslint-disable-line react-hooks/exhaustive-deps

  const fetchResult = async () => {
    try {
      const { data } = await api.get(`/intake/${caseId}/result`);
      setAnalysisResult(data);
      if (onAnalysisComplete) onAnalysisComplete(data);
    } catch (e) {
      console.error('fetchResult failed', e);
    }
  };

  useEffect(() => { if (caseId) fetchSlots(); }, [caseId, fetchSlots]);

  // ── 触发分析 ──
  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const { data } = await api.post(`/intake/${caseId}/analyze`);
      setAnalysisResult(data);
      setIntakeStatus('complete');
      if (onAnalysisComplete) onAnalysisComplete(data);
      await fetchSlots();
    } catch (e) {
      setError(detailText(e.response?.data?.detail, '分析失败，请稍后重试'));
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
      <span className="text-gray-500">加载中...</span>
    </div>
  );

  // ── 分析完成视图 ──
  if (intakeStatus === 'complete' && analysisResult) {
    return <AnalysisResultView result={analysisResult} onReupload={fetchSlots} />;
  }

  const uploadedCount = slots.filter(s => s.status === 'uploaded').length;

  return (
    <div className="space-y-4">
      {/* 说明 */}
      <div className="bg-gradient-to-r from-[#1B3A6B]/5 to-[#C59736]/10 rounded-xl border border-[#1B3A6B]/20 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-[#1B3A6B] rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">首次资料提交</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              请上传以下三类文件。每一类都可以上传多个文件，也可以分多次追加。
            </p>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* 三个槽位 */}
      <div className="space-y-3">
        {slots.map(slot => (
          <IntakeSlotRow
            key={slot.slot_key}
            slot={slot}
            caseId={caseId}
            limits={limits}
            onChanged={fetchSlots}
          />
        ))}
      </div>

      {/* 进度 + 分析按钮 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        {/* 进度条 */}
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-gray-500">上传进度</span>
          <span className="font-medium text-gray-800">{uploadedCount} / 3</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-[#1B3A6B] to-[#C59736] rounded-full transition-all duration-500"
            style={{ width: `${(uploadedCount / 3) * 100}%` }}
          />
        </div>

        {/* 分析按钮 */}
        {!canAnalyze ? (
          <div className="text-center py-2 text-sm text-gray-400">
            请上传全部三类文件后提交分析
          </div>
        ) : (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full py-3 bg-gradient-to-r from-[#1B3A6B] to-[#2d5a9e] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-all"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                正在分析案件，请稍候...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                提交分析 · 获取专属证据清单
              </>
            )}
          </button>
        )}
        {canAnalyze && !analyzing && (
          <p className="text-xs text-center text-gray-400 mt-2">
            分析完成后将列出您需要补交的文件清单
          </p>
        )}
      </div>
    </div>
  );
}


// ── 单个首次提交槽位 ──
// 每类可有多个文件。追加：直接加进来；重传：新文件上传成功后，重传开始时的文件标记为「已替换」（仍保留、可查看）。
const fmtWhen = (v) => (v ? new Date(v).toLocaleString('zh-CN', { hour12: false }).replace(/:\d{2}$/, '') : '');

function SlotFile({ f, caseId, replaced = false }) {
  return (
    <li className={`flex items-start gap-2 py-2 ${replaced ? 'opacity-70' : ''}`}>
      <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${replaced ? 'text-gray-400' : 'text-green-600'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm break-all ${replaced ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{f.file_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {fmtSize(f.file_size)} · {fmtWhen(f.uploaded_at)}{f.uploaded_by ? ` · ${f.uploaded_by}` : ''}
          {replaced && ` · ${fmtWhen(f.replaced_at)} 被替换${f.replaced_by ? `（${f.replaced_by}）` : ''}`}
        </p>
      </div>
      <button type="button" onClick={() => openSignedLink(`/intake/${caseId}/file/${f.id}/link`)}
              className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
        <Eye className="w-3.5 h-3.5" />查看
      </button>
      {/* 下载：按上传时的原文件名保存 */}
      <button type="button" onClick={() => openSignedLink(`/intake/${caseId}/file/${f.id}/link?download=true`)}
              className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
        <Download className="w-3.5 h-3.5" />下载
      </button>
    </li>
  );
}

function IntakeSlotRow({ slot, caseId, limits, onChanged }) {
  const files = slot.files || [];
  const replacedFiles = slot.replaced_files || [];
  const has = files.length > 0;
  // mode: null | 'append' | 'replace'；重传时记下开始那一刻的有效文件
  const [mode, setMode] = useState(null);
  const [replaceIds, setReplaceIds] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const startReplace = () => {
    if (!window.confirm(`重传：新文件上传成功后，当前 ${files.length} 个文件会标记为「已替换」，仍保留可查。继续吗？`)) return;
    setReplaceIds(files.map((f) => f.id));
    setMode('replace');
  };

  const uploadOne = (file, onProgress) => {
    const fd = new FormData();
    fd.append('file', file, file.name);
    if (mode === 'replace' && replaceIds.length) fd.append('replace_ids', replaceIds.join(','));
    return api.post(`/intake/${caseId}/upload/${slot.slot_key}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,
      onUploadProgress: (e) => { if (e.total) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100))); },
    });
  };

  const close = () => { setMode(null); setReplaceIds([]); onChanged(); };

  return (
    <div className={`rounded-xl border p-4 transition-all ${has ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${has ? 'bg-green-100' : 'bg-gray-100'}`}>
          {has ? '✅' : SLOT_ICONS[slot.slot_key]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800">{slot.slot_key}. {slot.label_cn}</span>
            {slot.required && <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded">必需</span>}
            {has && <span className="text-xs text-green-700">{files.length} 个文件</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{slot.desc_cn}</p>
        </div>
      </div>

      {has && (
        <ul className="mt-2 divide-y divide-green-100">
          {files.map((f) => <SlotFile key={f.id} f={f} caseId={caseId} />)}
        </ul>
      )}

      {replacedFiles.length > 0 && (
        <div className="mt-2">
          <button type="button" onClick={() => setShowHistory((v) => !v)}
                  className="text-xs text-gray-500 inline-flex items-center gap-1">
            <History className="w-3.5 h-3.5" />已替换的文件（{replacedFiles.length}）{showHistory ? '收起' : '展开'}
          </button>
          {showHistory && (
            <ul className="mt-1 divide-y divide-gray-100">
              {replacedFiles.map((f) => <SlotFile key={f.id} f={f} caseId={caseId} replaced />)}
            </ul>
          )}
        </div>
      )}

      <div className="mt-3">
        {mode && limits ? (
          <div className="space-y-2">
            {mode === 'replace' && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                重传中：新文件上传成功后，原来的 {replaceIds.length} 个文件标记为「已替换」。
              </p>
            )}
            <MultiFileUploader limits={limits} uploadOne={uploadOne} onAllDone={close}
                               pickLabel={mode === 'replace' ? '选择新文件' : '选择文件'} />
            <button type="button" onClick={close} className="text-xs text-gray-500">收起</button>
          </div>
        ) : has ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode('append')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-[#1B3A6B] text-white hover:bg-[#152d54]">
              <Plus className="w-3.5 h-3.5" />追加文件
            </button>
            <button type="button" onClick={startReplace}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
              <RotateCcw className="w-3.5 h-3.5" />重传
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setMode('append')} disabled={!limits}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-[#1B3A6B] text-white hover:bg-[#152d54] disabled:opacity-50">
            <Plus className="w-3.5 h-3.5" />上传文件
          </button>
        )}
      </div>
    </div>
  );
}


// ── 分析结果展示 ──
function AnalysisResultView({ result, onReupload }) {
  const urgencyCls = URGENCY_COLOR[result.urgency] || URGENCY_COLOR.MEDIUM;

  return (
    <div className="space-y-4">
      {/* 案件类型 + 紧急度 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs text-gray-400">识别案件类型</span>
            <div className="text-lg font-bold text-[#1B3A6B]">
              {result.case_type_cn || result.case_type}
            </div>
          </div>
          {result.urgency && (
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${urgencyCls}`}>
              {result.urgency}
            </span>
          )}
        </div>
        {result.intake_summary && (
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">
            {result.intake_summary}
          </p>
        )}
        {result.deadline_note && (
          <div className="flex items-center gap-2 mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {result.deadline_note}
          </div>
        )}
      </div>

      {/* CBP 关注点 */}
      {result.cbp_concerns?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">CBP 关注点</h4>
          <div className="space-y-2">
            {result.cbp_concerns.map((c, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  c.priority === 'HIGH' ? 'bg-red-50 text-red-600' :
                  c.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' :
                  'bg-gray-100 text-gray-600'
                }`}>{c.priority}</span>
                <span className="text-sm text-gray-800">{c.concern_cn || c.concern}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 立案门槛 */}
      {result.missing_required?.length > 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-800">尚无法立案</div>
              <p className="text-sm text-red-700 mt-1">
                以下必需文件缺失，请补交后方可立案：
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {result.missing_required.map(code => (
                  <span key={code} className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded font-mono">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <div className="font-semibold text-green-800">可以立案</div>
            <p className="text-sm text-green-700">必需文件已齐全，请前往"文件管理"提交补充证据。</p>
          </div>
        </div>
      )}

      <div className="text-center">
        <button onClick={onReupload} className="text-xs text-gray-400 hover:text-gray-600 underline">
          重新提交首次资料
        </button>
      </div>
    </div>
  );
}
