import { useState, useMemo } from 'react';
import {
  Sun, Calculator, Info, AlertTriangle, ChevronRight,
  TrendingUp, FileText, Shield, RotateCcw
} from 'lucide-react';

// ══════════════════════════════════════════════════════════
// 政策参数（政策变动时只需修改此处）
// 基准日：2026-08-07
// ══════════════════════════════════════════════════════════
const POLICY = {
  effectiveDate: '2026-12-04',
  mip: {
    module: 0.38,   // 光伏组件 $/W
    cell: 0.22,     // 电池片 $/W
  },
  section232: 0.15, // 多晶硅衍生品从价税
  mpf: 0.003464,    // 商品处理费
  hmf: 0.00125,     // 港口维护费（仅海运）
  mfn: 0,           // HTS 8541.42 / 8541.43 均为 Free
};

// 原产国预设：301 税率（原有 + 2026-07-24 新增强迫劳动 301）
const COUNTRIES = [
  { code: 'CN', label: '中国 China',        s301: 0.625, note: '原有太阳能 301 50% + 新增强迫劳动 301 12.5%', adcvd: true },
  { code: 'VN', label: '越南 Vietnam',      s301: 0.125, note: '新增强迫劳动 301 12.5% 加征档', adcvd: true },
  { code: 'TH', label: '泰国 Thailand',     s301: 0.125, note: '新增强迫劳动 301 12.5% 加征档', adcvd: true },
  { code: 'KH', label: '柬埔寨 Cambodia',   s301: 0.10,  note: '新增强迫劳动 301 10% 加征档', adcvd: true },
  { code: 'MY', label: '马来西亚 Malaysia', s301: 0.10,  note: '新增强迫劳动 301 10% 加征档', adcvd: true },
  { code: 'IN', label: '印度 India',        s301: 0.10,  note: '新增强迫劳动 301 10% 加征档；AD/CVD 调查中', adcvd: true },
  { code: 'ID', label: '印度尼西亚 Indonesia', s301: 0.125, note: '新增强迫劳动 301 12.5% 加征档；AD/CVD 调查中', adcvd: true },
  { code: 'LA', label: '老挝 Laos',         s301: 0,     note: 'AD/CVD 调查中；301 名单需逐案核实', adcvd: true },
  { code: 'KR', label: '韩国 Korea',        s301: 0.125, note: '净额封顶档：MFN+301 合计 12.5%', adcvd: false },
  { code: 'TW', label: '台湾地区 Taiwan',   s301: 0.10,  note: '净额封顶档：MFN+301 合计 10%；另有既有太阳能 AD 命令', adcvd: true },
  { code: 'JP', label: '日本 Japan',        s301: 0.125, note: '净额封顶档：MFN+301 合计 12.5%', adcvd: false },
  { code: 'EU', label: '欧盟 EU',           s301: 0.10,  note: '净额封顶档：MFN+301 合计 10%', adcvd: false },
  { code: 'OTHER_60', label: '其他 60 国名单内', s301: 0.125, note: '强迫劳动 301 加征档，需核对具体国别', adcvd: false },
  { code: 'CLEAN', label: '不在 60 国名单内',   s301: 0,     note: '无强迫劳动 301；仍需确认无太阳能 AD/CVD', adcvd: false },
];

const fmt = (n, d = 4) => (isFinite(n) ? n.toFixed(d) : '—');
const pct = (n) => (isFinite(n) ? (n * 100).toFixed(1) + '%' : '—');

