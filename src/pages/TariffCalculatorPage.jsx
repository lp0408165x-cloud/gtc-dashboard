import { useState } from 'react';
import {
  Calculator, Search, AlertCircle, CheckCircle,
  Loader2, ChevronRight, Info, FileText, TrendingUp,
  Shield, AlertTriangle, Download
} from 'lucide-react';
import api from '../services/api';

const COUNTRIES = [
  { code: 'CN', label: '中国 (China)' },
  { code: 'VN', label: '越南 (Vietnam)' },
  { code: 'IN', label: '印度 (India)' },
  { code: 'MX', label: '墨西哥 (Mexico)' },
  { code: 'BD', label: '孟加拉 (Bangladesh)' },
  { code: 'TH', label: '泰国 (Thailand)' },
  { code: 'ID', label: '印度尼西亚 (Indonesia)' },
  { code: 'KR', label: '韩国 (Korea)' },
  { code: 'TW', label: '台湾 (Taiwan)' },
  { code: 'OTHER', label: '其他' },
];

const UFLPA_COLOR = {
  '高': 'text-red-600 bg-red-50 border-red-200',
  '中': 'text-amber-600 bg-amber-50 border-amber-200',
  '低': 'text-green-600 bg-green-50 border-green-200',
};

const getUflpaLevel = (text) => {
  if (text?.includes('高')) return '高';
  if (text?.includes('中')) return '中';
  return '低';
};

export default function TariffCalculatorPage() {
  const [form, setForm] = useState({
    product_description: '',
    country_of_origin: 'CN',
    intended_use: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const handleCalculate = async () => {
    if (!form.product_description.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.post('/tariff/calculate', form);
      setResult(res.data);
      setHistory((prev) => [{ ...res.data, query: form.product_description, ts: new Date() }, ...prev.slice(0, 4)]);
    } catch (e) {
      setError(e.response?.data?.detail || '计算失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const uflpaLevel = result ? getUflpaLevel(result.uflpa_risk) : null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 页头 */}
      <div>
        <h1 className="text-2xl font-bold text-gtc-navy flex items-center gap-2">
          <Calculator className="w-7 h-7 text-gtc-gold" />
           关税计算器
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          输入产品描述，自动识别 HS Code 并计算对华关税（MFN + Section 301 + Section 122）
        </p>
      </div>

      {/* 输入区 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="space-y-4">
          {/* 产品描述 */}
          <div>
            <label className="block text-sm font-medium text-gtc-navy mb-1.5">
              产品描述 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.product_description}
              onChange={(e) => setForm({ ...form, product_description: e.target.value })}
              placeholder="例如：棉质男士针织T恤，100%棉，中国制造，用于零售销售"
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gtc-gold focus:ring-1 focus:ring-gtc-gold transition-all resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">描述越详细，归类越准确。建议包含材质、用途、加工方式等信息。</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 原产地 */}
            <div>
              <label className="block text-sm font-medium text-gtc-navy mb-1.5">原产地</label>
              <select
                value={form.country_of_origin}
                onChange={(e) => setForm({ ...form, country_of_origin: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gtc-gold focus:ring-1 focus:ring-gtc-gold transition-all"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>
            {/* 用途 */}
            <div>
              <label className="block text-sm font-medium text-gtc-navy mb-1.5">
                用途 <span className="text-gray-400 font-normal">（可选）</span>
              </label>
              <input
                value={form.intended_use}
                onChange={(e) => setForm({ ...form, intended_use: e.target.value })}
                placeholder="例如：工业用途、零售销售、组装原料..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gtc-gold focus:ring-1 focus:ring-gtc-gold transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={loading || !form.product_description.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gtc-navy text-white rounded-xl font-medium text-sm hover:bg-gtc-navy/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />计算分析中，请稍候...</>
            ) : (
              <><Search className="w-4 h-4" />计算关税</>
            )}
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 结果区 */}
      {result && (
        <div className="space-y-4">
          {/* HS Code + 总税率 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gtc-navy rounded-2xl p-5 text-white sm:col-span-1">
              <p className="text-white/60 text-xs mb-1">HTS 编码</p>
              <p className="text-2xl font-bold font-mono tracking-wider text-gtc-gold">{result.hs_code}</p>
              <p className="text-white/70 text-xs mt-2 leading-relaxed">{result.hs_description}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:col-span-2">
              <p className="text-gray-500 text-xs mb-3 font-medium">关税税率构成</p>
              <div className="space-y-2">
                <TariffRow label="MFN 基础税率" value={result.base_rate} />
                <TariffRow label="Section 301 对华关税" value={result.section_301} highlight />
                <TariffRow label="Section 232 钢铁/铝" value={result.section_232} />
                <div className="border-t border-gray-200 pt-2 mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-gtc-navy">估算总税率</span>
                  <span className="text-xl font-bold text-red-600">{result.total_rate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* UFLPA 风险 */}
          <div className={`flex items-start gap-3 px-5 py-4 rounded-2xl border ${UFLPA_COLOR[uflpaLevel]}`}>
            <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm mb-0.5">UFLPA 强迫劳动风险：{uflpaLevel}</p>
              <p className="text-sm opacity-80">{result.uflpa_risk}</p>
            </div>
          </div>

          {/* 分析 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="font-semibold text-gtc-navy text-sm mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gtc-gold" />分析说明
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">{result.analysis}</p>
          </div>

          {/* 行动建议 */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="font-semibold text-gtc-navy text-sm mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gtc-gold" />建议行动
            </p>
            <ul className="space-y-2">
              {result.action_items?.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <ChevronRight className="w-4 h-4 text-gtc-gold flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* 免责声明 */}
          <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {result.disclaimer}
          </div>

          {/* 需要帮助 */}
          <div className="flex items-center justify-between bg-gradient-to-r from-gtc-navy to-gtc-navy/80 text-white rounded-2xl px-6 py-4">
            <div>
              <p className="font-semibold text-sm">需要专业合规支持？</p>
              <p className="text-white/60 text-xs mt-0.5">GTC Global 提供 HTS 归类复核、关税申诉、UFLPA 合规全套服务</p>
            </div>
            <a
              href="/cases/new"
              className="flex items-center gap-1.5 bg-gtc-gold text-gtc-navy px-4 py-2 rounded-xl text-sm font-bold hover:bg-gtc-gold/90 transition-colors flex-shrink-0"
            >
              创建案件 <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* 查询历史 */}
      {history.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="font-semibold text-gtc-navy text-sm mb-3">最近查询</p>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm text-gray-700 line-clamp-1">{h.query}</p>
                  <p className="text-xs text-gray-400 mt-0.5">HTS: {h.hs_code} · 总税率: {h.total_rate}</p>
                </div>
                <button
                  onClick={() => { setForm({ ...form, product_description: h.query }); setResult(h); }}
                  className="text-xs text-gtc-gold hover:underline flex-shrink-0 ml-4"
                >
                  查看
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TariffRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-red-600' : 'text-gtc-navy'}`}>{value}</span>
    </div>
  );
}
