import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { casesAPI } from '../services/api';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Package,
  Building,
  MapPin,
  AlertCircle,
  CheckCircle,
  Upload,
} from 'lucide-react';

const NewCasePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    cbp_case_number: '',
    product_description: '',
    hts_code: '',
    country_of_origin: '',
    manufacturer_name: '',
    manufacturer_address: '',
    importer_name: '',
    detention_reason: '',
    detention_date: '',
    port_of_entry: '',
    estimated_value: '',
    quantity: '',
    notes: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const caseData = {
        ...formData,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
      };
      
      const newCase = await casesAPI.create(caseData);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/cases/${newCase.id}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || '创建案件失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: '基本信息', icon: FileText },
    { number: 2, title: '产品信息', icon: Package },
    { number: 3, title: '供应商信息', icon: Building },
    { number: 4, title: '查扣详情', icon: MapPin },
  ];

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gtc-navy mb-2">
            案件创建成功！
          </h2>
          <p className="text-gray-500 mb-6">
            正在跳转到案件详情页面...
          </p>
          <div className="w-8 h-8 border-2 border-gtc-gold/30 border-t-gtc-gold rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gtc-navy mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>
        <h1 className="text-2xl font-display font-bold text-gtc-navy">
          新建案件
        </h1>
        <p className="text-gray-500">填写海关查扣案件信息</p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div
                className={`flex items-center gap-3 ${
                  step >= s.number ? 'text-gtc-navy' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    step >= s.number
                      ? 'bg-gtc-gold text-gtc-navy'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="font-medium hidden sm:block">{s.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 sm:w-24 h-1 mx-4 rounded ${
                    step > s.number ? 'bg-gtc-gold' : 'bg-gray-200'
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl shadow-sm p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Step 1: 基本信息 */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-display font-bold text-gtc-navy mb-6">
                基本信息
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  案件标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                  placeholder="例如：XX公司太阳能电池板查扣案件"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CBP 案件编号
                </label>
                <input
                  type="text"
                  name="cbp_case_number"
                  value={formData.cbp_case_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                  placeholder="例如：2024-1234-567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all resize-none"
                  placeholder="其他需要说明的信息..."
                />
              </div>
            </div>
          )}

          {/* Step 2: 产品信息 */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-display font-bold text-gtc-navy mb-6">
                产品信息
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  产品描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="product_description"
                  value={formData.product_description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all resize-none"
                  placeholder="详细描述被查扣的产品..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HTS 编码
                  </label>
                  <input
                    type="text"
                    name="hts_code"
                    value={formData.hts_code}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                    placeholder="例如：8541.40.6020"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    原产国
                  </label>
                  <input
                    type="text"
                    name="country_of_origin"
                    value={formData.country_of_origin}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                    placeholder="例如：中国"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    数量
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                    placeholder="货物数量"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    预估货值 (USD)
                  </label>
                  <input
                    type="number"
                    name="estimated_value"
                    value={formData.estimated_value}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                    placeholder="例如：50000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: 供应商信息 */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-display font-bold text-gtc-navy mb-6">
                供应商信息
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  制造商名称
                </label>
                <input
                  type="text"
                  name="manufacturer_name"
                  value={formData.manufacturer_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                  placeholder="制造商公司名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  制造商地址
                </label>
                <textarea
                  name="manufacturer_address"
                  value={formData.manufacturer_address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all resize-none"
                  placeholder="制造商详细地址"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  进口商名称
                </label>
                <input
                  type="text"
                  name="importer_name"
                  value={formData.importer_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                  placeholder="美国进口商公司名称"
                />
              </div>
            </div>
          )}

          {/* Step 4: 查扣详情 */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-display font-bold text-gtc-navy mb-6">
                查扣详情
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  查扣原因
                </label>
                <select
                  name="detention_reason"
                  value={formData.detention_reason}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                >
                  <option value="">请选择查扣原因</option>
                  <option value="UFLPA">UFLPA 强迫劳动</option>
                  <option value="WRO">WRO 暂扣令</option>
                  <option value="AD/CVD">反倾销/反补贴</option>
                  <option value="IPR">知识产权侵权</option>
                  <option value="Section 301">301条款</option>
                  <option value="Other">其他原因</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    查扣日期
                  </label>
                  <input
                    type="date"
                    name="detention_date"
                    value={formData.detention_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    入境口岸
                  </label>
                  <input
                    type="text"
                    name="port_of_entry"
                    value={formData.port_of_entry}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                    placeholder="例如：Los Angeles, CA"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gtc-navy transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                上一步
              </button>
            ) : (
              <div></div>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 bg-gtc-navy text-white px-6 py-3 rounded-xl font-medium hover:bg-gtc-blue transition-colors"
              >
                下一步
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 bg-gtc-gold text-gtc-navy px-8 py-3 rounded-xl font-medium hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-gtc-navy/30 border-t-gtc-navy rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    创建案件
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewCasePage;
