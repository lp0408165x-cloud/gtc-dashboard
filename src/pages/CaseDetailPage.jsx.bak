import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { casesAPI, filesAPI, aiAPI, toolsAPI } from '../services/api';
import AgentAnalyzeButton from '../components/AgentAnalyzeButton';
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
  MapPin,
  Loader2,
  RefreshCw,
  AlertCircle,
  Shield,
  Zap,
  Search,
  XCircle,
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
  const [scanning, setScanning] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [processing, setProcessing] = useState(false);
  const [toolResult, setToolResult] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleFileDownload = async (fileId, fileName) => {
    try {
      const blob = await filesAPI.download(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('文件下载失败');
    }
  };

  const handleFileDelete = async (fileId) => {
    if (!confirm('确定删除此文件？')) return;
    try {
      await filesAPI.delete(fileId);
      await fetchCaseData();
    } catch (error) {
      alert('文件删除失败');
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAiResult(null);
    try {
      const result = await aiAPI.analyzeDocument(id, 'risk_scan');
      setAiResult({ type: 'analysis', data: result });
      await fetchCaseData();
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
      await fetchCaseData();
    } catch (error) {
      setAiResult({ type: 'error', message: '生成失败，请稍后重试' });
    } finally {
      setGenerating(false);
    }
  };

  // UFLPA 风险扫描
  const handleRiskScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const result = await toolsAPI.riskScan(id);
      setScanResult({ success: true, data: result });
      await fetchCaseData();
    } catch (error) {
      setScanResult({ 
        success: false, 
        message: error.response?.data?.detail?.error || error.response?.data?.detail || 'UFLPA 扫描失败' 
      });
    } finally {
      setScanning(false);
    }
  };

  // 文档预处理
  const handlePreprocess = async (fileId) => {
    setProcessing(true);
    setToolResult(null);
    try {
      const result = await toolsAPI.preprocess(fileId);
      setToolResult({ type: 'preprocess', success: true, data: result });
      await fetchCaseData();
    } catch (error) {
      setToolResult({ type: 'preprocess', success: false, message: error.response?.data?.detail || '预处理失败' });
    } finally {
      setProcessing(false);
    }
  };

  // 文档分类与抽取
  const handleClassifyExtract = async (fileId) => {
    setProcessing(true);
    setToolResult(null);
    try {
      const result = await toolsAPI.classifyExtract(fileId);
      setToolResult({ type: 'classify', success: true, data: result });
      await fetchCaseData();
    } catch (error) {
      setToolResult({ type: 'classify', success: false, message: error.response?.data?.detail || '分类抽取失败' });
    } finally {
      setProcessing(false);
    }
  };

  // 一致性校验
  const handleConsistencyCheck = async () => {

    setProcessing(true);
    setToolResult(null);
    try {
      const result = await toolsAPI.consistencyCheck(id);
      setToolResult({ type: 'consistency', success: true, data: result });
      await fetchCaseData();
    } catch (error) {
      setToolResult({ type: 'consistency', success: false, message: error.response?.data?.detail || '一致性校验失败' });
    } finally {
      setProcessing(false);
    }
  };

   // 拖拽上传
const handleDragOver = (e) => {
  e.preventDefault();
  setIsDragging(true);
};

const handleDragLeave = (e) => {
  e.preventDefault();
  setIsDragging(false);
};

