import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscriptionAPI, paymentAPI } from '../services/api';
import {
  CreditCard,
  Crown,
  Zap,
  Building2,
  Check,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  BarChart3,
  FileText,
  HardDrive,
  Users,
  Brain,
} from 'lucide-react';

const PLAN_CONFIG = {
  basic: {
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
    btnOutline: 'border-blue-300 text-blue-600 hover:bg-blue-50',
    label: '基础版',
    desc: '适合个人用户和小型企业',
  },
  pro: {
    icon: Crown,
    color: 'text-gtc-gold',
    bgColor: 'bg-amber-50',
    borderColor: 'border-gtc-gold/40',
    btnBg: 'bg-gtc-gold hover:bg-yellow-600 text-gtc-navy',
    btnOutline: 'border-gtc-gold/40 text-gtc-gold hover:bg-amber-50',
    label: '专业版',
    desc: '适合专业合规团队',
    popular: true,
  },
  professional: {
    icon: Crown,
    color: 'text-gtc-gold',
    bgColor: 'bg-amber-50',
    borderColor: 'border-gtc-gold/40',
    btnBg: 'bg-gtc-gold hover:bg-yellow-600 text-gtc-navy',
    btnOutline: 'border-gtc-gold/40 text-gtc-gold hover:bg-amber-50',
    label: '专业版',
    desc: '适合专业合规团队',
    popular: true,
  },
  enterprise: {
    icon: Building2,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
    btnOutline: 'border-purple-300 text-purple-600 hover:bg-purple-50',
    label: '企业版',
    desc: '适合大型企业和集团',
  },
};

function toYuan(price) {
  if (!price && price !== 0) return 0;
  return price > 10000 ? Math.round(price / 100) : price;
}

function formatStorage(mb) {
  if (!mb || mb === -1) return '无限存储';
  if (mb >= 1024) return `${Math.round(mb / 1024)} GB 存储`;
  return `${mb} MB 存储`;
}

