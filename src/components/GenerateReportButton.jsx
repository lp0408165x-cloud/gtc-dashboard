/**
 * GenerateReportButton.jsx
 * 
 * 两个模式：
 * 1. Preview（预览）— 调用 /reports/{id}/preview，在页面内展示报告 JSON
 * 2. Download（下载）— 调用 /reports/{id}/generate，直接下载 Word 文档
 */

import { useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://gtc-ai-platform.onrender.com';

// ─── 辅助：状态颜色 ─────────────────────────────
const STATUS_STYLES = {
  COMPLETE:        'bg-green-100 text-green-700',
  CLAIMED:         'bg-blue-100 text-blue-700',
  GAP:             'bg-amber-100 text-amber-700',
  'CRITICAL GAP':  'bg-red-100 text-red-700',
  'N/A':           'bg-gray-100 text-gray-500',
  INCONSISTENCY:   'bg-orange-100 text-orange-700',
};

const PRIORITY_STYLES = {
  CRITICAL: 'bg-red-100 text-red-700',
  GAP:      'bg-amber-100 text-amber-700',
  MINOR:    'bg-blue-100 text-blue-700',
};

// ─── 报告预览组件 ───────────────────────────────
const ReportPreview = ({ report, onClose, onDownload, downloading }) => {
  const [openSections, setOpenSections] = useState({ concerns: true, gap: true, forecast: true });

  const toggle = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const gap = report.gap_analysis || {};
  const forecast = report.outcome_forecast || {};

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1B3A6B] to-[#2d5aa0] text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">CBP Compliance Report Preview</h2>
              <p className="text-blue-200 text-sm mt-1">
                {report.case_type} / {report.case_type_cn} · Risk: {report.risk_level}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onDownload}
                disabled={downloading}
                className="inline-flex items-center gap-2 bg-[#C59736] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-500 disabled:opacity-50 transition-colors"
              >
                {downloading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Word...</>
                  : <><Download className="w-4 h-4" /> Download Word</>
                }
              </button>
              <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* Executive Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-[#1B3A6B] mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Executive Summary
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {report.executive_summary}
            </p>
          </div>

          {/* Hidden Concerns */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggle('concerns')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-semibold text-[#1B3A6B]">
                CBP Hidden Concerns ({(report.hidden_concerns || []).length})
              </span>
              {openSections.concerns ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSections.concerns && (
              <div className="p-4 space-y-3">
                {(report.hidden_concerns || []).map((c, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${PRIORITY_STYLES[c.priority] || 'bg-gray-100 text-gray-600'}`}>
                      {c.priority}
                    </span>
                    <div>
                      <p className="font-medium text-sm text-gray-800">{c.concern} / {c.concern_cn}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{c.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gap Analysis */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggle('gap')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-semibold text-[#1B3A6B]">
                Evidence Gap Analysis — {gap.overall_completion || 0}% Complete
                {(gap.critical_gaps || []).length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                    {gap.critical_gaps.length} Critical Gaps
                  </span>
                )}
              </span>
              {openSections.gap ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSections.gap && (
              <div className="p-4 space-y-4">
                {/* Progress bar */}
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#1B3A6B] rounded-full h-2 transition-all"
                    style={{ width: `${gap.overall_completion || 0}%` }}
                  />
                </div>

                {/* Groups */}
                {(gap.groups || []).map((group, gi) => (
                  <div key={gi}>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {group.group} – {group.group_name}
                      <span className="ml-2 text-gray-400 font-normal">({group.completion}%)</span>
                    </p>
                    <div className="space-y-1">
                      {(group.items || []).map((item, ii) => (
                        <div key={ii} className="flex items-center gap-2 text-xs py-1 border-b border-gray-100 last:border-0">
                          <span className="text-gray-400 w-12 shrink-0">{item.ref}</span>
                          <span className="flex-1 text-gray-700">{item.name}</span>
                          <span className={`px-2 py-0.5 rounded shrink-0 ${STATUS_STYLES[item.status] || 'bg-gray-100'}`}>
                            {item.status}
                          </span>
                          {item.note && <span className="text-gray-400 max-w-32 truncate">{item.note}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Critical gaps */}
                {(gap.critical_gaps || []).length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 font-medium text-sm mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Critical Gaps — Must resolve before submission
                    </p>
                    {gap.critical_gaps.map((cg, i) => (
                      <p key={i} className="text-red-600 text-xs">• {cg}</p>
                    ))}
                  </div>
                )}

                {/* Action plan */}
                {(gap.action_plan || []).length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Action Plan</p>
                    <div className="space-y-2">
                      {gap.action_plan.map((action, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs p-2 bg-gray-50 rounded-lg">
                          <span className={`px-2 py-0.5 rounded shrink-0 ${PRIORITY_STYLES[action.priority] || 'bg-gray-100'}`}>
                            {action.priority}
                          </span>
                          <span className="flex-1 text-gray-700">{action.item}: {action.action}</span>
                          <span className="text-gray-400 shrink-0">{action.owner} · {action.deadline}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Outcome Forecast */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggle('forecast')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-semibold text-[#1B3A6B]">Outcome Forecast</span>
              {openSections.forecast ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {openSections.forecast && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Release / Close', value: forecast.p_release, color: 'bg-green-50 border-green-200 text-green-700' },
                    { label: 'Follow-up RFI', value: forecast.p_followup, color: 'bg-amber-50 border-amber-200 text-amber-700' },
                    { label: 'Adverse Action', value: forecast.p_adverse, color: 'bg-red-50 border-red-200 text-red-700' },
                  ].map((item, i) => (
                    <div key={i} className={`border rounded-xl p-3 text-center ${item.color}`}>
                      <p className="text-2xl font-bold">{item.value}%</p>
                      <p className="text-xs mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
                {forecast.analysis && (
                  <p className="text-sm text-gray-700 leading-relaxed">{forecast.analysis}</p>
                )}
              </div>
            )}
          </div>

          {/* Cover & Response Letter preview (collapsed) */}
          {report.cover_letter && (
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="font-semibold text-[#1B3A6B] mb-2 text-sm">Cover Letter (preview)</p>
              <p className="text-xs text-gray-600 whitespace-pre-wrap line-clamp-6 font-mono">
                {report.cover_letter.substring(0, 600)}...
              </p>
            </div>
          )}

          {/* Download CTA */}
          <div className="bg-gradient-to-r from-[#1B3A6B]/10 to-[#C59736]/10 border border-[#C59736]/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-[#1B3A6B]">Full Word Document</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Includes Cover Letter + Response Letter + Evidence Index + Gap Analysis + Forecast
              </p>
            </div>
            <button
              onClick={onDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 bg-[#1B3A6B] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-900 disabled:opacity-50 transition-colors"
            >
              {downloading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                : <><Download className="w-4 h-4" /> Download .docx</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── 主组件 ─────────────────────────────────────
const GenerateReportButton = ({ caseId, caseData }) => {
  const [previewing, setPreviewing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);

  const getAuthHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('gtc_token')}`,
  });

  // 预览：调用 /preview，返回 JSON
  const handlePreview = async () => {
    setPreviewing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/reports/${caseId}/preview`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const data = await res.json();
      setPreviewData(data.report);
    } catch (e) {
      setError(e.message || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  // 下载 Word 文档
  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/reports/${caseId}/generate`, {
        method: 'POST',
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_type: 'full_report' }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // 从 Content-Disposition 提取文件名
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename="?([^"]+)"?/);
      a.download = match ? match[1] : `GTC_CBP_Report_Case${caseId}.docx`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      setError(e.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {/* 按钮组 */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {/* 预览按钮 */}
          <button
            onClick={handlePreview}
            disabled={previewing || downloading}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1B3A6B] text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-900 disabled:opacity-50 transition-all hover:shadow-md"
          >
            {previewing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Case...</>
            ) : (
              <><Eye className="w-5 h-5" /> Preview CBP Report</>
            )}
          </button>

          {/* 直接下载按钮 */}
          <button
            onClick={handleDownload}
            disabled={downloading || previewing}
            className="inline-flex items-center justify-center gap-2 bg-[#C59736] text-white px-4 py-3 rounded-xl font-medium hover:bg-yellow-500 disabled:opacity-50 transition-all hover:shadow-md"
            title="Generate & Download Word document directly"
          >
            {downloading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Preview report in browser · or download Word document directly
        </p>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* 预览 Modal */}
      {previewData && (
        <ReportPreview
          report={previewData}
          onClose={() => setPreviewData(null)}
          onDownload={handleDownload}
          downloading={downloading}
        />
      )}
    </>
  );
};

export default GenerateReportButton;