const handleDrop = async (e) => {
  e.preventDefault();
  setIsDragging(false);
  const file = e.dataTransfer.files[0];
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
   const getStatusConfig = (status) => {
    const configs = {
      pending: { label: '待处理', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
      reviewing: { label: '审核中', icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-100' },
      submitted: { label: '已提交CBP', icon: Upload, color: 'text-purple-600', bg: 'bg-purple-100' },
      approved: { label: '合规通过', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
      rejected: { label: '已拒绝', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
      analyzed: { label: '已分析', icon: Brain, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    };
    return configs[status] || configs.pending;
  };

  const getRiskColor = (score) => {
    if (score >= 7) return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
    if (score >= 4) return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' };
    return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
  };

  const getSeverityColor = (severity) => {
    if (severity === 'high' || severity === 'critical' || severity === 'CRITICAL') return 'bg-red-100 text-red-700';
    if (severity === 'medium' || severity === 'HIGH') return 'bg-amber-100 text-amber-700';
    return 'bg-green-100 text-green-700';
  };

  const getRiskLevelConfig = (level) => {
    const configs = {
      CRITICAL: { label: '严重风险', color: 'bg-red-100 text-red-700', icon: XCircle },
      HIGH: { label: '高风险', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
      MEDIUM: { label: '中等风险', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
      LOW: { label: '低风险', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      UNKNOWN: { label: '未知', color: 'bg-gray-100 text-gray-700', icon: Clock },
    };
    return configs[level] || configs.UNKNOWN;
  };

  // 渲染风险扫描结果
  const renderScanResult = () => {
    if (!scanResult) return null;

    if (!scanResult.success) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
          <p className="text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {scanResult.message}
          </p>
        </div>
      );
    }

    const result = scanResult.data.result || scanResult.data;
    const riskConfig = getRiskLevelConfig(result.risk_level);
    const RiskIcon = riskConfig.icon;

    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 mt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gtc-navy flex items-center gap-2">
            <Shield className="w-5 h-5" />
            UFLPA 风险扫描结果
          </h4>
          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${riskConfig.color}`}>
            <RiskIcon className="w-4 h-4" />
            {riskConfig.label}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500">扫描实体数</p>
            <p className="text-xl font-bold text-gtc-navy">{result.scanned_count}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500">匹配数</p>
            <p className="text-xl font-bold text-gtc-navy">{result.match_count || 0}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500">风险等级</p>
            <p className={`text-xl font-bold ${result.risk_level === 'CRITICAL' ? 'text-red-600' : result.risk_level === 'HIGH' ? 'text-orange-600' : 'text-green-600'}`}>
              {result.risk_level}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-gray-500">扫描时间</p>
            <p className="text-sm font-medium text-gtc-navy">
              {result.scan_time ? new Date(result.scan_time).toLocaleString('zh-CN') : '-'}
            </p>
          </div>
        </div>

        {result.scanned_entities && result.scanned_entities.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-2">扫描的实体:</p>
            <div className="flex flex-wrap gap-2">
              {result.scanned_entities.map((entity, i) => (
                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  {entity}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.matches && result.matches.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h5 className="font-medium text-red-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              发现 {result.matches.length} 个黑名单匹配
            </h5>
            <div className="space-y-3">
              {result.matches.map((match, i) => (
                <div key={i} className="bg-white rounded-lg p-3 border border-red-100">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-800">{match.input_entity}</p>
                      <p className="text-sm text-gray-500">
                        匹配: {match.matched_entity}
                        {match.matched_alias && ` (别名: ${match.matched_alias})`}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(match.match_level)}`}>
                      {match.match_level}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>相似度: {(match.similarity_score * 100).toFixed(1)}%</span>
                    <span>类型: {match.entity_type}</span>
                    <span>添加日期: {match.added_date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!result.matches || result.matches.length === 0) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              未发现 UFLPA 黑名单匹配，供应链风险较低
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderAnalysisResult = (data) => {
    const riskDetails = data.risk_details || data;
    const riskScore = riskDetails.risk_score || data.risk_score || 0;
    const riskLevel = riskDetails.risk_level || data.risk_level || 'unknown';
    const summary = riskDetails.executive_summary || data.executive_summary || data.risk_analysis || '暂无摘要';
    const issues = riskDetails.critical_issues || data.critical_issues || [];
    const riskColor = getRiskColor(riskScore);

    return (
      <div className="space-y-4">
        <div className={`rounded-xl p-4 border ${riskColor.bg} ${riskColor.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className={`w-8 h-8 ${riskColor.text}`} />
              <div>
                <p className="text-sm text-gray-600">风险评分</p>
                <p className={`text-3xl font-bold ${riskColor.text}`}>{riskScore}/10</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(riskLevel)}`}>
              {riskLevel === 'high' ? '高风险' : riskLevel === 'medium' ? '中等风险' : '低风险'}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h4 className="font-medium text-gtc-navy mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> 风险摘要
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </div>
        {issues.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h4 className="font-medium text-gtc-navy mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> 关键问题 ({issues.length})
            </h4>
            <div className="space-y-3">
              {issues.map((issue, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-gray-800 text-sm">{issue.issue}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                      {issue.severity === 'high' || issue.severity === 'critical' ? '高' : issue.severity === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                  {issue.evidence && <p className="text-xs text-gray-600 mb-1"><span className="font-medium">证据:</span> {issue.evidence}</p>}
                  {issue.impact && <p className="text-xs text-gray-600 mb-1"><span className="font-medium">影响:</span> {issue.impact}</p>}
                  {issue.recommendation && <p className="text-xs text-blue-600"><span className="font-medium">建议:</span> {issue.recommendation}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSavedRiskAnalysis = () => {
    if (!caseData?.risk_score && !caseData?.risk_analysis) return null;
    const riskScore = caseData.risk_score || 0;
    const riskColor = getRiskColor(riskScore);
    return (
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gtc-navy flex items-center gap-2">
          <Brain className="w-4 h-4" /> 已保存的风险分析
        </h4>
        <div className={`rounded-xl p-4 border ${riskColor.bg} ${riskColor.border}`}>
          <div className="flex items-center gap-3">
            <Shield className={`w-8 h-8 ${riskColor.text}`} />
            <div>
              <p className="text-sm text-gray-600">风险评分</p>
              <p className={`text-3xl font-bold ${riskColor.text}`}>{riskScore}/10</p>
            </div>
          </div>
        </div>
        {caseData.risk_analysis && (
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">{caseData.risk_analysis}</p>
          </div>
        )}
      </div>
    );
  };

  const renderSavedPetition = () => {
    if (!caseData?.petition_draft) return null;
    return (
      <div className="space-y-4 mb-6">
        <h4 className="font-medium text-gtc-navy flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> 已保存的申诉书
        </h4>
        <div className="bg-gray-50 rounded-xl p-4">
          <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-gray-700">{caseData.petition_draft}</pre>
        </div>
      </div>
    );
  };

  // 渲染工具结果
  const renderToolResult = () => {
    if (!toolResult) return null;

    if (!toolResult.success) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
          <p className="text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {toolResult.message}
          </p>
        </div>
      );
    }

    const { type, data } = toolResult;
    const result = data.result || data;

    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
        <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {type === 'preprocess' && '预处理完成'}
          {type === 'classify' && '分类抽取完成'}
          {type === 'consistency' && '一致性校验完成'}
        </h4>
        <div className="text-sm text-gray-700 space-y-2">
          {type === 'preprocess' && (
            <>
              <p>状态: {result.status}</p>
              <p>处理页数: {result.pages_processed}/{result.pages_total}</p>
              <p>质量评分: {(result.quality_score * 100).toFixed(0)}%</p>
              <p>OCR: {result.ocr_applied ? '已应用' : '未应用'}</p>
              <p>语言: {result.language_detected}</p>
            </>
          )}
          {type === 'classify' && (
            <>
              <p>文档类型: {result.doc_kind}</p>
              <p>置信度: {(result.confidence * 100).toFixed(0)}%</p>
              <p>抽取字段: {Array.isArray(result.fields_extracted) ? result.fields_extracted.join(', ') : result.fields_extracted}</p>
            </>
          )}
          {type === 'consistency' && (
            <>
              <p>总检查项: {result.total_checks}</p>
              <p>通过: {result.passed}</p>
              <p>失败: {result.failed}</p>
              <p>警告: {result.warnings}</p>
              <p>风险评分: {result.risk_score}/10</p>
            </>
          )}
        </div>
      </div>
    );
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
                <p className="text-sm"><span className="text-gray-400">HTS编码:</span> {caseData.hts_code || '-'}</p>
                <p className="text-sm"><span className="text-gray-400">法律依据:</span> {caseData.law_basis || '-'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h3 className="font-medium text-gtc-navy flex items-center gap-2"><MapPin className="w-4 h-4" /> 查扣详情</h3>
                <p className="text-sm"><span className="text-gray-400">查扣编号:</span> {caseData.seizure_number || '-'}</p>
                <p className="text-sm"><span className="text-gray-400">口岸:</span> {caseData.port_of_entry || '-'}</p>
                <p className="text-sm"><span className="text-gray-400">创建:</span> {new Date(caseData.created_at).toLocaleString('zh-CN')}</p>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
  <div className="space-y-4">
    {/* 拖拽上传区域 */}
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
        isDragging 
          ? 'border-gtc-gold bg-gtc-gold/10 scale-[1.02]' 
          : 'border-gray-300 hover:border-gtc-gold'
      }`}
    >
      <input
        type="file"
        id="file-upload"
        onChange={handleFileUpload}
        className="hidden"
        disabled={uploading}
      />
      <label htmlFor="file-upload" className="cursor-pointer block">
        {uploading ? (
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-gtc-gold" />
        ) : (
          <Upload className={`w-10 h-10 mx-auto ${isDragging ? 'text-gtc-gold' : 'text-gray-400'}`} />
        )}
        <p className="mt-2 text-sm text-gray-600">
          {uploading ? '上传中...' : isDragging ? '松开即可上传' : '拖拽文件到此处，或点击选择文件'}
        </p>
        <p className="text-xs text-gray-400 mt-1">支持 PDF、图片、Word 等格式</p>
      </label>
    </div>

    {/* 工具按钮 */}
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={handleConsistencyCheck}
        disabled={processing || files.length === 0}
        className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 disabled:opacity-50"
      >
        {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
        一致性校验
      </button>
      <button
        onClick={handleRiskScan}
        disabled={scanning}
        className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 disabled:opacity-50"
      >
        {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        UFLPA 扫描
      </button>
    </div>

    {renderToolResult()}
    {renderScanResult()}

    {/* 文件列表 */}
    {files.length > 0 ? (
      <div className="divide-y">
        {files.map((file) => (
          <div key={file.id} className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-gtc-navy" />
              <div>
                <span className="block">{file.file_name}</span>
                {file.doc_kind && (
                  <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                    {file.doc_kind}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePreprocess(file.id)}
                disabled={processing}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                title="预处理"
              >
                <RefreshCw className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => handleClassifyExtract(file.id)}
                disabled={processing}
                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-50"
                title="分类抽取"
              >
                <Brain className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFileDownload(file.id, file.file_name)}
                className="p-2 text-gray-500 hover:text-gtc-navy hover:bg-gray-100 rounded-lg"
                title="下载"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleFileDelete(file.id)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-center text-gray-500 py-8">暂无文件，请上传溯源文档</p>
    )}
  </div>
)}

          {activeTab === 'ai' && (
            <div className="space-y-6">
               {/* Agent 一键智能分析 */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Agent 智能分析</h3>
                <p className="text-sm text-gray-600 mb-4">自动执行完整分析流程：文档预处理 → 字段提取 → 一致性校验 → 风险扫描</p>
                <AgentAnalyzeButton caseId={parseInt(id)} onComplete={() => fetchCaseData()} />
              </div>
              {renderSavedRiskAnalysis()}
              {renderSavedPetition()}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={handleAnalyze} disabled={analyzing}
                  className="bg-blue-500 text-white p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50">
                  {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                  {caseData?.risk_score ? '重新分析风险' : 'Gemini 风险分析'}
                </button>
                <button onClick={handleGeneratePetition} disabled={generating}
                  className="bg-purple-500 text-white p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-600 disabled:opacity-50">
                  {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {caseData?.petition_draft ? '重新生成申诉书' : 'Claude 生成申诉书'}
                </button>
                <button onClick={handleRiskScan} disabled={scanning}
                  className="bg-red-500 text-white p-4 rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 disabled:opacity-50">
                  {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  UFLPA 黑名单扫描
                </button>
              </div>
              
              {renderScanResult()}
              
              {aiResult && (
                <div className={`rounded-xl ${aiResult.type === 'error' ? 'bg-red-50 text-red-600 p-4' : ''}`}>
                  {aiResult.type === 'error' ? (
                    aiResult.message
                  ) : aiResult.type === 'analysis' ? (
                    <div>
                      <h4 className="font-medium text-gtc-navy mb-3 flex items-center gap-2">
                        <Brain className="w-4 h-4" /> 新生成的风险分析
                      </h4>
                      {renderAnalysisResult(aiResult.data)}
                    </div>
                  ) : aiResult.type === 'petition' ? (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-medium text-gtc-navy mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> 新生成的申诉书
                      </h4>
                      <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-gray-700">{aiResult.data.petition_draft}</pre>
                    </div>
                  ) : (
                    <pre className="text-sm whitespace-pre-wrap p-4 bg-gray-50 rounded-xl">{JSON.stringify(aiResult.data, null, 2)}</pre>
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
