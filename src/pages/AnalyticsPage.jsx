import { useState, useEffect } from 'react';
import { casesAPI } from '../services/api';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Activity
} from 'lucide-react';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {},
    byRiskLevel: { high: 0, medium: 0, low: 0, unknown: 0 },
    recentCases: [],
    avgRiskScore: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const cases = await casesAPI.list();
      
      // 计算统计数据
      const byStatus = {};
      const byRiskLevel = { high: 0, medium: 0, low: 0, unknown: 0 };
      let totalRiskScore = 0;
      let riskScoreCount = 0;

      cases.forEach(c => {
        // 按状态统计
        byStatus[c.status] = (byStatus[c.status] || 0) + 1;
        
        // 按风险等级统计
        if (c.risk_score !== null && c.risk_score !== undefined) {
          totalRiskScore += c.risk_score;
          riskScoreCount++;
          if (c.risk_score >= 70) byRiskLevel.high++;
          else if (c.risk_score >= 40) byRiskLevel.medium++;
          else byRiskLevel.low++;
        } else {
          byRiskLevel.unknown++;
        }
      });

      // 最近5个案件
      const recentCases = [...cases]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setStats({
        total: cases.length,
        byStatus,
        byRiskLevel,
        recentCases,
        avgRiskScore: riskScoreCount > 0 ? (totalRiskScore / riskScoreCount).toFixed(1) : 0
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    archived: '已归档'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gtc-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-display font-bold text-gtc-navy">数据分析</h1>
        <p className="text-gray-500 mt-1">案件统计与风险概览</p>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 案件总数 */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">案件总数</p>
              <p className="text-3xl font-bold text-gtc-navy mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* 平均风险分 */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均风险分</p>
              <p className="text-3xl font-bold text-gtc-navy mt-1">{stats.avgRiskScore}</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* 高风险案件 */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">高风险案件</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.byRiskLevel.high}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* 已完成 */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已完成案件</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.byStatus.completed || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 详细统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 状态分布 */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gtc-navy mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            案件状态分布
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                    {statusLabels[status] || status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-gtc-gold h-2 rounded-full" 
                      style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
            {Object.keys(stats.byStatus).length === 0 && (
              <p className="text-gray-400 text-center py-4">暂无数据</p>
            )}
          </div>
        </div>

        {/* 风险等级分布 */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gtc-navy mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            风险等级分布
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">高风险 ≥70</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${stats.total > 0 ? (stats.byRiskLevel.high / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{stats.byRiskLevel.high}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">中风险 40-69</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${stats.total > 0 ? (stats.byRiskLevel.medium / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{stats.byRiskLevel.medium}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">低风险 &lt;40</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${stats.total > 0 ? (stats.byRiskLevel.low / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{stats.byRiskLevel.low}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">未评估</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-gray-400 h-2 rounded-full" 
                    style={{ width: `${stats.total > 0 ? (stats.byRiskLevel.unknown / stats.total) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{stats.byRiskLevel.unknown}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 最近案件 */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gtc-navy mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          最近案件
        </h3>
        {stats.recentCases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">ID</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">HTS编码</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">状态</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">风险分</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentCases.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium text-gtc-navy">#{c.id}</td>
                    <td className="py-2 px-3">{c.hts_code || '-'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[c.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[c.status] || c.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {c.risk_score !== null ? (
                        <span className={`font-medium ${c.risk_score >= 70 ? 'text-red-600' : c.risk_score >= 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {c.risk_score}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2 px-3 text-gray-500">
                      {new Date(c.created_at).toLocaleDateString('zh-CN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">暂无案件数据</p>
        )}
      </div>
    </div>
  );
}
