// ============================================================
// 案件详情 · 「案件室」标签（仅内部角色）
//
//   成员：列表、邀请（弹窗填邮箱 / 身份 / 称呼 → 复制链接）、移出、生成一次性登录码（邮件收不到时用）
//   任务：按状态分组；新建、编辑、上下移动排序、取消 / 恢复
//   批量建任务：每行「标题 | 说明 | 格式要求 | 截止日」，先预览再确认（也认 Markdown 表格）
//   验收：待验收的任务「接受」或「退回」（必填原因）；退回后成员端显示在「待您提供」
//   文件：任务下的文件直接查看 / 下载；「下载本案全部文件」打包 zip（按任务分文件夹，文件名前缀上传时间）
// ============================================================
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowUp, Check, ClipboardList, Copy, Download, Eye, FileText, KeyRound, ListPlus, Loader2,
  Pencil, Plus, RotateCcw, Undo2, UserMinus, UserPlus, Users, X, XCircle,
} from 'lucide-react';
import { caseRoomStaffAPI as api, dateToDue, dueToDate, blobErrorText } from '../../services/caseRoomStaffApi';
import { detailText } from '../../utils/apiError';
import { openSignedLink, isViewable } from '../../utils/openSignedLink';
import { fmtSize } from '../MultiFileUploader';

const ROLES = [
  ['client', '客户'], ['forwarder', '货代'], ['broker', '报关行'], ['factory', '工厂'], ['other', '其他'],
];
const ROLE_LABEL = Object.fromEntries(ROLES);
const GROUPS = [
  ['submitted', '待验收'], ['returned', '已退回'], ['open', '待提交'], ['accepted', '已接受'], ['cancelled', '已取消'],
];
const errText = (e, fb) => detailText(e?.response?.data?.detail, fb);
const fmtDay = (v) => (v ? dueToDate(v) : '');
const fmtWhen = (v) => (v ? new Date(v).toLocaleString('zh-CN', { hour12: false }).replace(/:\d{2}$/, '') : '');

// ---------------------------------------------------------------- 通用
function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-xl w-full ${wide ? 'max-w-3xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function CopyBox({ text }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }
    catch { window.prompt('请手动复制：', text); }
  };
  return (
    <div className="flex gap-2">
      <input readOnly value={text} className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 font-mono"
             onFocus={(e) => e.target.select()} />
      <button onClick={copy} className="shrink-0 px-3 py-2 text-sm rounded-lg bg-gtc-navy text-white inline-flex items-center gap-1">
        {done ? <><Check className="w-4 h-4" />已复制</> : <><Copy className="w-4 h-4" />复制</>}
      </button>
    </div>
  );
}

