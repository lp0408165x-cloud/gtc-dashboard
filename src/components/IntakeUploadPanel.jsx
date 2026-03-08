import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload, FileText, CheckCircle, AlertCircle, Loader2,
  ChevronRight, Sparkles, AlertTriangle, Eye, RotateCcw
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://gtc-ai-platform.onrender.com';

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
  const [uploading, setUploading]   = useState(null);   // slot_key being uploaded
  const [analyzing, setAnalyzing]   = useState(false);
  const [error, setError]           = useState(null);

  const token = localStorage.getItem('gtc_token');
  const headers = { Authorization: `Bearer ${token}` };

  // ── 获取槽位状态 ──
  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/v1/intake/${caseId}/slots`, { headers });
      if (!res.ok) throw new Error('获取状态失败');
      const data = await res.json();
      setSlots(data.slots || []);
      setIntakeStatus(data.intake_status);
      setCanAnalyze(data.can_analyze);
      if (data.analysis_complete) {
        await fetchResult();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  const fetchResult = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/intake/${caseId}/result`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
        if (onAnalysisComplete) onAnalysisComplete(data);
      }
    } catch (e) {
      logger.error('fetchResult failed', e);
    }
  };

  useEffect(() => { if (caseId) fetchSlots(); }, [caseId, fetchSlots]);

  // ── 上传文件 ──
  const handleUpload = async (slotKey, file) => {
    if (!file) return;
    setUploading(slotKey);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(
        `${API_URL}/api/v1/intake/${caseId}/upload/${slotKey}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || '上传失败');
      }
      await fetchSlots();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(null);
    }
  };

  // ── 触发分析 ──
  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/api/v1/intake/${caseId}/analyze`,
        { method: 'POST', headers }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || '分析失败');
      }
      const data = await res.json();
      setAnalysisResult(data);
      setIntakeStatus('complete');
      if (onAnalysisComplete) onAnalysisComplete(data);
      await fetchSlots();
    } catch (e) {
      setError(e.message);
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
              请上传以下三类文件。每类文件请合并为一个 PDF，
              文件名格式：<span className="font-mono text-[#1B3A6B]">{`{序号}-{报关号}-{类别}`}</span>
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
            uploading={uploading === slot.slot_key}
            onUpload={(file) => handleUpload(slot.slot_key, file)}
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
                AI 正在分析案件，请稍候...
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
            分析完成后将自动生成您专属的文件补交清单
          </p>
        )}
      </div>
    </div>
  );
}


// ── 单个首次提交槽位 ──
function IntakeSlotRow({ slot, uploading, onUpload }) {
  const inputId = `intake-${slot.slot_key}`;
  const uploaded = slot.status === 'uploaded';

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) { onUpload(file); e.target.value = ''; }
  };

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      uploaded
        ? 'bg-green-50 border-green-200'
        : 'bg-white border-gray-200 hover:border-[#1B3A6B]/30'
    }`}>
      <div className="flex items-start gap-3">
        {/* 序号图标 */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
          uploaded ? 'bg-green-100' : 'bg-gray-100'
        }`}>
          {uploaded ? '✅' : SLOT_ICONS[slot.slot_key]}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">{slot.slot_key}. {slot.label_cn}</span>
            {slot.required && (
              <span className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded">必需</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{slot.desc_cn}</p>
          {uploaded && slot.file_name && (
            <div className="flex items-center gap-1 mt-1.5">
              <FileText className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs text-green-700 truncate">{slot.file_name}</span>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1 font-mono">
            文件名：<span className="text-[#1B3A6B] font-semibold">{slot.slot_key}-报关号-{slot.label_cn}.pdf</span>（请合并为一个PDF上传）
          </p>
        </div>

        {/* 操作 */}
        <div className="shrink-0 flex items-center gap-2">
          {uploaded && slot.file_url && (
            <a
              href={slot.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              <Eye className="w-3.5 h-3.5" />
              查看
            </a>
          )}

          <input type="file" id={inputId} className="hidden"
            accept=".pdf,.jpg,.jpeg,.png" onChange={handleChange} />
          <label htmlFor={inputId}
            className={`cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
              uploading
                ? 'opacity-60 pointer-events-none bg-gray-100 text-gray-400'
                : uploaded
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-[#1B3A6B] text-white hover:bg-[#152d54]'
            }`}
          >
            {uploading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />上传中...</>
              : uploaded
                ? <><RotateCcw className="w-3.5 h-3.5" />重传</>
                : <><Upload className="w-3.5 h-3.5" />上传</>
            }
          </label>
        </div>
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