const SubscriptionPage = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentSub, setCurrentSub] = useState(null);
  const [usage, setUsage] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('plans');
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, subRes, usageRes] = await Promise.allSettled([
        subscriptionAPI.getPlans(),
        subscriptionAPI.getCurrent(),
        subscriptionAPI.getUsage(),
      ]);
      if (plansRes.status === 'fulfilled') setPlans(plansRes.value.plans || plansRes.value || []);
      if (subRes.status === 'fulfilled') setCurrentSub(subRes.value.subscription || subRes.value);
      if (usageRes.status === 'fulfilled') setUsage(usageRes.value);
      try {
        const historyRes = await paymentAPI.getHistory();
        setPaymentHistory(historyRes.payments || historyRes || []);
      } catch (e) {}
    } catch (err) {
      setError('加载数据失败，请刷新重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planKey) => {
    setActionLoading(true);
    try {
      const result = await subscriptionAPI.create(planKey, 'bank_transfer', billingPeriod);
      alert(`订阅成功！${result.message || '请按指引完成支付。'}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || '订阅失败，请重试');
    } finally { setActionLoading(false); }
  };

  const handleUpgrade = async (newPlan) => {
    if (!confirm(`确认升级到${PLAN_CONFIG[newPlan]?.label || newPlan}？`)) return;
    setActionLoading(true);
    try { await subscriptionAPI.upgrade(newPlan); alert('升级成功！'); loadData(); }
    catch (err) { alert(err.response?.data?.detail || '升级失败，请重试'); }
    finally { setActionLoading(false); }
  };

  const handleCancel = async () => {
    if (!confirm('确认取消订阅？取消后当前周期内仍可使用。')) return;
    setActionLoading(true);
    try { await subscriptionAPI.cancel(); alert('已取消订阅'); loadData(); }
    catch (err) { alert(err.response?.data?.detail || '取消失败'); }
    finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-gtc-gold animate-spin" />
        <span className="ml-3 text-gray-500">加载中...</span>
      </div>
    );
  }

  const currentPlan = currentSub?.plan || 'free';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gtc-navy">订阅管理</h1>
          <p className="text-gray-500 mt-1">管理您的订阅套餐和用量</p>
        </div>
        {currentSub && currentPlan !== 'free' && (
          <div className={`px-4 py-2 rounded-lg ${PLAN_CONFIG[currentPlan]?.bgColor || 'bg-gray-100'} border ${PLAN_CONFIG[currentPlan]?.borderColor || 'border-gray-200'}`}>
            <span className={`font-medium ${PLAN_CONFIG[currentPlan]?.color || 'text-gray-600'}`}>
              当前：{PLAN_CONFIG[currentPlan]?.label || '免费版'}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'plans', label: '套餐方案', icon: CreditCard },
          { key: 'usage', label: '用量统计', icon: BarChart3 },
          { key: 'billing', label: '账单记录', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-gtc-gold text-gtc-navy shadow-sm'
                : 'text-gray-500 hover:text-gtc-navy hover:bg-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'plans' && (
        <PlansTab plans={plans} currentPlan={currentPlan} currentSub={currentSub}
          billingPeriod={billingPeriod} setBillingPeriod={setBillingPeriod}
          onSubscribe={handleSubscribe} onUpgrade={handleUpgrade} onCancel={handleCancel} actionLoading={actionLoading} />
      )}
      {activeTab === 'usage' && <UsageTab usage={usage} currentPlan={currentPlan} />}
      {activeTab === 'billing' && <BillingTab payments={paymentHistory} />}
    </div>
  );
};

// ============================================================
// Plans Tab
// ============================================================
const PlansTab = ({ plans, currentPlan, currentSub, billingPeriod, setBillingPeriod, onSubscribe, onUpgrade, onCancel, actionLoading }) => {
  const dbPlanNames = plans.map((p) => p.plan);
  const proPlanKey = dbPlanNames.includes('pro') ? 'pro' : 'professional';
  const planOrder = ['basic', proPlanKey, 'enterprise'];

  const sortedPlans = plans.length > 0
    ? planOrder.map((key) => plans.find((p) => p.plan === key)).filter(Boolean)
    : planOrder.map((key) => ({
        plan: key,
        price_monthly: key === 'basic' ? 299 : key === proPlanKey ? 799 : 1999,
        price_yearly: key === 'basic' ? 2990 : key === proPlanKey ? 7990 : 19990,
        max_cases_monthly: key === 'basic' ? 10 : key === proPlanKey ? 50 : -1,
        max_ai_analyses_monthly: key === 'basic' ? 20 : key === proPlanKey ? 200 : -1,
        max_storage_mb: key === 'basic' ? 1024 : key === proPlanKey ? 10240 : 102400,
        max_users: key === 'basic' ? 2 : key === proPlanKey ? 10 : -1,
        features: key === 'basic'
          ? { basic_analysis: true, risk_scan: true }
          : key === proPlanKey
          ? { basic_analysis: true, risk_scan: true, petition_gen: true, supply_chain: true, resources: true }
          : { basic_analysis: true, risk_scan: true, petition_gen: true, supply_chain: true, resources: true, priority_support: true, custom_api: true },
      }));

  const currentPlanIndex = planOrder.indexOf(currentPlan);

  return (
    <div className="space-y-6">
      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-gtc-navy font-medium' : 'text-gray-400'}`}>月付</span>
        <button
          onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
          className={`relative w-14 h-7 rounded-full transition-colors ${billingPeriod === 'yearly' ? 'bg-gtc-gold' : 'bg-gray-300'}`}
        >
          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${billingPeriod === 'yearly' ? 'translate-x-8' : 'translate-x-1'}`} />
        </button>
        <span className={`text-sm ${billingPeriod === 'yearly' ? 'text-gtc-navy font-medium' : 'text-gray-400'}`}>年付</span>
        {billingPeriod === 'yearly' && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">省 17%</span>
        )}
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sortedPlans.map((plan) => {
          const config = PLAN_CONFIG[plan.plan] || {};
          const Icon = config.icon || Zap;
          const isCurrentPlan = plan.plan === currentPlan;
          const planIndex = planOrder.indexOf(plan.plan);
          const isUpgrade = planIndex > currentPlanIndex && currentPlan !== 'free';
          const isDowngrade = planIndex < currentPlanIndex;

          const monthlyYuan = toYuan(plan.price_monthly || 0);
          const yearlyYuan = toYuan(plan.price_yearly || (plan.price_monthly || 0) * 10);
          const price = billingPeriod === 'yearly' ? Math.round(yearlyYuan / 12) : monthlyYuan;

          return (
            <div
              key={plan.plan}
              className={`relative bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-lg ${
                config.popular
                  ? `${config.borderColor} shadow-md`
                  : isCurrentPlan
                  ? 'border-green-300 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {config.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gtc-gold text-gtc-navy text-xs font-bold rounded-full shadow">
                  推荐
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow">
                  当前方案
                </div>
              )}

              {/* Plan Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${config.bgColor}`}>
                  <Icon className={`w-6 h-6 ${config.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gtc-navy">{config.label || plan.display_name || plan.plan}</h3>
                  <p className="text-xs text-gray-500">{config.desc}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gtc-navy">¥{price}</span>
                  <span className="text-gray-400 text-sm">/月</span>
                </div>
                {billingPeriod === 'yearly' && (
                  <p className="text-xs text-gray-400 mt-1">年付 ¥{yearlyYuan}/年</p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                <FeatureItem icon={FileText} label={`每月 ${plan.max_cases_monthly === -1 ? '无限' : plan.max_cases_monthly} 个案件`} />
                <FeatureItem icon={Brain} label={`每月 ${plan.max_ai_analyses_monthly === -1 ? '无限' : plan.max_ai_analyses_monthly} 次 AI 分析`} />
                <FeatureItem icon={HardDrive} label={formatStorage(plan.max_storage_mb)} />
                <FeatureItem icon={Users} label={`${plan.max_users === -1 ? '无限' : plan.max_users} 个用户`} />
                {plan.features?.petition_gen && <FeatureItem icon={Check} label="申诉书生成" highlight />}
                {plan.features?.supply_chain && <FeatureItem icon={Check} label="供应链审查" highlight />}
                {plan.features?.resources && <FeatureItem icon={Check} label="专业资料库" highlight />}
                {plan.features?.priority_support && <FeatureItem icon={Check} label="优先技术支持" highlight />}
                {plan.features?.custom_api && <FeatureItem icon={Check} label="API 接入" highlight />}
              </ul>

              {/* Action Button */}
              {isCurrentPlan ? (
                <button onClick={() => onCancel()} disabled={actionLoading}
                  className="w-full py-3 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 transition-all text-sm font-medium">
                  取消订阅
                </button>
              ) : isDowngrade ? (
                <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 cursor-not-allowed text-sm">
                  不支持降级
                </button>
              ) : (
                <button
                  onClick={() => (isUpgrade ? onUpgrade(plan.plan) : onSubscribe(plan.plan))}
                  disabled={actionLoading}
                  className={`w-full py-3 rounded-xl font-medium transition-all text-sm ${config.btnBg} disabled:opacity-50`}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : isUpgrade ? (
                    <span className="flex items-center justify-center gap-1">升级 <ArrowUpRight className="w-4 h-4" /></span>
                  ) : '立即订阅'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Methods */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="text-gtc-navy font-medium mb-3">支付方式</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-lg font-bold">支</div>
            <div><p className="text-gtc-navy text-sm font-medium">支付宝</p><p className="text-gray-400 text-xs">即将支持</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-lg font-bold">微</div>
            <div><p className="text-gtc-navy text-sm font-medium">微信支付</p><p className="text-gray-400 text-xs">即将支持</p></div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><Building2 className="w-5 h-5 text-gtc-gold" /></div>
            <div><p className="text-gtc-navy text-sm font-medium">对公转账</p><p className="text-green-600 text-xs font-medium">已支持</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon: Icon, label, highlight }) => (
  <li className="flex items-center gap-2.5">
    <Icon className={`w-4 h-4 flex-shrink-0 ${highlight ? 'text-green-500' : 'text-gray-400'}`} />
    <span className={`text-sm ${highlight ? 'text-green-700 font-medium' : 'text-gray-600'}`}>{label}</span>
  </li>
);

// ============================================================
// Usage Tab
// ============================================================
const UsageTab = ({ usage, currentPlan }) => {
  const usageItems = usage ? [
    { label: '本月案件数', used: usage.cases_used || 0, limit: usage.cases_limit || 0, icon: FileText },
    { label: 'AI 分析次数', used: usage.ai_used || 0, limit: usage.ai_limit || 0, icon: Brain },
    { label: '存储空间 (MB)', used: usage.storage_used_mb || 0, limit: usage.storage_limit_mb || 0, icon: HardDrive },
    { label: '团队成员', used: usage.users_count || 1, limit: usage.users_limit || 1, icon: Users },
  ] : [];

  return (
    <div className="space-y-6">
      {!usage ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无用量数据</p>
          <p className="text-gray-400 text-sm mt-1">订阅套餐后即可查看用量统计</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {usageItems.map((item) => {
            const pct = item.limit === -1 ? 0 : item.limit > 0 ? Math.round((item.used / item.limit) * 100) : 0;
            const over = item.limit !== -1 && pct >= 90;
            return (
              <div key={item.label} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-gray-400" />
                    <span className="text-gtc-navy font-medium">{item.label}</span>
                  </div>
                  <span className={`text-sm font-mono ${over ? 'text-red-500' : 'text-gray-500'}`}>
                    {item.used} / {item.limit === -1 ? '∞' : item.limit}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-gtc-gold'}`}
                    style={{ width: item.limit === -1 ? '5%' : `${Math.min(pct, 100)}%` }}
                  />
                </div>
                {item.limit === -1 && <p className="text-xs text-gray-400 mt-2">无限制</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Billing Tab
// ============================================================
const BillingTab = ({ payments }) => {
  const statusMap = {
    paid: { label: '已支付', color: 'text-green-700 bg-green-100' },
    pending: { label: '待支付', color: 'text-yellow-700 bg-yellow-100' },
    failed: { label: '失败', color: 'text-red-700 bg-red-100' },
    refunded: { label: '已退款', color: 'text-gray-600 bg-gray-100' },
  };

  return (
    <div className="space-y-4">
      {payments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无账单记录</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-gray-500 text-sm font-medium p-4">交易号</th>
                <th className="text-left text-gray-500 text-sm font-medium p-4">金额</th>
                <th className="text-left text-gray-500 text-sm font-medium p-4">方式</th>
                <th className="text-left text-gray-500 text-sm font-medium p-4">状态</th>
                <th className="text-left text-gray-500 text-sm font-medium p-4">时间</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const status = statusMap[payment.status] || statusMap.pending;
                return (
                  <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4 text-gray-600 text-sm font-mono">{payment.trade_no?.slice(0, 16) || '-'}</td>
                    <td className="p-4 text-gtc-navy font-medium">¥{toYuan(payment.amount)}</td>
                    <td className="p-4 text-gray-500 text-sm">{payment.payment_method || '-'}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span></td>
                    <td className="p-4 text-gray-500 text-sm">{payment.created_at ? new Date(payment.created_at).toLocaleDateString('zh-CN') : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;
