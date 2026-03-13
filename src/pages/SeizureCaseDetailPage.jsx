import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ChevronLeft, RefreshCw, Loader2, CheckCircle,
  XCircle, FileText, Shield, Clock, TrendingUp, Download,
  ChevronDown, ChevronRight, Sparkles, MessageSquare, Calendar
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://gtc-ai-platform.onrender.com';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const TABS = [
  { id: 'analysis', label: 'AI 分析', icon: Sparkles },
  { id: 'docs', label: '文件清单', icon: FileText },
  { id: 'strategy', label: '申诉策略', icon: Shield },
  { id: 'questions', label: '关键问题', icon: MessageSquare },
  { id: 'export', label: '报告导出', icon: Download },
];

function buildPrompt(c) {
  return `你是 GTC-AI Global 的美国海关合规专家，专注 CBP Seizure & Forfeiture 案件。

案件信息：
${JSON.stringify(c, null, 2)}

根据以上信息，生成 JSON 分析（只输出 JSON，不要输出其他文字）：

{
  "risk_level": "高|中|低",
  "risk_score": 1-10,
  "win_probability": "如 50-70%",
  "days_remaining": number,
  "summary": "3-4句案情摘要",
  "root_causes": ["原因1", "原因2"],
  "favorable_factors": ["有利因素1"],
  "unfavorable_factors": ["不利因素1"],
  "docs": [
    {"group": "A", "id": "A-1", "name": "文件名", "desc": "说明", "priority": "立即|重要|补充"}
  ],
  "strategies": [
    {"name": "Petition", "name_cn": "申诉书", "desc": "说明", "timeline": "周期", "success_rate": "胜算", "recommended": true}
  ],
  "timeline_plan": [
    {"day": "Day 1-3", "task": "任务", "status": "urgent|active|pending"}
  ],
  "key_questions": [
    {"num": 1, "question": "问题", "why": "重要性说明"}
  ]
}`;
}

