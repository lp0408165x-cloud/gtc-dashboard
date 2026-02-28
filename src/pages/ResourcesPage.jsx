import { useState, useEffect } from 'react';
import {
  FileText, Download, Lock, Search, Filter,
  BookOpen, FileSpreadsheet, Globe, Star,
  ChevronRight, AlertCircle, CheckCircle, Loader2,
  Tag, Calendar, Eye
} from 'lucide-react';
import { resourcesAPI, subscriptionAPI } from '../services/api';
import api from '../services/api';

const TYPE_ICON = {
  guide:     <BookOpen className="w-5 h-5" />,
  template:  <FileText className="w-5 h-5" />,
  report:    <FileSpreadsheet className="w-5 h-5" />,
  checklist: <CheckCircle className="w-5 h-5" />,
  default:   <Globe className="w-5 h-5" />,
};

const TYPE_LABEL = {
  guide:     '操作指南',
  template:  '文件模板',
  report:    '分析报告',
  checklist: '检查清单',
};

const PLAN_BADGE = {
  basic:      { label: '基础版', color: 'bg-gray-100 text-gray-600' },
  pro:        { label: '专业版', color: 'bg-blue-100 text-blue-700' },
  enterprise: { label: '企业版', color: 'bg-yellow-100 text-yellow-700' },
};