const Btn = ({ children, variant = 'ghost', ...p }) => {
  const cls = {
    primary: 'bg-gtc-navy text-white hover:bg-[#152d54]',
    ghost: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    ok: 'bg-green-600 text-white hover:bg-green-700',
  }[variant];
  return (
    <button {...p} className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg disabled:opacity-50 ${cls} ${p.className || ''}`}>
      {children}
    </button>
  );
};

// ---------------------------------------------------------------- 成员
function InviteModal({ caseId, onClose, onDone }) {
  const [form, setForm] = useState({ email: '', member_role: 'client', display_name: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const r = await api.invite(caseId, { ...form, display_name: form.display_name.trim() || null });
      setLink(r.link); onDone();
    } catch (ex) { setErr(errText(ex, '生成邀请失败')); }
    finally { setBusy(false); }
  };
  return (
    <Modal title="邀请成员" onClose={onClose}>
      {link ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">专属链接已生成。复制后通过微信或邮件发给对方：</p>
          <CopyBox text={link} />
          <p className="text-xs text-gray-400">链接 30 天内有效，只能使用一次；对方打开后用邮箱验证码进入，无需密码。</p>
          <div className="text-right"><Btn variant="primary" onClick={onClose}>完成</Btn></div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm text-gray-600">邮箱
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value.trim() })}
                   className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </label>
          <label className="block text-sm text-gray-600">身份
            <select value={form.member_role} onChange={(e) => setForm({ ...form, member_role: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg">
              {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="block text-sm text-gray-600">称呼（选填，对方页面上会显示）
            <input value={form.display_name} maxLength={100} onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                   placeholder="如：张经理" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </label>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-2">
            <Btn type="button" onClick={onClose}>取消</Btn>
            <Btn variant="primary" type="submit" disabled={busy}>{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}生成链接</Btn>
          </div>
        </form>
      )}
    </Modal>
  );
}

function MembersSection({ caseId, members, showRevoked, setShowRevoked, reload }) {
  const [inviting, setInviting] = useState(false);
  const [code, setCode] = useState(null);

  const revoke = async (m) => {
    if (!window.confirm(`移出 ${m.display_name || m.email}？移出后对方无法再进入本案件室，已上传的文件保留。`)) return;
    try { await api.revoke(caseId, m.id); reload(); } catch (ex) { alert(errText(ex, '移出失败')); }
  };
  const issue = async (m) => {
    if (!window.confirm(`为 ${m.display_name || m.email} 生成一次性登录码？\n用于对方收不到验证码邮件的情况，10 分钟内有效，只能用一次，会记入操作日志。`)) return;
    try { setCode({ member: m, ...(await api.loginCode(caseId, m.id)) }); } catch (ex) { alert(errText(ex, '生成失败')); }
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Users className="w-4 h-4" />成员（{members.filter((m) => !m.revoked_at).length}）</h3>
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-500 flex items-center gap-1">
            <input type="checkbox" checked={showRevoked} onChange={(e) => setShowRevoked(e.target.checked)} />显示已移出
          </label>
          <Btn variant="primary" onClick={() => setInviting(true)}><UserPlus className="w-3.5 h-3.5" />邀请成员</Btn>
        </div>
      </div>
      {members.length === 0 ? (
        <p className="px-4 py-6 text-sm text-gray-400 text-center">还没有成员。点「邀请成员」生成专属链接发给客户、货代、报关行或工厂。</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {members.map((m) => (
            <li key={m.id} className={`px-4 py-3 flex items-center gap-3 ${m.revoked_at ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  {m.display_name || '—'} <span className="text-gray-400">&lt;{m.email}&gt;</span>
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{ROLE_LABEL[m.member_role] || m.member_role}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  加入于 {fmtWhen(m.created_at)}{m.revoked_at && ` · 已于 ${fmtWhen(m.revoked_at)} 移出`}
                </p>
              </div>
              {!m.revoked_at && (
                <>
                  <Btn onClick={() => issue(m)} title="邮件收不到时使用"><KeyRound className="w-3.5 h-3.5" />登录码</Btn>
                  <Btn variant="danger" onClick={() => revoke(m)}><UserMinus className="w-3.5 h-3.5" />移出</Btn>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {inviting && <InviteModal caseId={caseId} onClose={() => setInviting(false)} onDone={reload} />}
      {code && (
        <Modal title="一次性登录码" onClose={() => setCode(null)}>
          <div className="space-y-3 text-sm text-gray-700">
            <p>发给 {code.member.display_name || code.email}（{code.email}）：</p>
            <p className="text-3xl font-mono tracking-[0.4em] text-center text-gtc-navy py-2">{code.code}</p>
            <p className="text-xs text-gray-500">
              对方在登录页填邮箱后直接输入此码。有效至 {fmtWhen(code.expires_at)}，只能使用一次；关闭本窗口后无法再查看。
            </p>
            <div className="text-right"><Btn variant="primary" onClick={() => setCode(null)}>关闭</Btn></div>
          </div>
        </Modal>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- 任务表单
function TaskModal({ caseId, members, task, onClose, onDone }) {
  const [form, setForm] = useState({
    title: task?.title || '', description: task?.description || '', format_hint: task?.format_hint || '',
    assignee_member_id: task?.assignee_member_id ?? '', due: fmtDay(task?.due_at),
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setErr('请填写标题'); return; }
    const body = {
      title: form.title.trim(), description: form.description.trim() || null, format_hint: form.format_hint.trim() || null,
      assignee_member_id: form.assignee_member_id === '' ? null : Number(form.assignee_member_id), due_at: dateToDue(form.due),
    };
    setBusy(true); setErr('');
    try {
      if (task) await api.updateTask(caseId, task.id, body); else await api.createTask(caseId, body);
      onDone(); onClose();
    } catch (ex) { setErr(errText(ex, '保存失败')); }
    finally { setBusy(false); }
  };
  const active = members.filter((m) => !m.revoked_at);
  return (
    <Modal title={task ? '编辑任务' : '新建任务'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm text-gray-600">标题
          <input value={form.title} maxLength={200} onChange={set('title')} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </label>
        <label className="block text-sm text-gray-600">说明
          <textarea rows={3} value={form.description} onChange={set('description')} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </label>
        <label className="block text-sm text-gray-600">格式要求
          <input value={form.format_hint} maxLength={200} onChange={set('format_hint')} placeholder="如：PDF，盖章扫描件"
                 className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-gray-600">交给
            <select value={form.assignee_member_id} onChange={set('assignee_member_id')} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">所有成员</option>
              {active.map((m) => <option key={m.id} value={m.id}>{m.display_name || m.email}（{ROLE_LABEL[m.member_role]}）</option>)}
            </select>
          </label>
          <label className="block text-sm text-gray-600">截止日（选填）
            <input type="date" value={form.due} onChange={set('due')} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </label>
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2">
          <Btn type="button" onClick={onClose}>取消</Btn>
          <Btn variant="primary" type="submit" disabled={busy}>{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}保存</Btn>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------- 批量建任务
function BulkModal({ caseId, members, onClose, onDone }) {
  const [text, setText] = useState('');
  const [assignee, setAssignee] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = async (confirm) => {
    setBusy(true); setErr('');
    try {
      const r = await api.bulk(caseId, text, confirm, assignee === '' ? null : Number(assignee));
      if (confirm) { onDone(); onClose(); } else setPreview(r);
    } catch (ex) { setErr(errText(ex, confirm ? '创建失败' : '预览失败')); }
    finally { setBusy(false); }
  };
  return (
    <Modal title="批量建任务" onClose={onClose} wide>
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          每行一项：<span className="font-mono text-gtc-navy">标题 | 说明 | 格式要求 | 截止日</span>，后三项可空。
          截止日写 2026-10-15 或 10/15。也可以直接粘贴表格（含表头行）。
        </p>
        <textarea rows={8} value={text} onChange={(e) => { setText(e.target.value); setPreview(null); }}
                  placeholder={'生产记录 | 2025 年 3–5 月工单、领料单 | PDF，盖章 | 2026-10-15\n银行付款回单 | 对应采购合同 | PDF 或图片 | 10/20\n营业执照'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm" />
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">交给
            <select value={assignee} onChange={(e) => { setAssignee(e.target.value); setPreview(null); }}
                    className="ml-2 px-2 py-1.5 border border-gray-300 rounded-lg text-sm">
              <option value="">所有成员</option>
              {members.filter((m) => !m.revoked_at).map((m) => <option key={m.id} value={m.id}>{m.display_name || m.email}</option>)}
            </select>
          </label>
          <Btn onClick={() => run(false)} disabled={busy || !text.trim()} className="ml-auto">
            {busy && !preview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}预览
          </Btn>
        </div>
        {err && <p className="text-sm text-red-600">{err}</p>}
        {preview && (
          <div className="space-y-2">
            <p className="text-sm">
              可创建 <b className="text-green-700">{preview.valid}</b> 项
              {preview.errors > 0 && <>，<b className="text-red-600">{preview.errors}</b> 行需要修改</>}
            </p>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr><th className="px-2 py-1.5 text-left">行</th><th className="px-2 py-1.5 text-left">标题</th><th className="px-2 py-1.5 text-left">说明</th><th className="px-2 py-1.5 text-left">格式要求</th><th className="px-2 py-1.5 text-left">截止日</th></tr>
                </thead>
                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.line} className={`border-t border-gray-100 ${r.error ? 'bg-red-50' : ''}`}>
                      <td className="px-2 py-1.5 text-gray-400">{r.line}</td>
                      {r.error
                        ? <td colSpan={4} className="px-2 py-1.5 text-red-600">{r.error}<span className="block text-xs text-gray-400 font-mono">{r.raw}</span></td>
                        : <>
                            <td className="px-2 py-1.5">{r.title}</td>
                            <td className="px-2 py-1.5 text-gray-600">{r.description || '—'}</td>
                            <td className="px-2 py-1.5 text-gray-600">{r.format_hint || '—'}</td>
                            <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap">{r.due_date || '—'}</td>
                          </>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Btn onClick={onClose}>取消</Btn>
          <Btn variant="primary" onClick={() => run(true)} disabled={busy || !preview || preview.errors > 0 || preview.valid === 0}>
            确认创建 {preview?.valid || ''} 项
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------- 任务卡片
function TaskCard({ caseId, task, memberName, canUp, canDown, onMove, onEdit, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [returning, setReturning] = useState(false);
  const [reason, setReason] = useState('');
  const act = async (fn, fb) => {
    setBusy(true);
    try { await fn(); onChanged(); return true; } catch (ex) { alert(errText(ex, fb)); return false; } finally { setBusy(false); }
  };
  const doReturn = () => {
    if (!reason.trim()) { alert('请填写退回原因'); return; }
    act(() => api.returnTask(caseId, task.id, reason.trim()), '退回失败').then((ok) => { if (ok) { setReturning(false); setReason(''); } });
  };
  const cancelled = task.status === 'cancelled';
  return (
    <div className={`border rounded-lg p-3 ${cancelled ? 'border-gray-200 bg-gray-50 opacity-70' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start gap-2">
        <FileText className="w-4 h-4 text-gtc-navy mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium text-gray-800 break-words ${cancelled ? 'line-through' : ''}`}>{task.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-3">
            <span>交给：{memberName(task.assignee_member_id)}</span>
            {task.due_at && <span>截止 {fmtDay(task.due_at)}</span>}
            {task.format_hint && <span>格式：{task.format_hint}</span>}
          </p>
          {task.description && <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap break-words">{task.description}</p>}
          {task.status === 'returned' && task.return_reason && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1">退回原因：{task.return_reason}</p>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button disabled={!canUp || busy} onClick={() => onMove(-1)} title="上移" className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
          <button disabled={!canDown || busy} onClick={() => onMove(1)} title="下移" className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
        </div>
      </div>

      {task.files.length > 0 && (
        <ul className="mt-2 ml-6 divide-y divide-gray-100 border-t border-gray-100">
          {task.files.map((f) => (
            <li key={f.id} className="py-1.5 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-800 break-all">{f.file_name}</p>
                <p className="text-[11px] text-gray-400">{fmtSize(f.file_size)} · {fmtWhen(f.uploaded_at)}{f.uploaded_by && ` · ${f.uploaded_by}`}</p>
              </div>
              {isViewable(f.file_name) && (
                <button onClick={() => openSignedLink(`/cases/${caseId}/files/${f.id}/link`)} className="text-xs text-blue-600 inline-flex items-center gap-0.5"><Eye className="w-3.5 h-3.5" />查看</button>
              )}
              <button onClick={() => openSignedLink(`/cases/${caseId}/files/${f.id}/link?download=true`)} className="text-xs text-blue-600 inline-flex items-center gap-0.5"><Download className="w-3.5 h-3.5" />下载</button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 ml-6 flex flex-wrap gap-2">
        {task.status === 'submitted' && !returning && (
          <>
            <Btn variant="ok" disabled={busy} onClick={() => act(() => api.accept(caseId, task.id), '接受失败')}><Check className="w-3.5 h-3.5" />接受</Btn>
            <Btn variant="danger" disabled={busy} onClick={() => setReturning(true)}><Undo2 className="w-3.5 h-3.5" />退回</Btn>
          </>
        )}
        {!cancelled && task.status !== 'accepted' && (
          <Btn disabled={busy} onClick={onEdit}><Pencil className="w-3.5 h-3.5" />编辑</Btn>
        )}
        {!cancelled && task.status !== 'accepted' && (
          <Btn disabled={busy} onClick={() => window.confirm(`取消任务「${task.title}」？成员端将不再显示，已上传的文件保留。`)
            && act(() => api.updateTask(caseId, task.id, { status: 'cancelled' }), '取消失败')}>
            <XCircle className="w-3.5 h-3.5" />取消任务
          </Btn>
        )}
        {cancelled && (
          <Btn disabled={busy} onClick={() => act(() => api.updateTask(caseId, task.id, { status: 'open' }), '恢复失败')}>
            <RotateCcw className="w-3.5 h-3.5" />恢复
          </Btn>
        )}
      </div>
      {returning && (
        <div className="mt-2 ml-6 space-y-2">
          <textarea rows={2} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} autoFocus
                    placeholder="退回原因（成员会看到），如：第 3 页盖章不清晰，请重新扫描"
                    className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg" />
          <div className="flex gap-2">
            <Btn variant="danger" disabled={busy} onClick={doReturn}>确认退回</Btn>
            <Btn onClick={() => { setReturning(false); setReason(''); }}>取消</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- 标签页
export default function CaseRoomTab({ caseId }) {
  const [members, setMembers] = useState([]);
  const [showRevoked, setShowRevoked] = useState(false);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null);      // null | 'new' | task
  const [bulk, setBulk] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  const loadMembers = useCallback(() => {
    api.members(caseId, showRevoked).then(setMembers).catch((ex) => setErr(errText(ex, '加载成员失败')));
  }, [caseId, showRevoked]);
  const loadTasks = useCallback(() => {
    api.tasks(caseId).then(setData).catch((ex) => setErr(errText(ex, '加载任务失败')));
  }, [caseId]);
  useEffect(() => { loadMembers(); }, [loadMembers]);
  useEffect(() => { loadTasks(); }, [loadTasks]);

  const memberName = useMemo(() => {
    const map = Object.fromEntries(members.map((m) => [m.id, m.display_name || m.email]));
    return (id) => (id == null ? '所有成员' : map[id] || `成员 #${id}`);
  }, [members]);

  const tasks = data?.tasks || [];
  const grouped = GROUPS.map(([s, label]) => [s, label, tasks.filter((t) => t.status === s)]);

  // 上下移动：只在同一分组里和相邻任务交换，其余任务顺序不变
  const move = async (group, idx, dir) => {
    const a = group[idx]; const b = group[idx + dir];
    if (!a || !b) return;
    const order = tasks.map((t) => t.id);
    const ia = order.indexOf(a.id); const ib = order.indexOf(b.id);
    [order[ia], order[ib]] = [order[ib], order[ia]];
    try { await api.reorder(caseId, order); loadTasks(); } catch (ex) { alert(errText(ex, '排序失败')); }
  };

  const downloadZip = async () => {
    setZipping(true);
    try {
      const { blob, name } = await api.zip(caseId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (ex) { alert(await blobErrorText(ex, '打包下载失败，请稍后重试')); }
    finally { setZipping(false); }
  };

  if (err) return <p className="text-sm text-red-600">{err}</p>;

  return (
    <div className="space-y-5">
      <MembersSection caseId={caseId} members={members} showRevoked={showRevoked} setShowRevoked={setShowRevoked} reload={loadMembers} />

      <section className="bg-white rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2 mr-auto"><ClipboardList className="w-4 h-4" />任务</h3>
          <Btn variant="primary" onClick={() => setEditing('new')}><Plus className="w-3.5 h-3.5" />新建任务</Btn>
          <Btn onClick={() => setBulk(true)}><ListPlus className="w-3.5 h-3.5" />批量建任务</Btn>
          <Btn onClick={downloadZip} disabled={zipping}>
            {zipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}下载本案全部文件
          </Btn>
        </div>
        {!data ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
        ) : tasks.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">还没有任务。新建或批量导入后，成员会在案件室的「待您提供」里看到。</p>
        ) : (
          <div className="p-4 space-y-5">
            {grouped.map(([s, label, list]) => {
              if (list.length === 0) return null;
              if (s === 'cancelled' && !showCancelled) {
                return (
                  <button key={s} onClick={() => setShowCancelled(true)} className="text-xs text-gray-500">
                    显示已取消的任务（{list.length}）
                  </button>
                );
              }
              return (
                <div key={s}>
                  <p className={`text-sm font-medium mb-2 ${s === 'submitted' ? 'text-blue-700' : s === 'returned' ? 'text-amber-700' : 'text-gray-600'}`}>
                    {label}（{list.length}）
                  </p>
                  <div className="space-y-2">
                    {list.map((t, i) => (
                      <TaskCard key={t.id} caseId={caseId} task={t} memberName={memberName}
                                canUp={i > 0} canDown={i < list.length - 1} onMove={(d) => move(list, i, d)}
                                onEdit={() => setEditing(t)} onChanged={loadTasks} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {editing && (
        <TaskModal caseId={caseId} members={members} task={editing === 'new' ? null : editing}
                   onClose={() => setEditing(null)} onDone={loadTasks} />
      )}
      {bulk && <BulkModal caseId={caseId} members={members} onClose={() => setBulk(false)} onDone={loadTasks} />}
    </div>
  );
}
