import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload, CheckCircle, XCircle, AlertCircle, Clock,
  ChevronDown, ChevronRight, FileText, Trash2, Eye,
  Loader2, Shield, RefreshCw, AlertTriangle
} from 'lucide-react';
import { filesAPI } from '../services/api';
const API_URL = import.meta.env.VITE_API_URL;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// 状态配置
const STATUS_CONFIG = {
  empty: { label: '待上传', labelEn: 'Pending', color: 'text-gray-400', bg: 'bg-gray-50', icon: Clock },
  uploaded: { label: '已上传', labelEn: 'Uploaded', color: 'text-blue-600', bg: 'bg-blue-50', icon: Upload },
  verified: { label: '已验证', labelEn: 'Verified', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
  rejected: { label: '已拒绝', labelEn: 'Rejected', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
  na: { label: '不适用', labelEn: 'N/A', color: 'text-gray-300', bg: 'bg-gray-50', icon: null },
};

const REQ_CONFIG = {
  R: { label: '必需', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  O: { label: '可选', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
  C: { label: '条件', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
};

// 校验状态配置（面向客户 — 不出现 AI 字样）
const VALIDATION_STATUS_CONFIG = {
  matched: {
    label: '专家已校验',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: CheckCircle,
  },
  mismatched: {
    label: '文件内容不匹配',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: XCircle,
  },
  blank: {
    label: '文件为空白',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertTriangle,
  },
  unreadable: {
    label: '无法识别内容',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertCircle,
  },
  error: {
    label: '校验暂不可用',
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: AlertCircle,
  },
  skipped: {
    label: '已跳过',
    color: 'text-gray-400',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: null,
  },
};

// 构造 Supabase Storage 查看 URL
function getFileViewUrl(fileUrl) {
  if (!fileUrl) return '#';
  if (fileUrl.startsWith('http')) return fileUrl;
  const base = SUPABASE_URL || '';
  return `${base}/storage/v1/object/public/case-files/${fileUrl}`;
}

export default function EvidenceUploadPanel({ caseId, caseType, onSlotsLoaded }) {
  const [slots, setSlots] = useState([]);
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [initializing, setInitializing] = useState(false);
  const [validationAlert, setValidationAlert] = useState(null);

  const token = localStorage.getItem('gtc_token');
  const headers = { 'Authorization': `Bearer ${token}` };

  // 获取槽位数据
  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/v1/evidence/cases/${caseId}/slots`, { headers });

      if (res.status === 404) {
        if (caseType) {
          await initSlots();
          return;
        }
        setError('请先选择案件类型');
        return;
      }

      if (!res.ok) throw new Error('获取证据槽位失败');

      const data = await res.json();
      setSlots(data.slots || []);
      setGroups(data.groups || []);
      setStats({
        total: data.total_slots,
        required: data.required_count,
        uploaded: data.uploaded_count,
        verified: data.verified_count,
        completion: data.completion_pct,
      });

      const expanded = {};
      (data.groups || []).forEach(g => {
        if (g.empty_required > 0) expanded[g.group_code] = true;
      });
      setExpandedGroups(prev => ({ ...expanded, ...prev }));

      if (onSlotsLoaded) onSlotsLoaded(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [caseId, caseType]);

  // 初始化槽位
  const initSlots = async () => {
    try {
      setInitializing(true);
      const res = await fetch(`${API_URL}/api/v1/evidence/cases/${caseId}/init-slots`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ case_type: caseType }),
      });
      if (!res.ok) throw new Error('初始化槽位失败');
      await fetchSlots();
    } catch (err) {
      setError(err.message);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    if (caseId) fetchSlots();
  }, [caseId, fetchSlots]);

  // 文件上传处理（含自动校验）
  const handleFileUpload = async (slotId, evidenceCode, file) => {
    setUploadingSlot(slotId);
    setValidationAlert(null);
    try {
      // 1. 上传文件
      const uploadData = await filesAPI.upload(caseId, file);

      // 2. 更新槽位状态（后端自动触发校验）
      const patchRes = await fetch(`${API_URL}/api/v1/evidence/slots/${slotId}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'uploaded',
          file_name: file.name,
          file_url: uploadData.storage_url || uploadData.url || '',
          file_size: file.size,
          document_id: null,
        }),
      });

      if (!patchRes.ok) throw new Error('更新槽位失败');

      const patchData = await patchRes.json();

      // 3. 检查校验结果
      if (patchData.ai_validation) {
        const v = patchData.ai_validation;
        if (v.should_reject) {
          setValidationAlert({
            slotId,
            evidenceCode,
            status: v.status,
            suggestion_cn: v.suggestion_cn,
            suggestion_en: v.suggestion_en,
            detected_type: v.detected_type,
            detected_code: v.detected_code,
          });
        }
      }

      await fetchSlots();
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingSlot(null);
    }
  };

  // 按组分类槽位
  const groupedSlots = {};
  slots.forEach(slot => {
    const gc = slot.group_code;
    if (!groupedSlots[gc]) groupedSlots[gc] = [];
    groupedSlots[gc].push(slot);
  });

  const toggleGroup = (code) => {
    setExpandedGroups(prev => ({ ...prev, [code]: !prev[code] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500">加载证据清单...</span>
      </div>
    );
  }

  if (error && !slots.length) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <p className="text-gray-600 mb-4">{error}</p>
        {caseType && (
          <button
            onClick={initSlots}
            disabled={initializing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {initializing ? '初始化中...' : '初始化证据槽位'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 文件校验提醒 */}
      {validationAlert && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-red-800 mb-1">
                文件校验提醒 — 槽位 {validationAlert.evidenceCode}
              </div>
              <p className="text-sm text-red-700 mb-2">{validationAlert.suggestion_cn}</p>
              <p className="text-xs text-red-500">{validationAlert.suggestion_en}</p>
              {validationAlert.detected_type && (
                <p className="text-xs text-red-500 mt-1">
                  检测类型: {validationAlert.detected_type} ({validationAlert.detected_code})
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setValidationAlert(null)}
                  className="px-3 py-1.5 text-xs bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50"
                >
                  知道了
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 统计摘要 */}
      {stats && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-800">证据完成度</span>
            </div>
            <button onClick={fetchSlots} className="text-gray-400 hover:text-gray-600">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* 进度条 */}
          <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.completion}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              必需文件: <span className="font-medium text-gray-800">{stats.uploaded}/{stats.required}</span>
            </span>
            <span className="font-semibold text-blue-600">{stats.completion}%</span>
          </div>

          {/* 状态统计 */}
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-gray-800">{stats.total}</div>
              <div className="text-xs text-gray-400">总计</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-red-600">{stats.required}</div>
              <div className="text-xs text-gray-400">必需</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-blue-600">{stats.uploaded}</div>
              <div className="text-xs text-gray-400">已上传</div>
            </div>
            <div className="text-center flex-1">
              <div className="text-lg font-bold text-green-600">{stats.verified}</div>
              <div className="text-xs text-gray-400">已验证</div>
            </div>
          </div>
        </div>
      )}

      {/* 分组列表 */}
      {groups.map(group => (
        <div key={group.group_code} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleGroup(group.group_code)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {expandedGroups[group.group_code]
                ? <ChevronDown className="w-5 h-5 text-gray-400" />
                : <ChevronRight className="w-5 h-5 text-gray-400" />
              }
              <div className="text-left">
                <div className="font-semibold text-gray-800">
                  {group.group_code} – {group.group_name_cn}
                </div>
                <div className="text-xs text-gray-400">{group.group_name_en}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {group.empty_required > 0 && (
                <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full">
                  缺 {group.empty_required} 项必需
                </span>
              )}
              <span className="text-sm text-gray-500">
                {group.uploaded}/{group.total}
              </span>
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${group.total > 0 ? (group.uploaded / group.total * 100) : 0}%` }}
                />
              </div>
            </div>
          </button>

          {expandedGroups[group.group_code] && (
            <div className="border-t border-gray-100">
              {(groupedSlots[group.group_code] || []).map(slot => (
                <SlotRow
                  key={slot.id}
                  slot={slot}
                  uploading={uploadingSlot === slot.id}
                  onUpload={(file) => handleFileUpload(slot.id, slot.evidence_code, file)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


// 单个槽位行
function SlotRow({ slot, uploading, onUpload }) {
  const [dragOver, setDragOver] = useState(false);
  const statusCfg = STATUS_CONFIG[slot.status] || STATUS_CONFIG.empty;
  const reqCfg = REQ_CONFIG[slot.requirement] || REQ_CONFIG.O;
  const StatusIcon = statusCfg.icon;

  // 校验状态
  const vStatus = slot.ai_validation_status;
  const vCfg = vStatus ? VALIDATION_STATUS_CONFIG[vStatus] : null;
  const VIcon = vCfg?.icon;

  const validateFormat = (file) => {
    if (!slot.accepted_formats || slot.accepted_formats.length === 0) return true;
    const ext = file.name.split('.').pop().toUpperCase();
    const formatMap = {
      'PDF': ['PDF'],
      'IMAGE': ['JPG', 'JPEG', 'PNG', 'GIF', 'BMP', 'TIFF'],
      'EXCEL': ['XLS', 'XLSX', 'CSV'],
      'WORD': ['DOC', 'DOCX'],
      'JPG': ['JPG', 'JPEG'],
      'PNG': ['PNG'],
      'CSV': ['CSV'],
    };
    const allowed = slot.accepted_formats.flatMap(f => formatMap[f.toUpperCase()] || [f.toUpperCase()]);
    return allowed.includes(ext);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!validateFormat(file)) {
      alert(`格式不符：${slot.label_cn} 仅接受 ${slot.accepted_formats.join(', ')} 格式`);
      return;
    }
    onUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateFormat(file)) {
      alert(`格式不符：${slot.label_cn} 仅接受 ${slot.accepted_formats.join(', ')} 格式`);
      e.target.value = '';
      return;
    }
    onUpload(file);
    e.target.value = '';
  };

  const inputId = `file-${slot.id}`;
  const viewUrl = getFileViewUrl(slot.file_url);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 transition-colors ${
        dragOver ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* 证据编号 */}
      <div className="w-14 text-xs font-mono text-gray-400 shrink-0">
        {slot.evidence_code}
      </div>

      {/* 需求标记 */}
      <span className={`text-xs px-1.5 py-0.5 rounded ${reqCfg.bg} ${reqCfg.color} shrink-0`}>
        {reqCfg.label}
      </span>

      {/* 标签 */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-800 truncate">{slot.label_cn}</div>
        <div className="text-xs text-gray-400 truncate">{slot.label_en}</div>
        {slot.status === 'uploaded' && slot.file_name && (
          <div className="flex items-center gap-1 mt-1">
            <FileText className="w-3 h-3 text-blue-500" />
            <span className="text-xs text-blue-600 truncate">{slot.file_name}</span>
          </div>
        )}
        {slot.status === 'rejected' && slot.reject_reason && (
          <div className="text-xs text-red-500 mt-1">拒绝原因: {slot.reject_reason}</div>
        )}

        {/* 校验提示（mismatched / blank / unreadable） */}
        {vStatus && vStatus !== 'matched' && vStatus !== 'skipped' && slot.ai_suggestion && (
          <div className={`flex items-start gap-1 mt-1.5 px-2 py-1 rounded text-xs ${vCfg?.bg || 'bg-gray-50'} ${vCfg?.color || 'text-gray-500'}`}>
            {VIcon && <VIcon className="w-3 h-3 shrink-0 mt-0.5" />}
            <span>{slot.ai_suggestion}</span>
          </div>
        )}
      </div>

      {/* 校验徽章 */}
      {vStatus && vCfg && (
        <div className={`flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-xs border ${vCfg.bg} ${vCfg.color} ${vCfg.border}`}
          title={slot.ai_suggestion || vCfg.label}
        >
          {VIcon && <VIcon className="w-3 h-3" />}
          <span className="hidden sm:inline">{vCfg.label}</span>
        </div>
      )}

      {/* 来源方 */}
      <div className="text-xs text-gray-400 shrink-0 hidden sm:block w-16 text-center">
        {slot.source_party}
      </div>

      {/* 状态 */}
      <div className={`flex items-center gap-1 shrink-0 ${statusCfg.color}`}>
        {StatusIcon && <StatusIcon className="w-4 h-4" />}
        <span className="text-xs">{statusCfg.label}</span>
      </div>

      {/* 操作按钮 */}
      <div className="shrink-0">
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        ) : slot.status === 'empty' || slot.status === 'rejected' ? (
          <>
            <input
              type="file"
              id={inputId}
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            />
            <label
              htmlFor={inputId}
              className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              上传
            </label>
          </>
        ) : slot.status === 'uploaded' && slot.file_url ? (
          <a
            href={viewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            <Eye className="w-3.5 h-3.5" />
            查看
          </a>
        ) : slot.status === 'verified' ? (
          <span className="text-xs text-green-500">✓</span>
        ) : null}
      </div>
    </div>
  );
}
