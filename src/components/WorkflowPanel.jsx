// src/components/WorkflowPanel.jsx
// 嵌入 CaseDetailPage 使用：<WorkflowPanel caseId={id} userRole={currentUser?.role?.name} />

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle, Circle, AlertTriangle, Clock, ChevronDown, ChevronUp,
  ArrowRight, Shield, Zap, RefreshCw, Loader2, Lock, Unlock,
  ClipboardList, FileCheck, Package, Truck, CheckSquare, XCircle
} from 'lucide-react';
import { workflowAPI } from '../services/api';

// ── 阶段图标映射 ─────────────────────────────────────────────
const PHASE_ICONS = {
  1: ClipboardList,
  2: FileCheck,
  3: Clock,
  4: Shield,
  5: Package,
  6: Truck,
  7: CheckSquare,
};

// ── 阶段状态样式 ──────────────────────────────────────────────
const PHASE_STATUS_STYLE = {
  completed:   { bar: 'bg-green-500',  text: 'text-green-700',  bg: 'bg-green-50',  label: '已完成' },
  in_progress: { bar: 'bg-blue-500',   text: 'text-blue-700',   bg: 'bg-blue-50',   label: '进行中' },
  blocked:     { bar: 'bg-red-400',    text: 'text-red-700',    bg: 'bg-red-50',    label: '受阻' },
  pending:     { bar: 'bg-gray-200',   text: 'text-gray-500',   bg: 'bg-gray-50',   label: '待开始' },
  skipped:     { bar: 'bg-gray-300',   text: 'text-gray-400',   bg: 'bg-gray-50',   label: '已跳过' },
};

// ── 门控条件行组件 ────────────────────────────────────────────
const GateRow = ({ gate, onToggle, canEdit }) => {
  const met = gate.is_met || gate.manually_overridden;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
      met ? 'bg-green-50' : 'bg-gray-50'
    }`}>
      <button
        onClick={() => canEdit && onToggle(gate.gate_key, !gate.is_met)}
        disabled={!canEdit || gate.manually_overridden}
        className="mt-0.5 flex-shrink-0 focus:outline-none"
      >
        {met ? (
          <CheckCircle className={`w-5 h-5 ${gate.manually_overridden ? 'text-amber-500' : 'text-green-500'}`} />
        ) : (
          <Circle className="w-5 h-5 text-gray-300 hover:text-blue-400 transition-colors" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${met ? 'text-green-800 line-through decoration-green-400' : 'text-gray-700'}`}>
          {gate.gate_label_cn}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{gate.gate_label_en}</p>
        {gate.manually_overridden && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-1">
            <Unlock className="w-3 h-3" /> 管理员强制通过
          </span>
        )}
        {gate.met_by_name && !gate.manually_overridden && (
          <p className="text-xs text-gray-400 mt-0.5">
            由 {gate.met_by_name} 确认
          </p>
        )}
      </div>
    </div>
  );
};

