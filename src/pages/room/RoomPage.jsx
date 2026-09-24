// ============================================================
// 案件室（参与人看到的唯一界面）
//
//   案件头：案件名、当前阶段、最近期限倒计时（≤3 天标红）
//   待您提供：指派给本人或所有人的待提交 / 已退回任务，点开上传（多文件、拍照）
//   已提交：本人上传过的文件，按任务分组，显示上传时间与验收状态
//   联系方式：页脚 info@gtc-ai-global.com（RoomShell）
//
// 手机与微信内置浏览器是主场景：单列，390px 可用；上传逐个进行，显示进度，失败可重试。
// ============================================================
import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Clock, Download, Eye, FileText, Loader2, LogOut } from 'lucide-react';
import MultiFileUploader from '../../components/MultiFileUploader';
import { absoluteFileUrl, isViewable } from '../../utils/openSignedLink';
import { useAuth } from '../../context/AuthContext';
import { roomAPI, errorText, isWeChat } from '../../services/roomApi';
import { RoomShell } from './RoomAuth';

const DAY = 86400000;

// ---------------------------------------------------------------- 小工具
const fmtDate = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const fmtTime = (v) => {
  const d = new Date(v);
  return `${fmtDate(v)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
// 剩余天数：按自然日算（今天到期 = 0）
const daysLeft = (v) => {
  const due = new Date(v); const now = new Date();
  const a = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((a - b) / DAY);
};
const leftText = (n) => (n < 0 ? `已过期 ${-n} 天` : n === 0 ? '今天到期' : `还剩 ${n} 天`);

// 打开本人文件：微信里一律当前页跳转（新窗口常被拦）；其他浏览器查看新开一页、下载在当前页
// 链接由后端转发并带原文件名；只有 PDF / 图片提供「查看」
async function openFile(fileId, download) {
  const w = isWeChat() || download ? null : window.open('', '_blank');
  if (w) w.opener = null;
  try {
    const url = absoluteFileUrl(await roomAPI.fileLink(fileId, download));
    if (w) w.location.href = url; else window.location.href = url;
  } catch (ex) {
    if (w) w.close();
    alert(errorText(ex, '打开文件失败，请稍后重试'));
  }
}

const WeChatHint = () =>
  isWeChat() ? (
    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
      如无法下载，请点右上角 ··· 在浏览器中打开
    </p>
  ) : null;

// ---------------------------------------------------------------- 待您提供：单个任务
function TodoCard({ task, caseId, upload, onChanged }) {
  const [open, setOpen] = useState(task.status === 'returned');
  const n = task.due_at != null ? daysLeft(task.due_at) : null;
  return (
    <div className={`bg-white rounded-xl border ${task.status === 'returned' ? 'border-amber-300' : 'border-gray-200'} p-4`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full text-left">
        <div className="flex items-start gap-2">
          <FileText className="w-5 h-5 text-gtc-navy shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 break-words">{task.title}</p>
            <p className="text-xs mt-1 flex flex-wrap gap-x-3 gap-y-1">
              {task.status === 'returned' && <span className="text-amber-700 font-medium">已退回，请重新提交</span>}
              {n != null && (
                <span className={n <= 3 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                  截止 {fmtDate(task.due_at)}（{leftText(n)}）
                </span>
              )}
            </p>
          </div>
          <span className="text-xs text-gtc-navy shrink-0 mt-0.5">{open ? '收起' : '上传'}</span>
        </div>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {task.status === 'returned' && task.return_reason && (
            <div className="text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-900">
              退回原因：{task.return_reason}
            </div>
          )}
          {task.description && <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{task.description}</p>}
          {task.format_hint && <p className="text-sm text-gray-500">格式要求：{task.format_hint}</p>}
          <MultiFileUploader limits={upload} onAllDone={onChanged}
                             uploadOne={(f, p) => roomAPI.upload(caseId, task.id, f, p)} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- 已提交：一组
const STATUS_STYLE = {
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  accepted: 'bg-green-50 text-green-700 border-green-200',
  returned: 'bg-amber-50 text-amber-700 border-amber-200',
  open: 'bg-gray-50 text-gray-600 border-gray-200',
};

function SubmittedGroup({ group, caseId, upload, onChanged }) {
  const { task, files } = group;
  const [adding, setAdding] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start gap-2">
        <p className="flex-1 min-w-0 font-medium text-gray-900 break-words">{task ? task.title : '其他文件'}</p>
        {task && (
          <span className={`text-xs border rounded-full px-2 py-0.5 shrink-0 ${STATUS_STYLE[task.status] || STATUS_STYLE.open}`}>
            {task.status_label}
          </span>
        )}
      </div>
      <ul className="mt-3 divide-y divide-gray-100">
        {files.map((f) => (
          <li key={f.id} className="py-2">
            <p className="text-sm text-gray-800 break-all">{f.file_name}</p>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-xs text-gray-400 flex-1">上传于 {fmtTime(f.uploaded_at)}</span>
              {isViewable(f.file_name) && (
                <button type="button" onClick={() => openFile(f.id, false)}
                        className="text-xs text-gtc-navy flex items-center gap-1 py-1"><Eye className="w-3.5 h-3.5" />查看</button>
              )}
              <button type="button" onClick={() => openFile(f.id, true)}
                      className="text-xs text-gtc-navy flex items-center gap-1 py-1"><Download className="w-3.5 h-3.5" />下载</button>
            </div>
          </li>
        ))}
      </ul>
      {task?.status === 'submitted' && (
        <div className="mt-3">
          {adding
            ? <MultiFileUploader compact pickLabel="补充文件" limits={upload}
                                 uploadOne={(f, p) => roomAPI.upload(caseId, task.id, f, p)}
                                 onAllDone={() => { setAdding(false); onChanged(); }} />
            : <button type="button" onClick={() => setAdding(true)} className="text-sm text-gtc-navy">＋ 补充文件</button>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- 页面
export default function RoomPage() {
  const { caseId } = useParams();
  const { isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [room, setRoom] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (loading || !isAuthenticated()) return;
    roomAPI.me().then(setMe).catch((ex) => setErr(errorText(ex, '加载失败，请稍后重试')));
  }, [loading]);  // eslint-disable-line react-hooks/exhaustive-deps

  const member = me?.cases.find((c) => String(c.case_id) === String(caseId));

  const load = useCallback(() => {
    if (!caseId) return;
    roomAPI.caseRoom(caseId).then(setRoom).catch((ex) => setErr(errorText(ex, '加载失败，请稍后重试')));
  }, [caseId]);

  useEffect(() => { setRoom(null); if (member) load(); }, [member?.case_id, load]);  // eslint-disable-line react-hooks/exhaustive-deps

  // 刷新页面时用户信息要等 AuthContext 从本地恢复，恢复前不能判成未登录
  if (loading) return <RoomShell title="案件室"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></RoomShell>;
  if (!isAuthenticated()) return <Navigate to="/room-login" replace />;
  const signOut = () => { logout(); navigate('/room-login', { replace: true }); };

  if (err) return <RoomShell title="案件室"><p className="text-sm text-red-600">{err}</p></RoomShell>;
  if (!me) return <RoomShell title="案件室"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></RoomShell>;

  // /room 不带案件号：进入最近加入的案件
  if (!caseId) {
    if (me.cases.length) return <Navigate to={`/room/${me.cases[0].case_id}`} replace />;
    return (
      <RoomShell title="案件室">
        <p className="text-sm text-gray-600">当前账号未加入任何案件。如有疑问请联系 GTC。</p>
        <button onClick={signOut} className="mt-6 text-sm text-gray-500 flex items-center gap-1"><LogOut className="w-4 h-4" />退出登录</button>
      </RoomShell>
    );
  }

  if (!member) {
    return (
      <RoomShell title="无法打开该案件">
        <p className="text-sm text-gray-600">您不是该案件的成员，或已被移出。</p>
        {me.cases.length > 0 && (
          <button onClick={() => navigate(`/room/${me.cases[0].case_id}`, { replace: true })}
                  className="mt-4 text-sm text-gtc-navy underline">进入我的案件</button>
        )}
      </RoomShell>
    );
  }

  if (!room) return <RoomShell title={member.case_title}><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></RoomShell>;

  const dl = room.deadline;
  const dn = dl ? daysLeft(dl.due_at) : null;
  const others = me.cases.filter((c) => String(c.case_id) !== String(caseId));

  return (
    <RoomShell title={room.case.title} subtitle={`当前阶段：${room.case.stage}`}>
      <div className="space-y-6">
        {dl && (
          <div className={`rounded-xl px-4 py-3 border flex items-center gap-2 ${dn <= 3 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-800'}`}>
            <Clock className="w-5 h-5 shrink-0" />
            <p className="text-sm">
              <span className="font-medium">{dl.label}</span> · {leftText(dn)}
              <span className={`block text-xs ${dn <= 3 ? 'text-red-600' : 'text-gray-500'}`}>{fmtDate(dl.due_at)}</span>
            </p>
          </div>
        )}

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            待您提供 {room.todo.length > 0 && <span className="text-gtc-navy">({room.todo.length})</span>}
          </h2>
          {room.todo.length === 0
            ? <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-4">目前没有需要您提供的材料。</p>
            : <div className="space-y-3">
                {room.todo.map((t) => (
                  <TodoCard key={t.id} task={t} caseId={caseId} upload={room.upload} onChanged={load} />
                ))}
              </div>}
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">已提交</h2>
          {room.submitted.length === 0
            ? <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl px-4 py-4">您还没有提交文件。</p>
            : <div className="space-y-3">
                <WeChatHint />
                {room.submitted.map((g, i) => (
                  <SubmittedGroup key={g.task?.id ?? `other-${i}`} group={g} caseId={caseId} upload={room.upload} onChanged={load} />
                ))}
              </div>}
        </section>

        {others.length > 0 && (
          <section>
            <p className="text-xs text-gray-400 mb-2">您加入的其他案件</p>
            <div className="space-y-2">
              {others.map((c) => (
                <button key={c.case_id} onClick={() => navigate(`/room/${c.case_id}`)}
                        className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm">
                  {c.case_title}
                </button>
              ))}
            </div>
          </section>
        )}

        <button onClick={signOut} className="text-sm text-gray-500 flex items-center gap-1">
          <LogOut className="w-4 h-4" />退出登录
        </button>
      </div>
    </RoomShell>
  );
}
