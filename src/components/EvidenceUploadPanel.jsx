import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload, CheckCircle, XCircle, AlertCircle, FileText, Trash2,
  ChevronDown, ChevronRight, Eye, RefreshCw, Shield, Info
} from 'lucide-react';
import api from '../services/api';

// 状态配置
const statusConfig = {
  empty:    { icon: null,        color: 'border-slate-700/40',     bg: 'bg-slate-900/40',   label: '' },
  uploaded: { icon: CheckCircle, color: 'border-emerald-500/30',   bg: 'bg-emerald-500/5',  label: '已上传' },
  verified: { icon: Shield,      color: 'border-blue-500/30',      bg: 'bg-blue-500/5',     label: '已验证' },
  rejected: { icon: XCircle,     color: 'border-red-500/30',       bg: 'bg-red-500/5',      label: '已退回' },
};

const reqConfig = {
  R: { label: '必需', dot: 'bg-red-400',     badge: 'text-red-400 bg-red-500/10 ring-red-500/20' },
  O: { label: '可选', dot: 'bg-slate-500',   badge: 'text-slate-500 bg-slate-500/10 ring-slate-500/20' },
  C: { label: '条件', dot: 'bg-amber-400',   badge: 'text-amber-400 bg-amber-500/10 ring-amber-500/20' },
};