export default function SolarTariffPage() {
  const [form, setForm] = useState({
    productType: 'module',
    enteredValue: '0.25',
    country: 'CLEAN',
    adRate: '0',
    cvdRate: '0',
    s232Base: 'MIP',   // 'EV' 申报价 | 'MIP' 补足后价格
    hasMipDoc: true,
    isOcean: true,
    wattage: '',        // 可选：项目总瓦数，用于换算总额
  });

  const reset = () => setForm({
    productType: 'module', enteredValue: '0.25', country: 'CLEAN',
    adRate: '0', cvdRate: '0', s232Base: 'MIP', hasMipDoc: true, isOcean: true, wattage: '',
  });

  const country = COUNTRIES.find((c) => c.code === form.country) || COUNTRIES[0];

  const calc = useMemo(() => {
    const ev = parseFloat(form.enteredValue) || 0;
    const mip = form.productType === 'module' ? POLICY.mip.module : POLICY.mip.cell;
    const ad = (parseFloat(form.adRate) || 0) / 100;
    const cvd = (parseFloat(form.cvdRate) || 0) / 100;

    // MIP：提交合格文件补差额；未提交按全额征收
    const mipDuty = form.hasMipDoc ? Math.max(mip - ev, 0) : mip;

    // Section 232 计税基数
    const s232Base = form.s232Base === 'MIP' ? mip : ev;
    const s232 = s232Base * POLICY.section232;

    const s301 = ev * country.s301;
    const adDuty = ev * ad;
    const cvdDuty = ev * cvd;
    const mfn = ev * POLICY.mfn;
    const fees = ev * (POLICY.mpf + (form.isOcean ? POLICY.hmf : 0));

    const totalDuty = mipDuty + s232 + s301 + adDuty + cvdDuty + mfn + fees;
    const landed = ev + totalDuty;
    const ratio = ev > 0 ? totalDuty / ev : 0;

    // 对照：另一种 232 口径
    const altBase = form.s232Base === 'MIP' ? ev : mip;
    const altLanded = landed - s232 + altBase * POLICY.section232;

    const w = parseFloat(form.wattage) || 0;
    return {
      ev, mip, mipDuty, s232, s232Base, s301, adDuty, cvdDuty, mfn, fees,
      totalDuty, landed, ratio, altLanded,
      projTotal: w > 0 ? landed * w : null,
      projDuty: w > 0 ? totalDuty * w : null,
    };
  }, [form, country]);

  const rows = [
    { label: 'MIP 差额（从量税）', v: calc.mipDuty, hint: form.hasMipDoc ? `${fmt(calc.mip, 2)} − ${fmt(calc.ev, 2)}` : `按 MIP 全额 ${fmt(calc.mip, 2)} 征收`, danger: !form.hasMipDoc },
    { label: 'Section 232（15%）', v: calc.s232, hint: `基数 ${fmt(calc.s232Base, 2)} × 15%` },
    { label: 'Section 301', v: calc.s301, hint: country.s301 > 0 ? `${fmt(calc.ev, 2)} × ${pct(country.s301)}` : '不适用' },
    { label: 'AD 反倾销保证金', v: calc.adDuty, hint: form.adRate > 0 ? `${fmt(calc.ev, 2)} × ${form.adRate}%` : '未填写' },
    { label: 'CVD 反补贴保证金', v: calc.cvdDuty, hint: form.cvdRate > 0 ? `${fmt(calc.ev, 2)} × ${form.cvdRate}%` : '未填写' },
    { label: 'MFN 基础税率', v: calc.mfn, hint: 'HTS 8541.42 / 8541.43 = Free' },
    { label: 'MPF + HMF 规费', v: calc.fees, hint: form.isOcean ? '0.3464% + 0.125%' : '0.3464%（空运无 HMF）' },
  ];

  const inputCls = 'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gtc-gold focus:ring-1 focus:ring-gtc-gold transition-all';
  const labelCls = 'block text-sm font-medium text-gtc-navy mb-1.5';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* 页头 */}
      <div>
        <h1 className="text-2xl font-bold text-gtc-navy flex items-center gap-2">
          <Sun className="w-7 h-7 text-gtc-gold" />
          光伏进口税负测算
          <span className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded-full font-semibold align-middle">NEW</span>
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Section 232 多晶硅措施（{POLICY.effectiveDate} 生效）下的完整叠加测算：MIP + 232 + 301 + AD/CVD + 规费
        </p>
      </div>

      {/* 输入区 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>产品类型</label>
            <select value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })} className={inputCls}>
              <option value="module">光伏组件 Module（MIP $0.38/W）</option>
              <option value="cell">电池片 Cell（MIP $0.22/W）</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>申报价 Entered Value（$/W）</label>
            <input type="number" step="0.01" min="0" value={form.enteredValue}
              onChange={(e) => setForm({ ...form, enteredValue: e.target.value })}
              className={inputCls} placeholder="0.25" />
          </div>
          <div>
            <label className={labelCls}>原产国 / 地区</label>
            <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={inputCls}>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gtc-gold" />
          {country.note}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>
              AD 反倾销率（%）
              {country.adcvd && <span className="text-red-400 ml-1">该国有 AD/CVD 风险</span>}
            </label>
            <input type="number" step="0.1" min="0" value={form.adRate}
              onChange={(e) => setForm({ ...form, adRate: e.target.value })}
              className={inputCls} placeholder="填入企业专属税率" />
          </div>
          <div>
            <label className={labelCls}>CVD 反补贴率（%）</label>
            <input type="number" step="0.1" min="0" value={form.cvdRate}
              onChange={(e) => setForm({ ...form, cvdRate: e.target.value })}
              className={inputCls} placeholder="填入企业专属税率" />
          </div>
          <div>
            <label className={labelCls}>项目总瓦数（可选，用于换算总额）</label>
            <input type="number" step="1000" min="0" value={form.wattage}
              onChange={(e) => setForm({ ...form, wattage: e.target.value })}
              className={inputCls} placeholder="例如 500000000（500MW）" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className={labelCls}>Section 232 计税基数</label>
            <select value={form.s232Base} onChange={(e) => setForm({ ...form, s232Base: e.target.value })} className={inputCls}>
              <option value="MIP">按 MIP 补足后价格（保守）</option>
              <option value="EV">按申报价（乐观）</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-gtc-navy cursor-pointer py-2.5">
              <input type="checkbox" checked={form.hasMipDoc}
                onChange={(e) => setForm({ ...form, hasMipDoc: e.target.checked })}
                className="w-4 h-4 accent-gtc-gold" />
              已提交合格 MIP 文件
            </label>
          </div>
          <div className="flex items-end justify-between">
            <label className="flex items-center gap-2 text-sm text-gtc-navy cursor-pointer py-2.5">
              <input type="checkbox" checked={form.isOcean}
                onChange={(e) => setForm({ ...form, isOcean: e.target.checked })}
                className="w-4 h-4 accent-gtc-gold" />
              海运（计 HMF）
            </label>
            <button onClick={reset} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gtc-navy transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />重置
            </button>
          </div>
        </div>
      </div>

      {/* 未提交文件警告 */}
      {!form.hasMipDoc && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-0.5">未提交合格 MIP 文件</p>
            <p className="opacity-90">
              将按 MIP 全额 ${fmt(calc.mip, 2)}/W 征收从量税，而非仅补差额。
              此外，认证文件若存在重大不实，进口商及其关联企业可能被永久禁止进口多晶硅及其衍生品。
            </p>
          </div>
        </div>
      )}

      {/* 结果区 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gtc-navy rounded-2xl p-5 text-white">
          <p className="text-white/60 text-xs mb-1">落地成本</p>
          <p className="text-3xl font-bold text-gtc-gold">${fmt(calc.landed)}</p>
          <p className="text-white/70 text-xs mt-1">每瓦 · Landed Cost/W</p>
          <div className="border-t border-white/15 mt-3 pt-3">
            <p className="text-white/60 text-xs">税负占申报价</p>
            <p className="text-xl font-bold">{pct(calc.ratio)}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:col-span-2">
          <p className="text-gray-500 text-xs mb-3 font-medium flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-gtc-gold" />税负拆解（$/W）
          </p>
          <div className="space-y-1.5">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="flex-1 min-w-0">
                  <span className={`text-sm ${r.danger ? 'text-red-600 font-medium' : 'text-gray-600'}`}>{r.label}</span>
                  <span className="text-xs text-gray-400 ml-2">{r.hint}</span>
                </div>
                <span className={`text-sm font-medium tabular-nums ${r.v > 0 ? (r.danger ? 'text-red-600' : 'text-gtc-navy') : 'text-gray-300'}`}>
                  {fmt(r.v)}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 mt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-gtc-navy">税负合计</span>
              <span className="text-lg font-bold text-red-600 tabular-nums">${fmt(calc.totalDuty)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gtc-navy">申报价 + 税负 = 落地成本</span>
              <span className="text-lg font-bold text-gtc-navy tabular-nums">${fmt(calc.landed)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 项目总额 */}
      {calc.projTotal && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="font-semibold text-gtc-navy text-sm mb-3 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-gtc-gold" />项目总额换算
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">税负总额</p>
              <p className="text-xl font-bold text-red-600">${(calc.projDuty / 1e6).toFixed(2)}M</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">落地总成本</p>
              <p className="text-xl font-bold text-gtc-navy">${(calc.projTotal / 1e6).toFixed(2)}M</p>
            </div>
          </div>
        </div>
      )}

      {/* 232 口径对比 */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="font-semibold text-amber-800 text-sm mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />关键不确定项：Section 232 计税基数
        </p>
        <p className="text-sm text-amber-800/90 leading-relaxed mb-3">
          白宫公告未明确 15% 从价税的计税基数是「申报价」还是「MIP 补足后价格」，须以 HTSUS 附件及 CBP 执行指引（CSMS）为准。
          两种口径的落地成本差异如下：
        </p>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <p className="text-xs text-amber-700">当前选择（{form.s232Base === 'MIP' ? '按 MIP' : '按申报价'}）</p>
            <p className="text-lg font-bold text-amber-900">${fmt(calc.landed)}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400" />
          <div>
            <p className="text-xs text-amber-700">另一口径（{form.s232Base === 'MIP' ? '按申报价' : '按 MIP'}）</p>
            <p className="text-lg font-bold text-amber-900">${fmt(calc.altLanded)}</p>
          </div>
          <div>
            <p className="text-xs text-amber-700">差额</p>
            <p className="text-lg font-bold text-amber-900">${fmt(Math.abs(calc.landed - calc.altLanded))}</p>
          </div>
        </div>
        <p className="text-xs text-amber-700 mt-2">建议：CBP 指引发布前，按保守口径（按 MIP）做预算。</p>
      </div>

      {/* 说明 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="font-semibold text-gtc-navy text-sm mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gtc-gold" />使用说明
        </p>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-gtc-gold flex-shrink-0 mt-0.5" />AD/CVD 为<strong className="mx-1">现金保证金</strong>，非最终税负，须经行政复审清算，可能补税或退税</li>
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-gtc-gold flex-shrink-0 mt-0.5" />AD/CVD 须代入<strong className="mx-1">企业专属税率</strong>（producer + exporter 组合），不可用 all-others 率替代</li>
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-gtc-gold flex-shrink-0 mt-0.5" />判定是否落入 AD/CVD 范围，关键看<strong className="mx-1">电池片原产地</strong>，而非组件组装国</li>
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-gtc-gold flex-shrink-0 mt-0.5" />Section 201 保障措施已于 2026 年 2 月 6 日到期，本测算不再计入</li>
          <li className="flex items-start gap-2"><ChevronRight className="w-4 h-4 text-gtc-gold flex-shrink-0 mt-0.5" />本测算不含海运、内陆运输、仓储、保险、清关代理、资金成本与 CBP 风险准备金</li>
        </ul>
      </div>

      {/* 引导 */}
      <div className="flex items-center justify-between bg-gradient-to-r from-gtc-navy to-gtc-navy/80 text-white rounded-2xl px-6 py-4">
        <div>
          <p className="font-semibold text-sm">需要确认您的实际税率？</p>
          <p className="text-white/60 text-xs mt-0.5">GTC 提供 HTS 归类、AD/CVD scope 分析、电池片原产地判定、MIP 合规文件包</p>
        </div>
        <a href="/cases/new" className="flex items-center gap-1.5 bg-gtc-gold text-gtc-navy px-4 py-2 rounded-xl text-sm font-bold hover:bg-gtc-gold/90 transition-colors flex-shrink-0">
          创建案件 <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* 免责声明 */}
      <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
        <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        本测算依据截至 2026 年 8 月 7 日可获取的美国政府公开信息编制，仅供成本评估参考，不构成法律意见或报关依据。
        实际税负取决于具体 HTS 编码、原产国、企业专属税率及 CBP 最终执行细则。作出报价、签约或申报决定前，应咨询持牌报关行及美国海关律师。
      </div>
    </div>
  );
}
