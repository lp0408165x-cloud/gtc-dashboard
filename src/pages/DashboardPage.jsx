import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { casesAPI, dashboardAPI } from '../services/api';
import { isInternal } from '../utils/roles';
import { detailText } from '../utils/apiError';
import {
  FolderOpen,
  Clock,
  CheckCircle,
  Loader2,
  FileText,
  ArrowRight,
  Sparkles,
  Mail,
  CalendarClock,
  ClipboardCheck,
  Upload,
} from 'lucide-react';

// 后端实际的案件状态
const STATUS = {
  pending:          { label: '待处理',     group: 'pending',     cls: 'bg-amber-100 text-amber-700' },
  ai_analyzing:     { label: '处理中',     group: 'in_progress', cls: 'bg-blue-100 text-blue-700' },
  ai_completed:     { label: '处理中',     group: 'in_progress', cls: 'bg-blue-100 text-blue-700' },
  needs_human:      { label: '待专家处理', group: 'in_progress', cls: 'bg-purple-100 text-purple-700' },
  human_processing: { label: '专家处理中', group: 'in_progress', cls: 'bg-purple-100 text-purple-700' },
  closed:           { label: '已结案',     group: 'closed',      cls: 'bg-green-100 text-green-700' },
};

const StatusBadge = ({ status, label }) => {
  const s = STATUS[status || 'pending'] || { label: label || status, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${s.cls}`}>{label || s.label}</span>;
};

const LEVEL_CLS = {
  overdue: 'bg-red-600 text-white',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  normal: 'bg-gray-100 text-gray-600',
};

const daysText = (d) => (d.level === 'overdue' ? '已逾期' : d.days_left === 0 ? '今天到期' : `还剩 ${d.days_left} 天`);
const fmtDateTime = (v) => (v ? new Date(v).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '');
const caseLabel = (title, id) => `${title} (#${id})`;

const Card = ({ icon: Icon, title, count, children, empty }) => (
  <div className="bg-white rounded-xl shadow-sm">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
      <Icon className="w-5 h-5 text-gtc-navy" />
      <h2 className="text-lg font-display font-bold text-gtc-navy">{title}</h2>
      {count != null && <span className="ml-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{count}</span>}
    </div>
    {count === 0 ? <p className="px-6 py-8 text-center text-sm text-gray-400">{empty}</p> : children}
  </div>
);

const StatGrid = ({ items }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {items.map((s) => (
      <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-xl ${s.bg}`}><s.icon className={`w-5 h-5 ${s.fg}`} /></div>
        <div>
          <p className="text-2xl font-bold text-gtc-navy">{s.value}</p>
          <p className="text-gray-500 text-sm">{s.label}</p>
        </div>
      </div>
    ))}
  </div>
);

const statItems = (c) => [
  { label: '总案件数', value: c.total, icon: FolderOpen, bg: 'bg-blue-50', fg: 'text-blue-500' },
  { label: '待处理', value: c.pending, icon: Clock, bg: 'bg-amber-50', fg: 'text-amber-500' },
  { label: '处理中', value: c.in_progress, icon: Loader2, bg: 'bg-purple-50', fg: 'text-purple-500' },
  { label: '已结案', value: c.closed, icon: CheckCircle, bg: 'bg-green-50', fg: 'text-green-500' },
];

const RecentCases = ({ cases, internal }) => (
  <div className="bg-white rounded-xl shadow-sm">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <h2 className="text-lg font-display font-bold text-gtc-navy">最近案件</h2>
      <Link to="/cases" className="text-gtc-accent text-sm font-medium hover:underline flex items-center gap-1">
        查看全部 <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
    {cases.length > 0 ? (
      <div className="divide-y divide-gray-100">
        {cases.map((c) => (
          <Link key={c.id} to={`/cases/${c.id}`} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 bg-gtc-light rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-gtc-navy" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gtc-navy truncate">{caseLabel(c.title, c.id)}</p>
                <p className="text-sm text-gray-500 truncate">
                  {internal && c.company ? `${c.company} · ` : ''}{new Date(c.created_at).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
            <StatusBadge status={c.status} label={c.status_label} />
          </Link>
        ))}
      </div>
    ) : (
      <div className="p-12 text-center">
        <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">暂无案件记录</p>
        <Link to="/cases/new" className="inline-flex items-center gap-2 text-gtc-accent font-medium hover:underline">
          创建第一个案件 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------- 内部角色：办案优先

const InternalDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardAPI.work().then(setData).catch((e) => setError(detailText(e?.response?.data?.detail, '控制台数据加载失败，请刷新重试')));
  }, []);

  if (error) return <div className="bg-red-50 text-red-700 rounded-xl p-6">{error}</div>;
  if (!data) return <Spinner />;

  const { deadlines, review_queue: queue, recent_uploads: uploads, windows } = data;
  return (
    <div className="space-y-6 animate-fade-in">
      <Card icon={CalendarClock} title="近期期限" count={deadlines.length}
            empty={`已逾期及 ${windows.deadline_days} 天内没有未处理的期限`}>
        <div className="divide-y divide-gray-100">
          {deadlines.map((d) => (
            <Link key={d.id} to={`/cases/${d.case_id}?tab=room`}
                  className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-gray-50">
              <div className="min-w-0">
                <p className="font-medium text-gtc-navy truncate">{d.label}<span className="ml-2 text-xs text-gray-400">{d.authority_label}</span></p>
                <p className="text-sm text-gray-500 truncate">{caseLabel(d.case_title, d.case_id)} · 截止 {d.due_date_et}（美东）</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${LEVEL_CLS[d.level] || LEVEL_CLS.normal}`}>
                {daysText(d)}
              </span>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card icon={ClipboardCheck} title="待验收任务" count={queue.length} empty="没有待验收的任务">
          <div className="divide-y divide-gray-100">
            {queue.map((t) => (
              <Link key={t.task_id} to={`/cases/${t.case_id}?tab=room`} className="px-6 py-3 block hover:bg-gray-50">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-gtc-navy truncate">{t.title}</p>
                  <span className={`text-xs whitespace-nowrap ${t.waiting_days >= 3 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {t.waiting_days ? `已等 ${t.waiting_days} 天` : '今天提交'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {caseLabel(t.case_title, t.case_id)} · {t.submitted_by.join('、') || '—'} · {t.file_count} 个文件
                </p>
              </Link>
            ))}
          </div>
        </Card>

        <Card icon={Upload} title="最近上传" count={uploads.length}
              empty={`最近 ${windows.upload_days} 天没有新上传的文件`}>
          <div className="divide-y divide-gray-100">
            {uploads.map((f) => (
              <Link key={f.file_id} to={`/cases/${f.case_id}?tab=${f.source === 'case' ? 'files' : 'room'}`}
                    className="px-6 py-3 block hover:bg-gray-50">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-gtc-navy truncate">{f.file_name}</p>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(f.created_at)}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {caseLabel(f.case_title, f.case_id)} · {f.source_label}{f.uploaded_by ? ` · ${f.uploaded_by}` : ''}
                </p>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <RecentCases cases={data.recent_cases} internal />
      <StatGrid items={statItems(data.status_counts)} />
    </div>
  );
};

// ---------------------------------------------------------------- 客户

const ClientDashboard = ({ user }) => {
  const [cases, setCases] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    casesAPI.list().then(setCases).catch((e) => setError(detailText(e?.response?.data?.detail, '案件加载失败，请刷新重试')));
  }, []);

  if (error) return <div className="bg-red-50 text-red-700 rounded-xl p-6">{error}</div>;
  if (!cases) return <Spinner />;

  const count = (g) => cases.filter((c) => (STATUS[c.status || 'pending'] || {}).group === g).length;
  const counts = { total: cases.length, pending: count('pending'), in_progress: count('in_progress'), closed: count('closed') };
  const recent = cases.slice(0, 5).map((c) => ({
    id: c.id, title: c.case_title || `案件 #${c.id}`, status: c.status, created_at: c.created_at,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-gtc-navy to-gtc-blue rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-display font-bold mb-2">欢迎回来，{user?.full_name}！</h1>
        <p className="text-gray-300 mb-6">您有 {counts.pending} 个待处理案件</p>
        <Link to="/cases/new"
              className="inline-flex items-center gap-2 bg-gtc-gold text-gtc-navy px-6 py-3 rounded-xl font-medium hover:bg-amber-400 transition-colors">
          <Sparkles className="w-5 h-5" /> 新建案件
        </Link>
      </div>

      <StatGrid items={statItems(counts)} />
      <RecentCases cases={recent} />

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-display font-bold text-gtc-navy mb-4">联系专家团队</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gtc-gold/10 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-gtc-gold" />
          </div>
          <div>
            <p className="text-sm text-gray-500">联系邮箱</p>
            <a href="mailto:info@gtc-ai-global.com" className="font-medium text-gtc-navy hover:underline">info@gtc-ai-global.com</a>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">案件相关沟通请在案件室内进行</p>
      </div>
    </div>
  );
};

const Spinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-gtc-gold/30 border-t-gtc-gold rounded-full animate-spin"></div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  return isInternal(user) ? <InternalDashboard /> : <ClientDashboard user={user} />;
};

export default DashboardPage;
