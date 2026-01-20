import { useState, useEffect, useCallback } from 'react';
import { 
  FileSearch, 
  Upload, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Trash2,
  Download,
  Eye,
  Loader2,
  ClipboardList,
  Package,
  MapPin,
  ShieldAlert,
  Pencil,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { supplyChainAPI } from '../services/supplyChainApi';

// 任务类型图标映射
const taskIcons = {
  supply_chain_doc_review: ClipboardList,
  bci_compliance_verification: CheckCircle,
  origin_traceability: MapPin,
  forced_labor_risk_assessment: ShieldAlert,
  custom: Pencil,
};

const SupplyChainReviewPage = () => {
  // 步骤状态
  const [currentStep, setCurrentStep] = useState(1);
  
  // 数据状态
  const [taskTemplates, setTaskTemplates] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [reviews, setReviews] = useState([]);
  
  // 表单状态
  const [caseName, setCaseName] = useState('');
  const [selectedTaskType, setSelectedTaskType] = useState('supply_chain_doc_review');
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [industry, setIndustry] = useState('textile');
  
  // 当前审查状态
  const [currentReview, setCurrentReview] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [report, setReport] = useState(null);
  
  // UI状态
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showReviewList, setShowReviewList] = useState(false);
  const [promptPreview, setPromptPreview] = useState(null);
  const [showPromptModal, setShowPromptModal] = useState(false);

  // 加载初始数据
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [templatesRes, certsRes, reviewsRes] = await Promise.all([
        supplyChainAPI.getTaskTemplates(),
        supplyChainAPI.getCertifications(),
        supplyChainAPI.listReviews(),
      ]);
      setTaskTemplates(templatesRes);
      setCertifications(certsRes);
      setReviews(reviewsRes.reviews || []);
    } catch (err) {
      console.error('Failed to load initial data:', err);
      setError('加载数据失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  // 创建审查案件
  const handleCreateReview = async () => {
    if (!caseName.trim()) {
      setError('请输入案件名称');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const reviewData = {
        case_name: caseName,
        task_type: selectedTaskType,
        certifications: selectedCerts,
        industry: industry,
      };
      const result = await supplyChainAPI.createReview(reviewData);
      setCurrentReview(result);
      setCurrentStep(2);
    } catch (err) {
      console.error('Failed to create review:', err);
      setError('创建审查案件失败');
    } finally {
      setLoading(false);
    }
  };

  // 文件上传
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !currentReview) return;

    setLoading(true);
    setError(null);

    try {
      for (const file of files) {
        const result = await supplyChainAPI.uploadFile(currentReview.review_id, file);
        setUploadedFiles(prev => [...prev, {
          file_id: result.file_id,
          filename: result.filename,
          size: result.size,
        }]);
      }
      // 刷新当前审查状态
      const updated = await supplyChainAPI.getReview(currentReview.review_id);
      setCurrentReview(updated);
    } catch (err) {
      console.error('Failed to upload file:', err);
      setError('文件上传失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除文件
  const handleDeleteFile = async (fileId) => {
    if (!currentReview) return;
    
    try {
      await supplyChainAPI.deleteFile(currentReview.review_id, fileId);
      setUploadedFiles(prev => prev.filter(f => f.file_id !== fileId));
    } catch (err) {
      console.error('Failed to delete file:', err);
      setError('删除文件失败');
    }
  };

  // 预览提示词
  const handlePreviewPrompt = async () => {
    if (!currentReview) return;
    
    try {
      const result = await supplyChainAPI.getPromptPreview(currentReview.review_id);
      setPromptPreview(result.system_prompt);
      setShowPromptModal(true);
    } catch (err) {
      console.error('Failed to get prompt preview:', err);
      setError('获取提示词预览失败');
    }
  };

  // 执行审查
  const handleProcessReview = async () => {
    if (!currentReview) return;
    
    setProcessing(true);
    setError(null);

    try {
      await supplyChainAPI.processReview(currentReview.review_id);
      const reportResult = await supplyChainAPI.getReport(currentReview.review_id);
      setReport(reportResult.report);
      setCurrentStep(3);
    } catch (err) {
      console.error('Failed to process review:', err);
      setError('审查处理失败');
    } finally {
      setProcessing(false);
    }
  };

  // 下载报告
  const handleDownloadReport = async () => {
    if (!currentReview) return;
    
    try {
      const blob = await supplyChainAPI.downloadReport(currentReview.review_id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentReview.case_name}_report.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download report:', err);
      setError('下载报告失败');
    }
  };

  // 新建审查
  const handleNewReview = () => {
    setCurrentStep(1);
    setCaseName('');
    setSelectedTaskType('supply_chain_doc_review');
    setSelectedCerts([]);
    setCurrentReview(null);
    setUploadedFiles([]);
    setReport(null);
    setError(null);
  };

  // 加载历史审查
  const handleLoadReview = async (review) => {
    setLoading(true);
    try {
      const detailed = await supplyChainAPI.getReview(review.review_id);
      setCurrentReview(detailed);
      setCaseName(detailed.case_name);
      setSelectedTaskType(detailed.task_type);
      setSelectedCerts(detailed.certifications || []);
      setUploadedFiles(detailed.files || []);
      
      if (detailed.status === 'completed') {
        const reportResult = await supplyChainAPI.getReport(review.review_id);
        setReport(reportResult.report);
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
      setShowReviewList(false);
    } catch (err) {
      console.error('Failed to load review:', err);
      setError('加载审查案件失败');
    } finally {
      setLoading(false);
    }
  };

  // 认证选择切换
  const toggleCertification = (certId) => {
    setSelectedCerts(prev => 
      prev.includes(certId) 
        ? prev.filter(c => c !== certId)
        : [...prev, certId]
    );
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
            currentStep >= step 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            {step}
          </div>
          {index < 2 && (
            <div className={`w-20 h-1 mx-2 ${
              currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  // 渲染步骤1：选择任务
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          案件名称 *
        </label>
        <input
          type="text"
          value={caseName}
          onChange={(e) => setCaseName(e.target.value)}
          placeholder="例如：Kam Hing Cotton Supply Chain Review"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          选择审查类型 *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {taskTemplates.map((template) => {
            const Icon = taskIcons[template.id] || FileSearch;
            return (
              <div
                key={template.id}
                onClick={() => setSelectedTaskType(template.id)}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedTaskType === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <Icon className={`w-8 h-8 mb-3 ${
                  selectedTaskType === template.id ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <h3 className="font-medium text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          涉及认证（可多选）
        </label>
        <div className="flex flex-wrap gap-2">
          {certifications.map((cert) => (
            <button
              key={cert.id}
              onClick={() => toggleCertification(cert.id)}
              className={`px-4 py-2 rounded-full border transition-all ${
                selectedCerts.includes(cert.id)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
              }`}
            >
              {cert.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleCreateReview}
          disabled={loading || !caseName.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              下一步：上传文件
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  // 渲染步骤2：上传文件
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{currentReview?.case_name}</h3>
            <p className="text-sm text-gray-500">
              {taskTemplates.find(t => t.id === currentReview?.task_type)?.name}
              {selectedCerts.length > 0 && ` • ${selectedCerts.join(', ')}`}
            </p>
          </div>
          <button
            onClick={handlePreviewPrompt}
            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            预览提示词
          </button>
        </div>
      </div>

      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
        onClick={() => document.getElementById('file-upload').click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const files = e.dataTransfer.files;
          if (files.length) {
            handleFileUpload({ target: { files } });
          }
        }}
      >
        <input
          id="file-upload"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
        />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">拖拽文件到此处，或点击上传</p>
        <p className="text-sm text-gray-400">支持 PDF, Word, Excel, 图片</p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">已上传文件 ({uploadedFiles.length})</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file) => (
              <div
                key={file.file_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{file.filename}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.file_id)}
                  className="text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={() => setCurrentStep(1)}
          className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-5 h-5" />
          上一步
        </button>
        <button
          onClick={handleProcessReview}
          disabled={processing || uploadedFiles.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              处理中...
            </>
          ) : (
            <>
              开始审查
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  // 渲染步骤3：查看报告
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-green-500" />
          <div>
            <h3 className="font-medium text-gray-900">审查完成</h3>
            <p className="text-sm text-gray-500">{currentReview?.case_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            下载报告
          </button>
          <button
            onClick={handleNewReview}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            新建审查
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6 max-h-[600px] overflow-y-auto">
        <div className="prose prose-sm max-w-none">
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
            {report}
          </pre>
        </div>
      </div>
    </div>
  );

  // 渲染提示词预览模态框
  const renderPromptModal = () => (
    showPromptModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium text-gray-900">系统提示词预览</h3>
            <button
              onClick={() => setShowPromptModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded-lg">
              {promptPreview}
            </pre>
          </div>
          <div className="p-4 border-t bg-gray-50">
            <p className="text-sm text-gray-500">
              此提示词将自动发送给 AI，包含审查范围、检查清单和输出要求。
            </p>
          </div>
        </div>
      </div>
    )
  );

  // 渲染审查列表侧边栏
  const renderReviewList = () => (
    showReviewList && (
      <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
        <div className="bg-white w-full max-w-md h-full overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium text-gray-900">历史审查</h3>
            <button
              onClick={() => setShowReviewList(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-2 overflow-y-auto h-[calc(100%-60px)]">
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无历史审查</p>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.review_id}
                  onClick={() => handleLoadReview(review)}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 truncate">{review.case_name}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      review.status === 'completed' 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {review.status === 'completed' ? '已完成' : '进行中'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  );

  if (loading && !taskTemplates.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gtc-navy">供应链审查</h1>
          <p className="text-gray-500 mt-1">审查供应链文档的完整性、一致性，识别缺失文件和数据差异</p>
        </div>
        <button
          onClick={() => setShowReviewList(true)}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <FileSearch className="w-4 h-4" />
          历史审查
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 步骤指示器 */}
      {renderStepIndicator()}

      {/* 步骤内容 */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {/* 模态框 */}
      {renderPromptModal()}
      {renderReviewList()}
    </div>
  );
};

export default SupplyChainReviewPage;
