import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Plus, Clock, CheckCircle, FileText,
  TrendingUp, Filter, Search, ChevronRight, Zap
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://gtc-ai-platform.onrender.com';

const STATUS_CONFIG = {
  active:     { label: '文件收集中',    bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  drafting:   { label: 'Petition起草中', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  submitted:  { label: '已提交等待',    bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  closed:     { label: '✓ 已结案',     bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  urgent:     { label: '⚡ 紧急截止',   bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
};

function getDaysRemaining(noticeDateStr) {
  if (!noticeDateStr) return null;
  const noticeDate = new Date(noticeDateStr);
  const deadline = new Date(noticeDate);
  deadline.setDate(deadline.getDate() + 30);
  const today = new Date();
  return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
}

export default function SeizureCasesPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const token = localStorage.getItem('gtc_token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/v1/seizure-cases`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    active: cases.filter(c => c.status !== 'closed').length,
    urgent: cases.filter(c => {
      const days = getDaysRemaining(c.notice_date);
      return days !== null && days <= 14 && days >= 0;
    }).length,
    thisMonth: cases.filter(c => {
      const d = new Date(c.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    closed: cases.filter(c => c.status === 'closed').length,
  };

  const filtered = cases.filter(c => {
    const matchFilter = filter === 'all' || c.status === filter ||
      (filter === 'urgent' && getDaysRemaining(c.notice_date) <= 14);
    const matchSearch = !search ||
      c.ior_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.id?.toLowerCase().includes(search.toLowerCase()) ||
      c.seizure_number?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">罚没应对</h1>
            <span className="text-xs px-2 py-0.5 bg-red-500 text-white rounded-full font-semibold">NEW</span>
          </div>
          <p className="text-sm text-gray-500">Seizure &amp; Forfeiture / FP&amp;F 案件管理</p>
        </div>
        <button
          onClick={() => navigate('/cases/seizure/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          新建案件
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '进行中案件', value: stats.active, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '紧急截止', value: stats.urgent, icon: Zap, color: 'text-red-600', bg: 'bg-red-50' },
          { label: '本月新增', value: stats.thisMonth, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: '已结案', value: stats.closed, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索案件编号、进口商..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
          {/* Filter Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: '全部' },
              { key: 'active', label: '进行中' },
              { key: 'submitted', label: '待回复' },
              { key: 'closed', label: '已结案' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filter === f.key
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Case Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">暂无案件</p>
            <p className="text-gray-400 text-sm mt-1">点击右上角「新建案件」开始</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">案件编号</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">进口商 / 描述</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">口岸 / HTS</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">状态</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">截止</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c => {
                const days = getDaysRemaining(c.notice_date);
                const isUrgent = days !== null && days <= 14 && days >= 0;
                const statusKey = isUrgent ? 'urgent' : (c.status || 'active');
                const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.active;
                return (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/cases/seizure/${c.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-600">{c.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">{c.ior_name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{c.goods_description || c.seizure_number}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-600">{c.port || '—'}</div>
                      <div className="text-xs text-gray-400 font-mono">{c.hts_code || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {days !== null ? (
                        <span className={`text-xs font-semibold ${days <= 7 ? 'text-red-600' : days <= 14 ? 'text-amber-600' : 'text-gray-500'}`}>
                          {days > 0 ? `${days}天` : days === 0 ? '今天截止' : '已过期'}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="mt-4 text-center">
        <button
          onClick={() => navigate('/cases/seizure/new')}
          className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-dashed border-red-200 text-red-500 rounded-xl text-sm hover:border-red-400 hover:bg-red-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建罚没应对案件
        </button>
      </div>
    </div>
  );
}