export default function SeizureCaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analysis');
  const [caseData, setCaseData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [checklist, setChecklist] = useState({});
  const [answeredQ, setAnsweredQ] = useState({});

  const token = localStorage.getItem('gtc_token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchCase = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/v1/seizure-cases/${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCaseData(data.case);
        if (data.analysis) {
          setAnalysis(data.analysis);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCase(); }, [fetchCase]);

  const runAnalysis = async () => {
    if (!caseData) return;
    setAnalyzing(true);
    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3000,
          messages: [{ role: 'user', content: buildPrompt(caseData) }],
        }),
      });
      const data = await response.json();
      const raw = data.content?.[0]?.text || '';
      const clean = raw.replace(/```json|```/g, '').trim();
      const result = JSON.parse(clean);
      setAnalysis(result);
      // Save to backend
      await fetch(`${API_URL}/api/v1/seizure-cases/${id}/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ result_json: result }),
      });
    } catch (e) {
      console.error('Analysis failed:', e);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (caseData && !analysis && !analyzing) {
      runAnalysis();
    }
  }, [caseData]);

  const getDays = () => {
    if (!caseData?.notice_date) return null;
    const d = new Date(caseData.notice_date);
    d.setDate(d.getDate() + 30);
    return Math.ceil((d - new Date()) / 86400000);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-6 h-6 animate-spin text-red-500 mr-2" />
      <span className="text-gray-500">加载案件...</span>
    </div>
  );

  const days = getDays();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/cases/seizure')} className="p-1.5 rounded-lg hover:bg-gray-100">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-gray-900">{caseData?.ior_name || id}</h1>
                <span className="text-xs font-mono text-gray-400">{id}</span>
              </div>
              <p className="text-xs text-gray-500">{caseData?.goods_description || '—'} · {caseData?.port || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {days !== null && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                days <= 7 ? 'bg-red-50 text-red-700' : days <= 14 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
              }`}>
                <Clock className="w-3.5 h-3.5" />
                {days > 0 ? `${days} 天截止` : '已过期'}
              </div>
            )}
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60"
            >
              {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              重新分析
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mt-4">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === t.id
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Tab 1: AI Analysis */}
        {activeTab === 'analysis' && (
          <div className="space-y-4">
            {analyzing ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-3" />
                <p className="text-gray-600 font-medium">AI 正在分析案件...</p>
                <p className="text-gray-400 text-sm mt-1">通常需要 20-40 秒</p>
              </div>
            ) : !analysis ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center">
                <Sparkles className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">暂无分析结果</p>
                <button onClick={runAnalysis} className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg text-sm">
                  开始分析
                </button>
              </div>
            ) : (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    {
                      label: '风险评分',
                      value: `${analysis.risk_score}/10`,
                      sub: analysis.risk_level,
                      color: analysis.risk_score >= 7 ? 'text-red-600' : analysis.risk_score >= 4 ? 'text-amber-600' : 'text-green-600',
                      bg: analysis.risk_score >= 7 ? 'bg-red-50' : analysis.risk_score >= 4 ? 'bg-amber-50' : 'bg-green-50',
                    },
                    { label: '申诉胜算', value: analysis.win_probability, sub: '胜率区间', color: 'text-blue-600', bg: 'bg-blue-50' },
                    {
                      label: '剩余天数',
                      value: `${days ?? '—'}天`,
                      sub: '至30天截止',
                      color: (days ?? 99) <= 7 ? 'text-red-600' : 'text-amber-600',
                      bg: (days ?? 99) <= 7 ? 'bg-red-50' : 'bg-amber-50',
                    },
                    { label: '文件缺口', value: `${analysis.docs?.length ?? 0}项`, sub: '待收集', color: 'text-purple-600', bg: 'bg-purple-50' },
                  ].map((s, i) => (
                    <div key={i} className={`rounded-xl border p-4 ${s.bg}`}>
                      <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Summary Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-800 mb-3">案情综合分析</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed mb-4">
                    {analysis.summary}
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">根本原因</p>
                      <ul className="space-y-1">
                        {analysis.root_causes?.map((r, i) => (
                          <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-green-600 mb-2">✓ 有利因素</p>
                      <ul className="space-y-1">
                        {analysis.favorable_factors?.map((f, i) => (
                          <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                            <CheckCircle className="w-3 h-3 mt-0.5 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-red-600 mb-2">✗ 不利因素</p>
                      <ul className="space-y-1">
                        {analysis.unfavorable_factors?.map((f, i) => (
                          <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                            <XCircle className="w-3 h-3 mt-0.5 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Document Checklist */}
        {activeTab === 'docs' && (
          <div className="space-y-4">
            {!analysis?.docs ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                请先完成 AI 分析以生成文件清单
              </div>
            ) : (
              <>
                {/* Progress */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-gray-500">已收集文件</span>
                    <span className="font-semibold">
                      {Object.values(checklist).filter(Boolean).length} / {analysis.docs.length}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all"
                      style={{ width: `${(Object.values(checklist).filter(Boolean).length / analysis.docs.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Group docs by group */}
                {['A', 'B', 'C'].map(g => {
                  const groupDocs = analysis.docs.filter(d => d.group === g);
                  if (!groupDocs.length) return null;
                  const groupNames = { A: '商业与付款文件', B: '物流与报关文件', C: '合规与补充文件' };
                  return (
                    <div key={g} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-red-500 text-white text-xs font-bold flex items-center justify-center">{g}</span>
                        <span className="font-medium text-sm text-gray-700">{groupNames[g]}</span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {groupDocs.map(doc => (
                          <div key={doc.id} className="flex items-start gap-3 px-4 py-3">
                            <input
                              type="checkbox"
                              checked={!!checklist[doc.id]}
                              onChange={e => setChecklist(p => ({ ...p, [doc.id]: e.target.checked }))}
                              className="mt-1 accent-red-500"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800">{doc.name}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                  doc.priority === '立即' ? 'bg-red-50 text-red-600' :
                                  doc.priority === '重要' ? 'bg-amber-50 text-amber-600' :
                                  'bg-gray-100 text-gray-500'
                                }`}>{doc.priority}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{doc.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* Tab 3: Strategy */}
        {activeTab === 'strategy' && (
          <div className="space-y-4">
            {!analysis?.strategies ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                请先完成 AI 分析以生成申诉策略
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  {analysis.strategies.map((s, i) => (
                    <div key={i} className={`bg-white rounded-xl border-2 p-5 ${s.recommended ? 'border-red-400' : 'border-gray-200'}`}>
                      {s.recommended && (
                        <div className="flex items-center gap-1 text-xs font-semibold text-red-600 mb-3">
                          <Sparkles className="w-3.5 h-3.5" />推荐路径
                        </div>
                      )}
                      <h3 className="font-bold text-gray-900">{s.name}</h3>
                      <p className="text-sm text-gray-500">{s.name_cn}</p>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">预计周期</span>
                          <span className="font-medium text-gray-700">{s.timeline}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">胜算评估</span>
                          <span className="font-medium text-green-600">{s.success_rate}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-3 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Timeline */}
                {analysis.timeline_plan && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-red-500" />
                      时间节点规划
                    </h3>
                    <div className="relative">
                      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-100" />
                      <div className="space-y-4">
                        {analysis.timeline_plan.map((t, i) => (
                          <div key={i} className="flex gap-4 pl-8 relative">
                            <div className={`absolute left-1.5 w-3 h-3 rounded-full border-2 ${
                              t.status === 'urgent' ? 'bg-red-500 border-red-500' :
                              t.status === 'active' ? 'bg-amber-500 border-amber-500' :
                              'bg-gray-200 border-gray-300'
                            }`} style={{ top: '4px' }} />
                            <div>
                              <span className="text-xs font-mono text-gray-400">{t.day}</span>
                              <p className="text-sm text-gray-700">{t.task}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab 4: Key Questions */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {!analysis?.key_questions ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                请先完成 AI 分析以生成关键问题
              </div>
            ) : (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-amber-700 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  以下问题需要客户书面回答，直接影响申诉结果
                </div>
                <div className="space-y-3">
                  {analysis.key_questions.map((q, i) => (
                    <div key={i} className={`bg-white rounded-xl border p-4 ${answeredQ[i] ? 'border-green-200' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {q.num}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{q.question}</p>
                            <p className="text-xs text-gray-500 mt-1">{q.why}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setAnsweredQ(p => ({ ...p, [i]: !p[i] }))}
                          className={`shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                            answeredQ[i]
                              ? 'bg-green-50 text-green-600 border-green-200'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {answeredQ[i] ? '✓ 已回答' : '标记已回答'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 5: Export */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">导出报告</h3>
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_URL}/api/v1/seizure-cases/${id}/report`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      if (res.ok) {
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `GTC_Seizure_${id}_Report.docx`;
                        a.click();
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">合规分析报告（Word）</p>
                    <p className="text-xs text-gray-500">包含 AI 分析、文件清单、申诉策略</p>
                  </div>
                  <Download className="w-4 h-4 text-gray-400 ml-auto" />
                </button>

                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_URL}/api/v1/seizure-cases/${id}/guide`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      if (res.ok) {
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `GTC_Seizure_Guide_${id}.docx`;
                        a.click();
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">客户文件准备指引</p>
                    <p className="text-xs text-gray-500">告知客户需要准备哪些材料</p>
                  </div>
                  <Download className="w-4 h-4 text-gray-400 ml-auto" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
