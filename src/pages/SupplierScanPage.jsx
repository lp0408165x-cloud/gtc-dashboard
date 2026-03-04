import { useState } from 'react';
import {
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.gtc-ai-global.com';

const RiskBadge = ({ level }) => {
  const config = {
    critical: { label: '严重匹配', color: 'bg-red-100 text-red-700 border-red-200', icon: ShieldX },
    high:     { label: '高度匹配', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: ShieldAlert },
    medium:   { label: '中度匹配', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Shield },
    low:      { label: '低度匹配', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Shield },
    none:     { label: '未发现风险', color: 'bg-green-100 text-green-700 border-green-200', icon: ShieldCheck },
  };
  const c = config[level] || config.none;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${c.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {c.label}
    </span>
  );
};

const ScoreBar = ({ score }) => {
  const pct = Math.round(score * 100);
  const color = pct >= 85 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-400' : pct >= 55 ? 'bg-yellow-400' : 'bg-blue-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
    </div>
  );
};

const SupplierScanPage = () => {
  const [inputs, setInputs] = useState(['']);
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const addInput = () => setInputs([...inputs, '']);
  const removeInput = (i) => setInputs(inputs.filter((_, idx) => idx !== i));
  const updateInput = (i, val) => {
    const next = [...inputs];
    next[i] = val;
    setInputs(next);
  };

  const handleScan = async () => {
    const names = inputs.map((s) => s.trim()).filter(Boolean);
    if (!names.length) {
      setError('请至少输入一个供应商名称');
      return;
    }
    setError('');
    setIsLoading(true);
    setResults(null);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE}/api/v1/tools/risk-scan`,
        { entity_names: names, match_threshold: 0.55, include_extracted: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults({ ...res.data, queried: names });
    } catch (err) {
      setError(err.response?.data?.detail || '扫描失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const overallLevel = results?.risk_level || 'none';

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-gtc-navy">供应商风险扫描</h1>
        <p className="text-gray-500 mt-1">
          输入供应商或制造商名称，匹配 UFLPA 实体清单（{results?.entity_list_count || '70+'} 个已列管实体）
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-gtc-navy">输入供应商名称</h2>
          <span className="text-xs text-gray-400">支持中英文，可批量查询</span>
        </div>

        <div className="space-y-3 mb-4">
          {inputs.map((val, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={val}
                onChange={(e) => updateInput(i, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                placeholder={i === 0 ? '例如：Hoshine Silicon Industry' : '添加更多供应商...'}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all text-sm"
              />
              {inputs.length > 1 && (
                <button
                  onClick={() => removeInput(i)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={addInput}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gtc-navy transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加更多
          </button>
          <div className="flex-1" />
          <button
            onClick={handleScan}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gtc-navy text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gtc-blue transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {isLoading ? '扫描中...' : '开始扫描'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary Banner */}
          <div className={`rounded-xl p-5 border flex items-center gap-4 ${
            overallLevel === 'none'    ? 'bg-green-50 border-green-200' :
            overallLevel === 'low'     ? 'bg-blue-50 border-blue-200' :
            overallLevel === 'medium'  ? 'bg-yellow-50 border-yellow-200' :
            overallLevel === 'high'    ? 'bg-orange-50 border-orange-200' :
                                        'bg-red-50 border-red-200'
          }`}>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-semibold text-gtc-navy">扫描完成</span>
                <RiskBadge level={overallLevel} />
              </div>
              <p className="text-sm text-gray-600">
                共查询 <strong>{results.scanned_count}</strong> 个实体，
                发现 <strong>{results.matches?.length || 0}</strong> 条匹配记录，
                匹配库共 <strong>{results.entity_list_count}</strong> 个 UFLPA 列管实体
              </p>
            </div>
            {overallLevel === 'none' && (
              <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0" />
            )}
            {(overallLevel === 'critical' || overallLevel === 'high') && (
              <ShieldAlert className="w-8 h-8 text-red-500 flex-shrink-0" />
            )}
          </div>

          {/* No Match */}
          {results.matches?.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="font-medium text-gray-700">未在 UFLPA 实体清单中发现匹配</p>
              <p className="text-sm text-gray-400 mt-1">
                查询的供应商未被列入当前 UFLPA 清单，建议同时进行供应链尽职调查
              </p>
            </div>
          )}

          {/* Match Results */}
          {results.matches?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-medium text-gtc-navy">匹配详情</h3>
                <span className="text-xs text-gray-400">{results.matches.length} 条结果</span>
              </div>
              <div className="divide-y divide-gray-50">
                {results.matches.map((m, i) => (
                  <div key={i} className="px-6 py-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gtc-navy">
                            {m.matched_name}
                          </span>
                          <RiskBadge level={m.risk_level} />
                        </div>
                        {m.matched_alias && (
                          <span className="text-xs text-gray-400">
                            别名匹配：{m.matched_alias}
                          </span>
                        )}
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md whitespace-nowrap">
                        {m.entity_type}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-3">
                      <div>查询词：<span className="text-gray-700">{m.entity}</span></div>
                      <div>列入日期：<span className="text-gray-700">{m.added_date}</span></div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-400 mb-1">相似度</div>
                      <ScoreBar score={m.score} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3 text-xs text-gray-500">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              本工具基于 DHS UFLPA 实体清单进行模糊匹配，未匹配不代表供应商完全无风险。
              建议结合
              <a
                href="https://www.dhs.gov/uflpa-entity-list"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gtc-navy underline mx-1 inline-flex items-center gap-0.5"
              >
                DHS 官方清单 <ExternalLink className="w-3 h-3" />
              </a>
              及供应链尽职调查综合判断。
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierScanPage;
