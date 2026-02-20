import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { casesAPI, aiAPI } from '../services/api';
import {
  FolderOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  FileText,
  Shield,
  ArrowRight,
  Sparkles,
  Search,
  FileCheck,
  Phone,
  MessageCircle,
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    reviewing: 0,
    approved: 0,
  });
  const [recentCases, setRecentCases] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cases = await casesAPI.list();
        
        const total = cases.length;
        const pending = cases.filter(c => c.status === 'pending').length;
        const reviewing = cases.filter(c => c.status === 'reviewing').length;
        const approved = cases.filter(c => c.status === 'approved').length;
        
        setStats({ total, pending, reviewing, approved });
        setRecentCases(cases.slice(0, 5));

        const status = await aiAPI.status();
        setAiStatus(status);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      label: '总案件数',
      value: stats.total,
      icon: FolderOpen,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      label: '待处理',
      value: stats.pending,
      icon: Clock,
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      label: '审核中',
      value: stats.reviewing,
      icon: AlertTriangle,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      label: '已通过',
      value: stats.approved,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
  ];

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '待处理', class: 'status-pending' },
      reviewing: { label: '审核中', class: 'status-reviewing' },
      submitted: { label: '已提交', class: 'status-submitted' },
      approved: { label: '已通过', class: 'status-approved' },
      rejected: { label: '已拒绝', class: 'status-rejected' },
    };
    const config = statusMap[status] || { label: status, class: 'status-pending' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gtc-gold/30 border-t-gtc-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-gtc-navy to-gtc-blue rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-display font-bold mb-2">
          欢迎回来，{user?.full_name}！
        </h1>
        <p className="text-gray-300 mb-6">
          您有 {stats.pending} 个待处理案件需要关注
        </p>
        <Link
          to="/cases/new"
          className="inline-flex items-center gap-2 bg-gtc-gold text-gtc-navy px-6 py-3 rounded-xl font-medium hover:bg-amber-400 transition-colors"
        >
          <Sparkles className="w-5 h-5" />
          新建案件
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl p-6 shadow-sm card-hover"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gtc-navy">{stat.value}</p>
            <p className="text-gray-500 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Cases */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-gtc-navy">
              最近案件
            </h2>
            <Link
              to="/cases"
              className="text-gtc-accent text-sm font-medium hover:underline flex items-center gap-1"
            >
              查看全部
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {recentCases.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentCases.map((caseItem) => (
                <Link
                  key={caseItem.id}
                  to={`/cases/${caseItem.id}`}
                  className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gtc-light rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-gtc-navy" />
                    </div>
                    <div>
                      <p className="font-medium text-gtc-navy">
                       {caseItem.title || `案件 #${caseItem.id}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(caseItem.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(caseItem.status)}
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">暂无案件记录</p>
              <Link
                to="/cases/new"
                className="inline-flex items-center gap-2 text-gtc-accent font-medium hover:underline"
              >
                创建第一个案件
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* 右侧栏 */}
        <div className="space-y-6">
          {/* 系统服务状态 */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-display font-bold text-gtc-navy">
                系统服务状态
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gtc-navy">文档分析服务</p>
                  <p className="text-sm text-gray-500">扫描与分类引擎</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  aiStatus?.gemini?.configured === true ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <FileCheck className="w-6 h-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gtc-navy">合规推理服务</p>
                  <p className="text-sm text-gray-500">法律分析与文书引擎</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  aiStatus?.claude?.configured === true? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-3">平台能力</p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>大规模文档扫描与分析</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>五级供应链溯源图谱构建</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>专业申诉书快速生成</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 联系我们 */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-display font-bold text-gtc-navy mb-4">
              联系专家团队
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gtc-gold/10 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-gtc-gold" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">咨询热线</p>
                  <p className="font-medium text-gtc-navy">139-3850-8888</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">微信咨询</p>
                  <p className="font-medium text-gtc-navy">139-3850-8888</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">工作时间：周一至周五 9:00-18:00</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
