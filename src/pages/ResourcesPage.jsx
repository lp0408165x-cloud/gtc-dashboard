import { useState, useEffect } from 'react';
import {
  Download, Lock, Search,
  BookOpen, Globe, Star,
  ChevronRight, AlertCircle, CheckCircle, Loader2,
  Calendar, Eye, Sparkles, TrendingUp, ExternalLink,
  Newspaper, Shield, Scale, BarChart3, FileStack
} from 'lucide-react';
import { resourcesAPI, subscriptionAPI } from '../services/api';
import api from '../services/api';

const CATEGORIES = [
  { key: 'all',      label: '全部',     icon: <Globe className="w-3.5 h-3.5" /> },
  { key: '贸易情报', label: '贸易情报', icon: <Newspaper className="w-3.5 h-3.5" /> },
  { key: 'UFLPA合规',label: 'UFLPA合规',icon: <Shield className="w-3.5 h-3.5" /> },
  { key: 'CBP应对',  label: 'CBP应对',  icon: <Scale className="w-3.5 h-3.5" /> },
  { key: 'AD&CVD',   label: 'AD&CVD',   icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { key: '关税政策', label: '关税政策', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { key: '文件模板', label: '文件模板', icon: <FileStack className="w-3.5 h-3.5" /> },
];

const CATEGORY_ICON = {
  '贸易情报':  <Newspaper className="w-5 h-5" />,
  'UFLPA合规': <Shield className="w-5 h-5" />,
  'CBP应对':   <Scale className="w-5 h-5" />,
  'AD&CVD':    <BarChart3 className="w-5 h-5" />,
  '关税政策':  <TrendingUp className="w-5 h-5" />,
  '文件模板':  <FileStack className="w-5 h-5" />,
  default:     <Globe className="w-5 h-5" />,
};

const PLAN_BADGE = {
  basic:      { label: '基础版', color: 'bg-gray-100 text-gray-600' },
  pro:        { label: '专业版', color: 'bg-blue-100 text-blue-700' },
  enterprise: { label: '企业版', color: 'bg-amber-100 text-amber-700' },
};

const isNew = (dateStr) => {
  if (!dateStr) return false;
  return (Date.now() - new Date(dateStr).getTime()) < 7 * 24 * 60 * 60 * 1000;
};

export default function ResourcesPage() {
  const [resources, setResources]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState('');
  const [activeCategory, setCategory]   = useState('all');
  const [sortBy, setSortBy]             = useState('newest');
  const [downloading, setDownloading]   = useState(null);
  const [previewing, setPreviewing]     = useState(null);
  const [toast, setToast]               = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => { fetchResources(); fetchSubscription(); }, []);

  const fetchResources = async () => {
    try {
      setLoading(true); setError(null);
      const data = await resourcesAPI.list();
      setResources(data);
    } catch (e) {
      setError(e.response?.data?.detail || '加载失败');
    } finally { setLoading(false); }
  };

  const fetchSubscription = async () => {
    try { const data = await subscriptionAPI.getCurrent(); setSubscription(data); } catch (_) {}
  };

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); };

  const openResource = async (resource, forceDownload = false) => {
    if (!resource.accessible) { showToast('error', forceDownload ? '请升级套餐后下载此资料' : '请升级套餐后查看此资料'); return; }
    forceDownload ? setDownloading(resource.id) : setPreviewing(resource.id);
    try {
      const response = await api.get(`/resources/${resource.id}/download`);
      const { download_url } = response.data;
      const fileResponse = await fetch(download_url);
      const blob = await fileResponse.blob();
      const ext = resource.file_name?.split('.').pop()?.toLowerCase();
      const mimeMap = { html: 'text/html; charset=utf-8', pdf: 'application/pdf' };
      const mime = mimeMap[ext] || 'text/html; charset=utf-8';

      if (forceDownload) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = resource.file_name || resource.title;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        showToast('success', `「${resource.title}」下载成功`);
      } else {
        const correctBlob = new Blob([blob], { type: mime });
        const url = window.URL.createObjectURL(correctBlob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 30000);
        showToast('success', `「${resource.title}」已打开`);
      }
    } catch (e) {
      showToast('error', forceDownload ? '下载失败，请稍后重试' : '打开失败，请稍后重试');
    } finally { forceDownload ? setDownloading(null) : setPreviewing(null); }
  };

  const filtered = resources
    .filter((r) => {
      const matchSearch = r.title?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'all' || r.category === activeCategory;
      return matchSearch && matchCat;
    })
    .sort((a, b) => sortBy === 'newest' ? new Date(b.created_at) - new Date(a.created_at) : (b.download_count || 0) - (a.download_count || 0));

  const pinned = resources.find((r) => r.category === '贸易情报' && r.accessible);
  const accessibleCount = resources.filter((r) => r.accessible).length;

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gtc-navy">合规资料库</h1>
          <p className="text-gray-500 mt-1 text-sm">CBP / UFLPA / AD&CVD 专业文档、模板与报告</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {[{ key: 'newest', label: '最新' }, { key: 'popular', label: '最热' }].map((s) => (
              <button key={s.key} onClick={() => setSortBy(s.key)}
                className={`px-3 py-2 text-xs font-medium transition-all ${sortBy === s.key ? 'bg-gtc-navy text-white' : 'text-gray-500 hover:text-gtc-navy'}`}>
                {s.label}
              </button>
            ))}
          </div>
          {subscription && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
              <Star className="w-4 h-4 text-gtc-gold" />
              <span className="text-sm font-medium text-gtc-navy">{PLAN_BADGE[subscription.plan_id]?.label || subscription.plan_id}</span>
              <span className="text-gray-400 text-xs">· {accessibleCount}/{resources.length} 份</span>
            </div>
          )}
        </div>
      </div>

      {/* 置顶最新周报 */}
      {pinned && !search && activeCategory === 'all' && (
        <div className="relative bg-gradient-to-r from-gtc-navy to-gtc-navy/80 rounded-2xl p-5 flex items-center justify-between gap-4 overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gtc-gold rounded-full -translate-y-1/2 translate-x-1/2" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-gtc-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-gtc-gold" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="bg-gtc-gold text-gtc-navy text-xs font-bold px-2 py-0.5 rounded-full">最新</span>
                <span className="text-white/60 text-xs">{pinned.category}</span>
              </div>
              <p className="text-white font-semibold text-sm">{pinned.title}</p>
              {pinned.description && <p className="text-white/60 text-xs mt-0.5 line-clamp-1">{pinned.description}</p>}
            </div>
          </div>
          <div className="relative flex gap-2 flex-shrink-0">
            <button onClick={() => openResource(pinned, false)} disabled={previewing === pinned.id}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
              {previewing === pinned.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />} 阅读
            </button>
            <button onClick={() => openResource(pinned, true)} disabled={downloading === pinned.id}
              className="flex items-center gap-1.5 bg-gtc-gold hover:bg-gtc-gold/90 text-gtc-navy px-4 py-2 rounded-xl text-sm font-bold transition-all">
              {downloading === pinned.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 下载
            </button>
          </div>
        </div>
      )}

      {/* 分类 Tab + 搜索 */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat.key} onClick={() => setCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeCategory === cat.key ? 'bg-gtc-navy text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-gtc-gold hover:text-gtc-navy'
              }`}>
              {cat.icon}{cat.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索资料标题或描述..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gtc-gold focus:ring-1 focus:ring-gtc-gold transition-all" />
        </div>
      </div>

      {/* 内容区 */}
      {loading ? <LoadingState /> : error ? <ErrorState msg={error} onRetry={fetchResources} /> : filtered.length === 0 ? <EmptyState search={search} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r}
              downloading={downloading === r.id} previewing={previewing === r.id}
              onDownload={(r) => openResource(r, true)} onPreview={(r) => openResource(r, false)} />
          ))}
        </div>
      )}

      {!loading && resources.some((r) => !r.accessible) && (
        <UpgradeBanner lockedCount={resources.filter((r) => !r.accessible).length} />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function ResourceCard({ resource: r, downloading, previewing, onDownload, onPreview }) {
  const icon = CATEGORY_ICON[r.category] || CATEGORY_ICON.default;
  const planBadge = PLAN_BADGE[r.min_plan] || PLAN_BADGE.basic;
  const isLocked = !r.accessible;
  const showNew = isNew(r.created_at);

  return (
    <div className={`relative bg-white rounded-2xl border flex flex-col transition-all ${
      isLocked ? 'border-gray-200 opacity-70' : 'border-gray-200 hover:border-gtc-gold hover:shadow-md'
    }`}>
      {showNew && !isLocked && (
        <div className="absolute -top-2 -right-2 bg-gtc-gold text-gtc-navy text-xs font-bold px-2 py-0.5 rounded-full shadow-sm z-10">NEW</div>
      )}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isLocked ? 'bg-gray-100 text-gray-400' : 'bg-gtc-gold/10 text-gtc-gold'}`}>
            {isLocked ? <Lock className="w-5 h-5" /> : icon}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${planBadge.color}`}>{planBadge.label}</span>
        </div>
        <h3 className={`font-semibold text-sm leading-snug mb-1.5 ${isLocked ? 'text-gray-400' : 'text-gtc-navy'}`}>{r.title}</h3>
        {r.description && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{r.description}</p>}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {r.category && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{r.category}</span>
          )}
          {r.created_at && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              <Calendar className="w-3 h-3" />
              {new Date(r.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          )}
          {r.download_count > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              <Eye className="w-3 h-3" />{r.download_count}次
            </span>
          )}
        </div>
      </div>
      <div className="px-5 pb-5">
        {isLocked ? (
          <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed">
            <Lock className="w-4 h-4" />升级后可查看
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => onPreview(r)} disabled={previewing}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border border-gtc-navy text-gtc-navy hover:bg-gtc-navy hover:text-white transition-all active:scale-95">
              {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />} 阅读
            </button>
            <button onClick={() => onDownload(r)} disabled={downloading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium bg-gtc-navy text-white hover:bg-gtc-navy/90 transition-all active:scale-95">
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 下载
            </button>
          </div>
        )}
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
      <button onClick={onRetry} className="mt-4 px-4 py-2 bg-gtc-navy text-white rounded-lg text-sm hover:bg-gtc-navy/90">重试</button>
    </div>
  );
}

function EmptyState({ search }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <BookOpen className="w-10 h-10 text-gray-300 mb-3" />
      <p className="text-gray-500 font-medium">{search ? `未找到与「${search}」相关的资料` : '该分类下暂无资料'}</p>
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
      <a href="/subscription" className="flex items-center gap-1.5 bg-gtc-gold text-gtc-navy px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gtc-gold/90 transition-colors flex-shrink-0">
        查看套餐 <ChevronRight className="w-4 h-4" />
      </a>
    </div>
  );
}
