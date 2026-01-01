import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { casesAPI } from '../services/api';
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  FileText,
  Calendar,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';

const CasesListPage = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const data = await casesAPI.list();
        setCases(data);
      } catch (error) {
        console.error('Failed to fetch cases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
  }, []);

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '待处理', class: 'status-pending' },
      reviewing: { label: '审核中', class: 'status-reviewing' },
      submitted: { label: '已提交CBP', class: 'status-submitted' },
      approved: { label: '合规通过', class: 'status-approved' },
      rejected: { label: '已拒绝', class: 'status-rejected' },
    };
    const config = statusMap[status] || { label: status, class: 'status-pending' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const filteredCases = cases.filter((caseItem) => {
    const matchesSearch =
      caseItem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.cbp_case_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || caseItem.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gtc-gold/30 border-t-gtc-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gtc-navy">
            案件管理
          </h1>
          <p className="text-gray-500">管理所有海关查扣案件</p>
        </div>
        <Link
          to="/cases/new"
          className="inline-flex items-center gap-2 bg-gtc-navy text-white px-5 py-2.5 rounded-xl font-medium hover:bg-gtc-blue transition-colors"
        >
          <Plus className="w-5 h-5" />
          新建案件
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索案件名称或CBP编号..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-gtc-gold focus:ring-1 focus:ring-gtc-gold transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-gtc-gold focus:ring-1 focus:ring-gtc-gold transition-all"
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="reviewing">审核中</option>
            <option value="submitted">已提交CBP</option>
            <option value="approved">合规通过</option>
            <option value="rejected">已拒绝</option>
          </select>
        </div>
      </div>

      {/* Cases List */}
      {filteredCases.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    案件信息
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    CBP编号
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    创建日期
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCases.map((caseItem) => (
                  <tr
                    key={caseItem.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gtc-light rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-gtc-navy" />
                        </div>
                        <div>
                          <p className="font-medium text-gtc-navy">
                            {caseItem.title || `案件 #${caseItem.id.slice(0, 8)}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {caseItem.product_description?.slice(0, 50) || '暂无描述'}
                            {caseItem.product_description?.length > 50 && '...'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 font-mono text-sm">
                        {caseItem.cbp_case_number || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(caseItem.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Calendar className="w-4 h-4" />
                        {new Date(caseItem.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/cases/${caseItem.id}`}
                        className="inline-flex items-center gap-1 text-gtc-accent hover:text-gtc-navy font-medium text-sm"
                      >
                        查看详情
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gtc-navy mb-2">
            {searchTerm || filterStatus !== 'all'
              ? '没有找到匹配的案件'
              : '暂无案件记录'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterStatus !== 'all'
              ? '尝试调整搜索条件或筛选器'
              : '点击下方按钮创建您的第一个案件'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Link
              to="/cases/new"
              className="inline-flex items-center gap-2 bg-gtc-navy text-white px-6 py-3 rounded-xl font-medium hover:bg-gtc-blue transition-colors"
            >
              <Plus className="w-5 h-5" />
              新建案件
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default CasesListPage;