// ============================================
// Main Component
// ============================================
export default function EvidenceUploadPanel({ caseId, caseType, readOnly = false }) {
  const [slots, setSlots] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [slotsRes, summaryRes] = await Promise.all([
        api.get(`/api/evidence/cases/${caseId}/slots`),
        api.get(`/api/evidence/cases/${caseId}/summary`)
      ]);
      setSlots(slotsRes.data);
      setSummary(summaryRes.data);
      // 默认展开所有组
      const groups = {};
      slotsRes.data.forEach(s => { groups[s.evidence_group] = true; });
      setExpandedGroups(prev => Object.keys(prev).length ? prev : groups);
    } catch (err) {
      if (err.response?.status === 404) {
        // 槽位未初始化，尝试初始化
        try {
          await api.post(`/api/evidence/cases/${caseId}/init-slots`);
          return loadData();
        } catch (initErr) {
          setError(initErr.response?.data?.detail || '初始化失败');
        }
      } else {
        setError('加载失败');
      }
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { loadData(); }, [loadData]);

  // 分组
  const groupedSlots = {};
  slots.forEach(slot => {
    const g = slot.evidence_group;
    if (!groupedSlots[g]) groupedSlots[g] = { name: slot.group_name_cn, slots: [] };
    groupedSlots[g].slots.push(slot);
  });

  const toggleGroup = (g) => setExpandedGroups(prev => ({ ...prev, [g]: !prev[g] }));

  // 上传
  const handleUpload = async (evidenceCode, file) => {
    setUploading(prev => ({ ...prev, [evidenceCode]: true }));
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/api/evidence/cases/${caseId}/upload/${evidenceCode}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || `上传 ${evidenceCode} 失败`);
    } finally {
      setUploading(prev => ({ ...prev, [evidenceCode]: false }));
    }
  };

  // 删除
  const handleRemove = async (evidenceCode) => {
    if (!window.confirm(`确认移除 ${evidenceCode} 的文件？`)) return;
    try {
      await api.delete(`/api/evidence/cases/${caseId}/upload/${evidenceCode}`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || '移除失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary Bar */}
      {summary && (
        <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-white">证据文件上传</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                按标准槽位上传文件，确保AI准确识别
              </p>
            </div>
            <button onClick={loadData} className="text-slate-500 hover:text-white transition p-1.5 rounded-lg hover:bg-white/5">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1">
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    summary.completion_percent >= 80
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : summary.completion_percent >= 50
                        ? 'bg-gradient-to-r from-blue-600 to-blue-400'
                        : 'bg-gradient-to-r from-amber-500 to-amber-400'
                  }`}
                  style={{ width: `${summary.completion_percent}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-bold text-white tabular-nums w-12 text-right">
              {summary.completion_percent}%
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: '总槽位', value: summary.total_slots, color: 'text-slate-400' },
              { label: '必需', value: summary.required_count, color: 'text-amber-400' },
              { label: '已上传', value: summary.uploaded_count, color: 'text-emerald-400' },
              { label: 'Gap', value: summary.gap_count, color: summary.gap_count > 0 ? 'text-red-400' : 'text-emerald-400' },
            ].map((s, i) => (
              <div key={i} className="bg-white/[0.02] rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider">{s.label}</p>
                <p className={`text-lg font-bold ${s.color} tabular-nums`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-red-400 text-sm">{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Groups */}
      {Object.entries(groupedSlots).map(([group, { name, slots: groupSlots }]) => {
        const groupSummary = summary?.groups?.find(g => g.group === group);
        const isExpanded = expandedGroups[group];

        return (
          <div key={group} className="bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded ring-1 ring-blue-500/20">
                  {group}
                </span>
                <span className="text-sm font-medium text-white">{name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                {groupSummary && (
                  <>
                    <span className="text-slate-500">{groupSummary.uploaded}/{groupSummary.total}</span>
                    {groupSummary.gap > 0 && (
                      <span className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded ring-1 ring-red-500/20">
                        {groupSummary.gap} Gap
                      </span>
                    )}
                  </>
                )}
              </div>
            </button>

            {/* Slots Grid */}
            {isExpanded && (
              <div className="px-5 pb-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {groupSlots.map(slot => (
                  <SlotCard
                    key={slot.evidence_code}
                    slot={slot}
                    uploading={uploading[slot.evidence_code]}
                    readOnly={readOnly}
                    onUpload={handleUpload}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ============================================
// Single Slot Card
// ============================================
function SlotCard({ slot, uploading, readOnly, onUpload, onRemove }) {
  const [dragOver, setDragOver] = useState(false);
  const status = statusConfig[slot.status] || statusConfig.empty;
  const req = reqConfig[slot.requirement] || reqConfig.O;
  const StatusIcon = status.icon;

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(slot.evidence_code, file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(slot.evidence_code, file);
    e.target.value = '';
  };

  return (
    <div
      className={`relative rounded-xl border transition-all ${status.color} ${status.bg} ${
        dragOver ? 'border-blue-400 bg-blue-500/10 scale-[1.02]' : ''
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="p-3.5">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-500">{slot.evidence_code}</span>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ring-1 ${req.badge}`}>
              {req.label}
            </span>
          </div>
          {StatusIcon && (
            <StatusIcon className={`w-4 h-4 ${
              slot.status === 'uploaded' ? 'text-emerald-400' :
              slot.status === 'verified' ? 'text-blue-400' :
              slot.status === 'rejected' ? 'text-red-400' : 'text-slate-600'
            }`} />
          )}
        </div>

        {/* Label */}
        <h4 className="text-sm font-medium text-white mb-0.5 leading-tight">{slot.label_cn}</h4>
        <p className="text-[10px] text-slate-600 mb-2">{slot.label_en}</p>

        {/* Source */}
        {slot.source_party && (
          <p className="text-[9px] text-slate-600 mb-2">来源: {slot.source_party}</p>
        )}

        {/* Condition note */}
        {slot.requirement === 'C' && slot.condition_note && (
          <div className="flex items-start gap-1.5 mb-2 p-1.5 bg-amber-500/5 rounded-lg">
            <Info className="w-3 h-3 text-amber-400/60 mt-0.5 flex-shrink-0" />
            <span className="text-[9px] text-amber-400/80">{slot.condition_note}</span>
          </div>
        )}

        {/* Content Area */}
        {slot.status === 'empty' && !readOnly ? (
          /* Empty - Upload Zone */
          <label className="block cursor-pointer">
            <div className={`border border-dashed rounded-lg p-3 text-center transition
              ${dragOver ? 'border-blue-400 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500'}
              ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
              ) : (
                <>
                  <Upload className="w-5 h-5 text-slate-600 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-600">拖拽或点击上传</p>
                  <p className="text-[9px] text-slate-700 mt-0.5">{slot.accept_formats}</p>
                </>
              )}
            </div>
            <input type="file" className="hidden" accept={slot.accept_formats} onChange={handleFileSelect} disabled={uploading} />
          </label>
        ) : slot.status !== 'empty' ? (
          /* Has File */
          <div className="bg-slate-950/40 rounded-lg p-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span className="text-xs text-slate-300 truncate flex-1">{slot.file_name || '已上传'}</span>
              <div className="flex items-center gap-1">
                {slot.file_url && (
                  <button className="p-1 hover:bg-white/5 rounded transition" title="查看">
                    <Eye className="w-3.5 h-3.5 text-slate-500 hover:text-white" />
                  </button>
                )}
                {!readOnly && (
                  <button onClick={() => onRemove(slot.evidence_code)} className="p-1 hover:bg-red-500/10 rounded transition" title="移除">
                    <Trash2 className="w-3.5 h-3.5 text-slate-600 hover:text-red-400" />
                  </button>
                )}
              </div>
            </div>
            {slot.status === 'rejected' && slot.reject_reason && (
              <div className="mt-2 p-1.5 bg-red-500/10 rounded text-[9px] text-red-400">
                退回原因: {slot.reject_reason}
              </div>
            )}
          </div>
        ) : (
          /* Read-only empty */
          <div className="border border-dashed border-slate-800 rounded-lg p-3 text-center">
            <p className="text-[10px] text-slate-700">未上传</p>
          </div>
        )}
      </div>
    </div>
  );
}