// ── 阶段卡片组件 ──────────────────────────────────────────────
const PhaseCard = ({ phase, isActive, caseId, canEdit, onGateToggle }) => {
  const [expanded, setExpanded] = useState(isActive);
  const [gates, setGates]       = useState([]);
  const [loadingGates, setLoadingGates] = useState(false);
  // 初始展开时自动加载门控
  useEffect(() => {
    if (isActive) loadGates();
  }, []);

  const style = PHASE_STATUS_STYLE[phase.status] || PHASE_STATUS_STYLE.pending;
  const PhaseIcon = PHASE_ICONS[phase.phase_number] || ClipboardList;
  const gatesMet   = phase.gates_met   || 0;
  const gatesTotal = phase.gates_total || 0;

  // 展开时加载门控
  const loadGates = useCallback(async () => {
    if (gates.length > 0) return;
    setLoadingGates(true);
    try {
      const res = await workflowAPI.getGates(caseId, phase.phase_number);
      setGates(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch { /* silent */ }
    finally { setLoadingGates(false); }
  }, [caseId, phase.phase_number, gates.length]);

  const handleToggle = () => {
    setExpanded(v => !v);
    if (!expanded) loadGates();
  };

  // 门控更新回调
  const handleGateToggle = async (gateKey, isMet) => {
    try {
      await workflowAPI.updateGate(caseId, { gate_key: gateKey, is_met: isMet });
      setGates(prev => prev.map(g =>
        g.gate_key === gateKey ? { ...g, is_met: isMet } : g
      ));
      onGateToggle(); // 通知父组件刷新 summary
    } catch (err) {
      alert(err?.response?.data?.detail || '更新失败');
    }
  };

  return (
    <div className={`rounded-xl border transition-all ${
      isActive
        ? 'border-blue-200 shadow-md shadow-blue-50'
        : phase.status === 'completed'
          ? 'border-green-100'
          : 'border-gray-100'
    }`}>
      {/* 卡片头 */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 rounded-xl transition-colors"
      >
        {/* 阶段编号 + 图标 */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          phase.status === 'completed' ? 'bg-green-100' :
          phase.status === 'in_progress' ? 'bg-blue-100' :
          'bg-gray-100'
        }`}>
          <PhaseIcon className={`w-5 h-5 ${style.text}`} />
        </div>

        {/* 阶段名称 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400">Phase {phase.phase_number}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.bg} ${style.text}`}>
              {style.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{phase.phase_name_cn}</p>
          <p className="text-xs text-gray-400">{phase.phase_name_en}</p>
        </div>

        {/* 门控进度 */}
        {gatesTotal > 0 && (
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-xs text-gray-500">{gatesMet}/{gatesTotal} 条件</span>
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${style.bar}`}
                style={{ width: `${gatesTotal ? (gatesMet / gatesTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>

      {/* 展开内容：门控列表 */}
      {expanded && (
        <div className="px-4 pb-4">
          <div className="h-px bg-gray-100 mb-3" />
          {loadingGates ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            </div>
          ) : gates.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">暂无门控条件</p>
          ) : (
            <div className="space-y-2">
              {gates.map(gate => (
                <GateRow
                  key={gate.gate_key}
                  gate={gate}
                  canEdit={canEdit && phase.status === 'in_progress'}
                  onToggle={handleGateToggle}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── 主组件：WorkflowPanel ─────────────────────────────────────
const WorkflowPanel = ({ caseId, userRole }) => {
  const [summary,  setSummary]  = useState(null);
  const [phases,   setPhases]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [blockedGates, setBlockedGates] = useState([]);
  const [scoreData, setScoreData] = useState(null);
  const [initialized, setInitialized] = useState(true);

  const canEdit = ['admin', 'expert'].includes(userRole);

  // ── 数据加载 ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [sumRes, phasesRes] = await Promise.all([
        workflowAPI.getSummary(caseId),
        workflowAPI.getPhases(caseId),
      ]);
      setSummary(sumRes.data);
      setPhases(phasesRes.data || []);
      setInitialized(true);
    } catch (err) {
      if (err?.response?.status === 404) setInitialized(false);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  const loadScore = useCallback(async () => {
    try {
      const res = await workflowAPI.getReadiness(caseId);
      setScoreData(res.data);
    } catch { /* silent */ }
  }, [caseId]);

  useEffect(() => {
    loadData();
    loadScore();
  }, [loadData, loadScore]);

  // ── 初始化工作流 ──────────────────────────────────────────
  const handleInitialize = async () => {
    setLoading(true);
    try {
      await workflowAPI.initialize(caseId);
      await loadData();
      await loadScore();
    } catch (err) {
      alert(err?.response?.data?.detail || '初始化失败');
      setLoading(false);
    }
  };

  // ── 推进阶段 ──────────────────────────────────────────────
  const handleAdvance = async () => {
    setAdvancing(true);
    setBlockedGates([]);
    try {
      const res = await workflowAPI.advance(caseId);
      if (res.data.status === 'blocked') {
        setBlockedGates(res.data.unmet_gates || []);
      } else {
        await loadData();
        await loadScore();
      }
    } catch (err) {
      alert(err?.response?.data?.detail || '推进失败');
    } finally {
      setAdvancing(false);
    }
  };

  // ── 门控更新后刷新 summary ────────────────────────────────
  const handleGateToggle = useCallback(async () => {
    const [sumRes] = await Promise.all([workflowAPI.getSummary(caseId)]);
    setSummary(sumRes.data);
    loadScore();
  }, [caseId, loadScore]);

  // ── Enforcement Score 颜色 ────────────────────────────────
  const getScoreColor = (score) => {
    if (score >= 85) return { text: 'text-green-600', bg: 'bg-green-100', ring: 'ring-green-400' };
    if (score >= 70) return { text: 'text-blue-600',  bg: 'bg-blue-100',  ring: 'ring-blue-400' };
    if (score >= 50) return { text: 'text-amber-600', bg: 'bg-amber-100', ring: 'ring-amber-400' };
    return { text: 'text-red-600', bg: 'bg-red-100', ring: 'ring-red-400' };
  };

  // ── 渲染 ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-gray-500">加载工作流...</span>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <ClipboardList className="w-12 h-12 text-gray-300" />
        <div className="text-center">
          <p className="text-gray-600 font-medium">工作流尚未初始化</p>
          <p className="text-sm text-gray-400 mt-1">初始化后将自动创建7个标准阶段及门控条件</p>
        </div>
        {canEdit && (
          <button
            onClick={handleInitialize}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Zap className="w-4 h-4" />
            初始化工作流
          </button>
        )}
      </div>
    );
  }

  const score = scoreData?.enforcement_score ?? summary?.enforcement_score;
  const scoreStyle = score != null ? getScoreColor(score) : null;

  return (
    <div className="space-y-5">

      {/* ── 顶部 Summary Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 当前阶段 */}
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-blue-500 font-medium">当前阶段</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">
            {summary?.current_phase} <span className="text-sm font-normal">/ 7</span>
          </p>
          <p className="text-xs text-blue-600 mt-0.5 truncate">{summary?.current_phase_name_cn}</p>
        </div>

        {/* 门控进度 */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium">当前阶段门控</p>
          <p className="text-2xl font-bold text-gray-700 mt-1">
            {summary?.gates_met} <span className="text-sm font-normal">/ {summary?.gates_total}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">条件已满足</p>
        </div>

        {/* Enforcement Score */}
        <div className={`rounded-xl p-4 ${scoreStyle?.bg || 'bg-gray-50'}`}>
          <p className={`text-xs font-medium ${scoreStyle?.text || 'text-gray-500'}`}>执法准备度</p>
          <p className={`text-2xl font-bold mt-1 ${scoreStyle?.text || 'text-gray-500'}`}>
            {score != null ? score : '—'}
            {score != null && <span className="text-sm font-normal"> / 100</span>}
          </p>
          <p className={`text-xs mt-0.5 ${scoreStyle?.text || 'text-gray-400'}`}>
            {scoreData?.risk_level || '待计算'}
          </p>
        </div>

        {/* 工作流状态 */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-medium">工作流状态</p>
          <p className="text-sm font-bold text-gray-700 mt-1 capitalize">{summary?.workflow_status}</p>
          <p className="text-xs text-gray-400 mt-0.5">{summary?.case_type}</p>
        </div>
      </div>

      {/* ── 整体进度条 ── */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Phase 1 客户摄入</span>
          <span>Phase 7 案件关闭</span>
        </div>
        <div className="flex gap-1">
          {[1,2,3,4,5,6,7].map(n => {
            const phase = phases.find(p => p.phase_number === n);
            const st = phase?.status || 'pending';
            return (
              <div
                key={n}
                className={`flex-1 h-2 rounded-full transition-all ${
                  st === 'completed'   ? 'bg-green-500' :
                  st === 'in_progress' ? 'bg-blue-500 animate-pulse' :
                  st === 'blocked'     ? 'bg-red-400' :
                  'bg-gray-200'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* ── 阻塞提示 ── */}
      {blockedGates.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm font-semibold text-red-700">推进受阻 — 以下门控条件未满足</p>
          </div>
          <ul className="space-y-1">
            {blockedGates.map(g => (
              <li key={g.gate_key} className="text-xs text-red-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {g.label_cn || g.gate_key}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── 阶段列表 ── */}
      <div className="space-y-3">
        {phases.map(phase => (
          <PhaseCard
            key={phase.phase_number}
            phase={phase}
            isActive={phase.phase_number === summary?.current_phase}
            caseId={caseId}
            canEdit={canEdit}
            onGateToggle={handleGateToggle}
          />
        ))}
      </div>

      {/* ── 推进按钮 ── */}
      {canEdit && summary?.current_phase < 7 && summary?.workflow_status === 'active' && (
        <button
          onClick={handleAdvance}
          disabled={advancing}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-medium text-sm transition-colors"
        >
          {advancing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> 验证门控条件...</>
          ) : (
            <><ArrowRight className="w-4 h-4" /> 推进至 Phase {(summary?.current_phase || 0) + 1}</>
          )}
        </button>
      )}

      {summary?.current_phase === 7 && (
        <div className="flex items-center justify-center gap-2 py-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium text-green-700">案件已完成所有阶段</span>
        </div>
      )}

      {/* ── 刷新按钮 ── */}
      <button
        onClick={() => { loadData(); loadScore(); }}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" /> 刷新工作流
      </button>
    </div>
  );
};

export default WorkflowPanel;