export default function ResourcesPage() {
  const [resources, setResources]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState('');
  const [filterType, setFilterType]     = useState('all');
  const [downloading, setDownloading]   = useState(null);
  const [toast, setToast]               = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    fetchResources();
    fetchSubscription();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await resourcesAPI.list();
      setResources(data);
    } catch (e) {
      setError(e.response?.data?.detail || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const data = await subscriptionAPI.getCurrent();
      setSubscription(data);
    } catch (_) {}
  };

  // 后端返回 JSON {download_url: ...}，不是 blob
  const handleDownload = async (resource) => {
  if (!resource.accessible) {
    showToast('error', '请升级套餐后下载此资料');
    return;
  }
  try {
    setDownloading(resource.id);
    const response = await api.get(`/resources/${resource.id}/download`);
    const { download_url } = response.data;
    const fileResponse = await fetch(download_url);
    const blob = await fileResponse.blob();
    const correctBlob = new Blob([blob], { type: 'text/html; charset=utf-8' });
    const url = window.URL.createObjectURL(correctBlob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 30000);
    showToast('success', `「${resource.title}」已打开`);
  } catch (e) {
    showToast('error', '打开失败，请稍后重试');
  } finally {
    setDownloading(null);
  }
};
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = resources.filter((r) => {
    const matchSearch =
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || r.resource_type === filterType;
    return matchSearch && matchType;
  });

  const types = ['all', ...new Set(resources.map((r) => r.resource_type).filter(Boolean))];
  const accessibleCount = resources.filter((r) => r.accessible).length;

  return (
    <div className="space-y-6">

      {/* 页头 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gtc-navy">合规资料库</h1>
          <p className="text-gray-500 mt-1 text-sm">
            CBP / UFLPA / AD&CVD 专业文档、模板与报告
          </p>
        </div>
        {subscription && (
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
            <Star className="w-4 h-4 text-gtc-gold" />
            <span className="text-sm font-medium text-gtc-navy">
              {PLAN_BADGE[subscription.plan_id]?.label || subscription.plan_id}
            </span>
            <span className="text-gray-400 text-xs">
              · 可访问 {accessibleCount}/{resources.length} 份资料
            </span>
          </div>
        )}
      </div>

      {/* 搜索 + 筛选 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索资料标题或描述..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gtc-gold focus:ring-1 focus:ring-gtc-gold transition-all"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filterType === t
                  ? 'bg-gtc-navy text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gtc-gold'
              }`}
            >
              {t === 'all' ? '全部' : (TYPE_LABEL[t] || t)}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区 */}
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState msg={error} onRetry={fetchResources} />
      ) : filtered.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
              downloading={downloading === r.id}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}

      {/* 升级横幅 */}
      {!loading && resources.some((r) => !r.accessible) && (
        <UpgradeBanner lockedCount={resources.filter((r) => !r.accessible).length} />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource: r, downloading, onDownload }) {
  const icon = TYPE_ICON[r.resource_type] || TYPE_ICON.default;
  const planBadge = PLAN_BADGE[r.required_plan] || PLAN_BADGE.basic;
  const isLocked = !r.accessible;

  return (
    <div className={`bg-white rounded-2xl border flex flex-col transition-all ${
      isLocked
        ? 'border-gray-200 opacity-75'
        : 'border-gray-200 hover:border-gtc-gold hover:shadow-md'
    }`}>
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isLocked ? 'bg-gray-100 text-gray-400' : 'bg-gtc-gold/10 text-gtc-gold'
          }`}>
            {isLocked ? <Lock className="w-5 h-5" /> : icon}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${planBadge.color}`}>
            {planBadge.label}
          </span>
        </div>

        <h3 className={`font-semibold text-sm leading-snug mb-1.5 ${isLocked ? 'text-gray-400' : 'text-gtc-navy'}`}>
          {r.title}
        </h3>
        {r.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{r.description}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-3">
          {r.resource_type && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              <Tag className="w-3 h-3" />{TYPE_LABEL[r.resource_type] || r.resource_type}
            </span>
          )}
          {r.created_at && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              <Calendar className="w-3 h-3" />
              {new Date(r.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' })}
            </span>
          )}
          {r.download_count > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              <Eye className="w-3 h-3" />{r.download_count} 次下载
            </span>
          )}
        </div>
      </div>

      <div className="px-5 pb-5">
        <button
          onClick={() => onDownload(r)}
          disabled={downloading}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            isLocked
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : downloading
              ? 'bg-gtc-navy/80 text-white cursor-wait'
              : 'bg-gtc-navy text-white hover:bg-gtc-navy/90 active:scale-95'
          }`}
        >
          {downloading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />下载中...</>
          ) : isLocked ? (
            <><Lock className="w-4 h-4" />升级后可下载</>
          ) : (
            <><Download className="w-4 h-4" />立即下载</>
          )}
        </button>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1,2,3,4,5,6].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl" />
            <div className="w-16 h-5 bg-gray-200 rounded-full" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-full mb-1" />
          <div className="h-3 bg-gray-100 rounded w-2/3 mb-4" />
          <div className="h-10 bg-gray-200 rounded-xl mt-4" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ msg, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
      <p className="text-gray-600 font-medium">{msg}</p>
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-gtc-navy text-white rounded-lg text-sm hover:bg-gtc-navy/90"
      >
        重试
      </button>
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <BookOpen className="w-10 h-10 text-gray-300 mb-3" />
      <p className="text-gray-500 font-medium">
        {search ? `未找到与「${search}」相关的资料` : '暂无资料'}
      </p>
      <p className="text-gray-400 text-sm mt-1">稍后再来看看吧</p>
    </div>
  );
}

function UpgradeBanner({ lockedCount }) {
  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-gtc-navy to-gtc-navy/90 text-white rounded-2xl px-6 py-4">
      <div className="flex items-center gap-3">
        <Lock className="w-5 h-5 text-gtc-gold flex-shrink-0" />
        <div>
          <p className="font-semibold text-sm">还有 {lockedCount} 份资料待解锁</p>
          <p className="text-white/60 text-xs mt-0.5">升级套餐即可访问全部专业文档与报告</p>
        </div>
      </div>
      <a
        href="/subscription"
        className="flex items-center gap-1.5 bg-gtc-gold text-gtc-navy px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gtc-gold/90 transition-colors flex-shrink-0"
      >
        查看套餐 <ChevronRight className="w-4 h-4" />
      </a>
    </div>
  );
}
