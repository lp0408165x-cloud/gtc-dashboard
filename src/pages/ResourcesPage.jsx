import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { resourcesAPI, subscriptionAPI } from '../services/api';
import {
  BookOpen,
  Download,
  Lock,
  FileText,
  Video,
  FileSpreadsheet,
  File,
  Search,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  Calendar,
  HardDrive,
  Crown,
  Zap,
  Building2,
  Upload,
  Trash2,
  Plus,
} from 'lucide-react';

const CATEGORY_CONFIG = {
  regulation: { label: '法规解读', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  template: { label: '合规模板', icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50' },
  report: { label: '行业报告', icon: File, color: 'text-purple-600', bg: 'bg-purple-50' },
  training: { label: '培训视频', icon: Video, color: 'text-orange-600', bg: 'bg-orange-50' },
  guide: { label: '操作指南', icon: BookOpen, color: 'text-cyan-600', bg: 'bg-cyan-50' },
};

const PLAN_LABELS = {
  free: { label: '免费', color: 'text-gray-500' },
  basic: { label: '基础版', color: 'text-blue-600' },
  pro: { label: '专业版', color: 'text-gtc-gold' },
  professional: { label: '专业版', color: 'text-gtc-gold' },
  enterprise: { label: '企业版', color: 'text-purple-600' },
};

const PLAN_HIERARCHY = ['free', 'basic', 'pro', 'professional', 'enterprise'];

const ResourcesPage = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [downloadingId, setDownloadingId] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const isAdmin = user?.role_name === 'admin' || user?.role === 'admin';

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resourcesRes, subRes] = await Promise.allSettled([
        resourcesAPI.list(),
        subscriptionAPI.getCurrent(),
      ]);
      if (resourcesRes.status === 'fulfilled') setResources(resourcesRes.value.resources || resourcesRes.value || []);
      if (subRes.status === 'fulfilled') setCurrentPlan(subRes.value?.subscription?.plan || subRes.value?.plan || 'free');
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleDownload = async (resource) => {
    if (!canAccess(resource.min_plan)) {
      alert(`此资料需要${PLAN_LABELS[resource.min_plan]?.label || '升级'}才能下载`);
      return;
    }
    setDownloadingId(resource.id);
    try {
      const blob = await resourcesAPI.download(resource.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resource.file_name || resource.title;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { alert(err.response?.data?.detail || '下载失败'); }
    finally { setDownloadingId(null); }
  };

  const handleDelete = async (resourceId) => {
    if (!confirm('确认删除此资料？')) return;
    try { await resourcesAPI.delete(resourceId); loadData(); }
    catch (err) { alert('删除失败'); }
  };

  const canAccess = (minPlan) => {
    const userLevel = PLAN_HIERARCHY.indexOf(currentPlan);
    const requiredLevel = PLAN_HIERARCHY.indexOf(minPlan || 'free');
    return userLevel >= requiredLevel;
  };

  const filteredResources = resources.filter((r) => {
    const matchesSearch = !searchQuery || r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gtc-gold animate-spin" />
        <span className="ml-3 text-gray-500">加载资料库...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gtc-navy">合规资料库</h1>
          <p className="text-gray-500 mt-1">专业合规资料、法规解读、模板文件</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gtc-gold text-gtc-navy rounded-xl font-medium hover:bg-yellow-600 transition-all shadow-sm">
            <Plus className="w-4 h-4" /> 上传资料
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="搜索资料..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gtc-navy placeholder-gray-400 focus:outline-none focus:border-gtc-gold focus:ring-1 focus:ring-gtc-gold" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', ...Object.keys(CATEGORY_CONFIG)].map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-gtc-gold text-gtc-navy shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gtc-navy'
              }`}>
              {cat === 'all' ? '全部' : CATEGORY_CONFIG[cat]?.label || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{searchQuery ? '没有找到匹配的资料' : '资料库暂无内容'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => {
            const catConfig = CATEGORY_CONFIG[resource.category] || CATEGORY_CONFIG.guide;
            const CatIcon = catConfig.icon;
            const planConfig = PLAN_LABELS[resource.min_plan] || PLAN_LABELS.free;
            const accessible = canAccess(resource.min_plan);
            const isDownloading = downloadingId === resource.id;

            return (
              <div key={resource.id}
                className={`bg-white border rounded-xl p-5 transition-all hover:shadow-md ${accessible ? 'border-gray-200' : 'border-gray-100 opacity-70'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg ${catConfig.bg}`}>
                    <CatIcon className={`w-3.5 h-3.5 ${catConfig.color}`} />
                    <span className={`text-xs font-medium ${catConfig.color}`}>{catConfig.label}</span>
                  </div>
                  {resource.min_plan && resource.min_plan !== 'free' && (
                    <span className={`text-xs font-medium ${planConfig.color}`}>{planConfig.label}</span>
                  )}
                </div>

                <h3 className="text-gtc-navy font-medium mb-2 line-clamp-2">{resource.title}</h3>
                {resource.description && (
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{resource.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  {resource.file_size && (
                    <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{formatFileSize(resource.file_size)}</span>
                  )}
                  {resource.download_count != null && (
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" />{resource.download_count} 次下载</span>
                  )}
                  {resource.created_at && (
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(resource.created_at).toLocaleDateString('zh-CN')}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {accessible ? (
                    <button onClick={() => handleDownload(resource)} disabled={isDownloading}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-gtc-gold/10 text-gtc-gold rounded-lg hover:bg-gtc-gold/20 transition-all text-sm font-medium disabled:opacity-50">
                      {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {isDownloading ? '下载中...' : '下载'}
                    </button>
                  ) : (
                    <a href="/subscription"
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 transition-all text-sm border border-gray-200">
                      <Lock className="w-4 h-4" /> 升级解锁 <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                  {isAdmin && (
                    <button onClick={() => handleDelete(resource.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showUploadModal && <UploadModal onClose={() => setShowUploadModal(false)} onSuccess={loadData} />}
    </div>
  );
};

// Upload Modal
const UploadModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ title: '', description: '', category: 'regulation', min_plan: 'basic' });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title || !file) { alert('请填写标题并选择文件'); return; }
    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);
      Object.entries(formData).forEach(([k, v]) => data.append(k, v));
      await resourcesAPI.upload(data);
      onSuccess();
      onClose();
    } catch (err) { alert(err.response?.data?.detail || '上传失败'); }
    finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gtc-navy mb-6">上传资料</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">资料标题 *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gtc-navy focus:outline-none focus:border-gtc-gold" placeholder="如：UFLPA 合规指南 2026" />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">简介</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gtc-navy focus:outline-none focus:border-gtc-gold resize-none" placeholder="资料简介..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">分类</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gtc-navy focus:outline-none focus:border-gtc-gold">
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (<option key={key} value={key}>{config.label}</option>))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">最低套餐</label>
              <select value={formData.min_plan} onChange={(e) => setFormData({ ...formData, min_plan: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gtc-navy focus:outline-none focus:border-gtc-gold">
                <option value="free">免费</option>
                <option value="basic">基础版</option>
                <option value="pro">专业版</option>
                <option value="enterprise">企业版</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">选择文件 *</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gtc-gold/40 transition-all">
              <input type="file" onChange={(e) => setFile(e.target.files[0])} className="hidden" id="resource-file" />
              <label htmlFor="resource-file" className="cursor-pointer">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">{file ? file.name : '点击选择文件'}</p>
                {file && <p className="text-gray-400 text-xs mt-1">{formatFileSize(file.size)}</p>}
              </label>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-all">取消</button>
          <button onClick={handleSubmit} disabled={uploading}
            className="flex-1 py-2.5 bg-gtc-gold text-gtc-navy font-medium rounded-xl hover:bg-yellow-600 transition-all disabled:opacity-50">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '上传'}
          </button>
        </div>
      </div>
    </div>
  );
};

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default ResourcesPage;
