import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { casesAPI, filesAPI, aiAPI } from '../services/api';
import {
  ArrowLeft,
  FileText,
  Upload,
  Brain,
  Sparkles,
  Download,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Package,
  Building,
  MapPin,
  Calendar,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const CaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    fetchCaseData();
  }, [id]);

  const fetchCaseData = async () => {
    try {
      const [caseResponse, filesResponse] = await Promise.all([
        casesAPI.get(id),
        filesAPI.listByCaseId(id).catch(() => []),
      ]);
      setCaseData(caseResponse);
      setFiles(filesResponse);
    } catch (error) {
      console.error('Failed to fetch case:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await filesAPI.upload(id, file);
      await fetchCaseData();
    } catch (error) {
      alert('文件上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAiResult(null);
    try {
      const result = await aiAPI.analyzeDocument(id, 'risk_scan');
      setAiResult({ type: 'analysis', data: result });
    } catch (error) {
      setAiResult({ type: 'error', message: '分析失败，请稍后重试' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGeneratePetition = async () => {
    setGenerating(true);
    setAiResult(null);
    try {
      const result = await aiAPI.generatePetition(id);
      setAiResult({ type: 'petition', data: result });
    } catch (error) {
      setAiResult({ type: 'error', message: '生成失败，请稍后重试' });
    } finally {
      setGenerating(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { label: '待处理', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
      reviewing: { label: '审核中', icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-100' },
      submitted: { label: '已提交CBP', icon: Upload, color: 'text-purple-600', bg: 'bg-purple-100' },
      approved: { label: '合规通过', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
      rejected: { label: '已拒绝', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    };
    return configs[status] || configs.pending;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gtc-gold/30 border-t-gtc-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!caseData) {
    return <div className="text-center py-12"><p className="text-gray-500">案件不存在</p></div>;
  }

  const statusConfig = getStatusConfig(caseData.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gtc-navy mb-2">
            <ArrowLeft className="w-5 h-5" /> 返回列表
          </button>
          <h1 className="text-2xl font-display font-bold text-gtc-navy">
            {caseData.title || `案件 #${caseData.id}`}
          </h1>
        </div>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg}`}>
          <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
          <span className={`font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200 flex gap-8 px-6">
          {['info', 'files', 'ai'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`py-4 border-b-2 font-medium ${activeTab === tab ? 'border-gtc-gold text-gtc-navy' : 'border-transparent text-gray-500'}`}>
              {tab === 'info' && '案件信息'}
              {tab === 'files' && '文件管理'}
              {tab === 'ai' && 'AI 分析'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-medium text-gtc-navy flex items-center gap-2"><Package className="w-4 h-4" /> 产品信息</h3>
                <p className="text-sm"><span className="text-gray-400">描述:</span> {caseData.product_description || '-'}</p>
                <p className="text-sm"><span className="text-gray-400">HTS:</span> {caseData.hts_code || '-'}</p>
                <p className="text-sm"><span className="text-gray-400">原产国:</span> {caseData.country_of_origin || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-medium text-gtc-navy flex items-center gap-2"><MapPin className="w-4 h-4" /> 查扣详情</h3>
                <p className="text-sm"><span className="text-gray-400">原因:</span> {caseData.detention_reason || '-'}</p>
                <p className="text-sm"><span className="text-gray-400">口岸:</span> {caseData.port_of_entry || '-'}</p>
                <p className="text-sm"><span className="text-gray-400">创建:</span> {new Date(caseData.created_at).toLocaleString('zh-CN')}</p>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-4">
              <label className="inline-flex items-center gap-2 bg-gtc-navy text-white px-4 py-2 rounded-xl cursor-pointer hover:bg-gtc-blue">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                上传文件
                <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
              </label>
              {files.length > 0 ? (
                <div className="divide-y">
                  {files.map((file) => (
                    <div key={file.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gtc-navy" />
                        <span>{file.filename}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">暂无文件</p>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={handleAnalyze} disabled={analyzing}
                  className="bg-blue-500 text-white p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50">
                  {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                  Gemini 风险分析
                </button>
                <button onClick={handleGeneratePetition} disabled={generating}
                  className="bg-purple-500 text-white p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-600 disabled:opacity-50">
                  {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Claude 生成申诉书
                </button>
              </div>
              {aiResult && (
                <div className={`rounded-xl p-4 ${aiResult.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-gray-50'}`}>
                  {aiResult.type === 'error' ? (
                    aiResult.message
                  ) : aiResult.type === 'petition' ? (
                    <div className="prose max-w-none">
                      <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{aiResult.data.petition_text}</pre>
                    </div>
                  ) : (
                    <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(aiResult.data, null, 2)}</pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseDetailPage;
