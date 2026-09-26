// ============================================================
// 案件室 · 期限（1e，仅内部角色）
//
//   未关闭的期限按截止时间排在上面：剩余天数与等级由后端按美东日期计算
//   新建 / 编辑：名称、机关、截止日期（美东当天 23:59:59）、备注
//   延期：填新的截止日期（必须晚于原期限），原期限标「已延期」，新建一条关联到原期限
//   关闭：已完成 / 已错过 / 已取消（取消必须写原因）；关闭后不再出现在提醒里
//   已关闭的期限默认收起
// ============================================================
import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, CalendarPlus, CheckCircle2, Loader2, Pencil, Plus, X } from 'lucide-react';
import { caseRoomStaffAPI as api } from '../../services/caseRoomStaffApi';
import { detailText } from '../../utils/apiError';

const AUTHORITIES = [['CBP', 'CBP'], ['EPA', 'EPA'], ['FDA', 'FDA'], ['other', '其他']];
const LABEL_HINTS = ['CBP 截止日期', 'CF-28 回复', 'CF-29 回复', 'EAPA 书面答辩', 'Protest 截止', 'Prior Disclosure 提交'];
const CLOSE_OPTIONS = [['met', '已完成'], ['missed', '已错过'], ['cancelled', '已取消']];
const LEVEL_CLS = {
  overdue: 'bg-red-600 text-white',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-amber-100 text-amber-700',
  normal: 'bg-gray-100 text-gray-600',
};
const CLOSED_CLS = {
  met: 'bg-green-100 text-green-700', missed: 'bg-red-100 text-red-700',
  extended: 'bg-blue-100 text-blue-700', cancelled: 'bg-gray-100 text-gray-500',
};

const errText = (e, fb) => detailText(e?.response?.data?.detail, fb);
const daysText = (d) => (d.level === 'overdue' ? '已逾期' : d.days_left === 0 ? '今天到期' : `还剩 ${d.days_left} 天`);
const fmtWhen = (v) => (v ? new Date(v).toLocaleString('zh-CN', { hour12: false }).replace(/:\d{2}$/, '') : '');
const input = 'mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg';

const Btn = ({ children, variant = 'ghost', ...p }) => {
  const cls = {
    primary: 'bg-gtc-navy text-white hover:bg-[#152d54]',
    ghost: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  }[variant];
  return (
    <button {...p} className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg disabled:opacity-50 ${cls} ${p.className || ''}`}>
      {children}
    </button>
  );
};

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="关闭"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Footer({ busy, err, onClose, submitText = '保存' }) {
  return (
    <>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex justify-end gap-2">
        <Btn type="button" onClick={onClose}>取消</Btn>
        <Btn variant="primary" type="submit" disabled={busy}>{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{submitText}</Btn>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- 新建 / 编辑
function DeadlineModal({ caseId, deadline, onClose, onDone }) {
  const [form, setForm] = useState({
    label: deadline?.label || '', authority: deadline?.authority || 'CBP',
    due_date: deadline?.due_date_et || '', notes: deadline?.notes || '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.label.trim()) { setErr('请填写期限名称'); return; }
    if (!form.due_date) { setErr('请选择截止日期'); return; }
    let body;
    if (deadline) {
      // 只提交改过的字段：截止日期没改就不传，免得把带具体时刻的期限改成当天 23:59:59
      body = {};
      if (form.label.trim() !== deadline.label) body.label = form.label.trim();
      if (form.authority !== deadline.authority) body.authority = form.authority;
      if ((form.notes.trim() || null) !== (deadline.notes || null)) body.notes = form.notes.trim() || null;
      if (form.due_date !== deadline.due_date_et) body.due_date = form.due_date;
      if (Object.keys(body).length === 0) { onClose(); return; }
    } else {
      body = { label: form.label.trim(), authority: form.authority, due_date: form.due_date, notes: form.notes.trim() || null };
    }
    setBusy(true); setErr('');
    try {
      if (deadline) await api.updateDeadline(caseId, deadline.id, body); else await api.createDeadline(caseId, body);
      onDone(); onClose();
    } catch (ex) { setErr(errText(ex, '保存失败')); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={deadline ? '编辑期限' : '新建期限'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm text-gray-600">期限名称
          <input value={form.label} maxLength={200} onChange={set('label')} list="deadline-label-hints"
                 placeholder="如：CF-28 回复" className={input} />
          <datalist id="deadline-label-hints">{LABEL_HINTS.map((h) => <option key={h} value={h} />)}</datalist>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-gray-600">机关
            <select value={form.authority} onChange={set('authority')} className={input}>
              {AUTHORITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="block text-sm text-gray-600">截止日期（美东）
            <input type="date" value={form.due_date} onChange={set('due_date')} className={input} />
          </label>
        </div>
        <label className="block text-sm text-gray-600">备注（选填）
          <textarea rows={2} value={form.notes} onChange={set('notes')} className={input} />
        </label>
        <p className="text-xs text-gray-400">截止时间按美东当天 23:59:59 计。</p>
        <Footer busy={busy} err={err} onClose={onClose} />
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------- 延期
function ExtendModal({ caseId, deadline, onClose, onDone }) {
  const [due, setDue] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (!due) { setErr('请选择新的截止日期'); return; }
    if (due <= deadline.due_date_et) { setErr('新的截止日期必须晚于原截止日期'); return; }
    setBusy(true); setErr('');
    try { await api.extendDeadline(caseId, deadline.id, due, note.trim()); onDone(); onClose(); }
    catch (ex) { setErr(errText(ex, '延期失败')); }
    finally { setBusy(false); }
  };
  return (
    <Modal title={`延期：${deadline.label}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-gray-600">原截止日期：{deadline.due_date_et}（美东）</p>
        <label className="block text-sm text-gray-600">新的截止日期（美东）
          <input type="date" value={due} min={deadline.due_date_et} onChange={(e) => setDue(e.target.value)} className={input} />
        </label>
        <label className="block text-sm text-gray-600">说明（选填，如 CBP 批准延期的依据）
          <textarea rows={2} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} className={input} />
        </label>
        <p className="text-xs text-gray-400">原期限将标为「已延期」，并新建一条期限关联到原期限。</p>
        <Footer busy={busy} err={err} onClose={onClose} submitText="确认延期" />
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------- 关闭
function CloseModal({ caseId, deadline, onClose, onDone }) {
  const [status, setStatus] = useState('met');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (status === 'cancelled' && !note.trim()) { setErr('取消期限必须填写原因'); return; }
    setBusy(true); setErr('');
    try { await api.closeDeadline(caseId, deadline.id, status, note.trim()); onDone(); onClose(); }
    catch (ex) { setErr(errText(ex, '关闭失败')); }
    finally { setBusy(false); }
  };
  return (
    <Modal title={`关闭：${deadline.label}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-4">
          {CLOSE_OPTIONS.map(([v, l]) => (
            <label key={v} className="inline-flex items-center gap-1.5 text-sm text-gray-700">
              <input type="radio" name="close-status" value={v} checked={status === v} onChange={() => setStatus(v)} />{l}
            </label>
          ))}
        </div>
        <label className="block text-sm text-gray-600">{status === 'cancelled' ? '取消原因（必填）' : '说明（选填）'}
          <textarea rows={2} value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} className={input} />
        </label>
        <p className="text-xs text-gray-400">关闭后不再出现在控制台和案件室顶部的提醒里，也不能再修改。</p>
        <Footer busy={busy} err={err} onClose={onClose} submitText="确认关闭" />
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------- 列表
export default function DeadlinesSection({ caseId }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [modal, setModal] = useState(null);          // {kind: 'new' | 'edit' | 'extend' | 'close', deadline}

  const load = useCallback(() => {
    api.deadlines(caseId).then(setRows).catch((ex) => setErr(errText(ex, '加载期限失败')));
  }, [caseId]);
  useEffect(() => { load(); }, [load]);

  const open = (rows || []).filter((d) => d.status === 'open');
  const closed = (rows || []).filter((d) => d.status !== 'open');
  const byId = Object.fromEntries((rows || []).map((d) => [d.id, d]));
  const props = { caseId, onClose: () => setModal(null), onDone: load, deadline: modal?.deadline };

  return (
    <section className="bg-white rounded-xl border border-gray-200">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2 mr-auto">
          <CalendarClock className="w-4 h-4" />期限（{open.length}）
        </h3>
        <Btn variant="primary" onClick={() => setModal({ kind: 'new' })}><Plus className="w-3.5 h-3.5" />新建期限</Btn>
      </div>

      {err ? <p className="px-4 py-4 text-sm text-red-600">{err}</p>
        : !rows ? <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
        : (
          <div className="p-4 space-y-3">
            {open.length === 0 && <p className="text-sm text-gray-400 text-center py-2">没有未关闭的期限。</p>}
            {open.map((d) => (
              <div key={d.id} className="border border-gray-200 rounded-lg px-3 py-2.5 flex flex-wrap items-center gap-3">
                <div className="min-w-0 mr-auto">
                  <p className="font-medium text-gray-800">
                    {d.label}<span className="ml-2 text-xs text-gray-400">{d.authority_label}</span>
                    {d.extended_from_id && byId[d.extended_from_id] && (
                      <span className="ml-2 text-xs text-blue-600">由 {byId[d.extended_from_id].due_date_et} 延期</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">截止 {d.due_date_et}（美东）{d.notes ? ` · ${d.notes}` : ''}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${LEVEL_CLS[d.level] || LEVEL_CLS.normal}`}>
                  {daysText(d)}
                </span>
                <div className="flex gap-1.5">
                  <Btn onClick={() => setModal({ kind: 'edit', deadline: d })}><Pencil className="w-3.5 h-3.5" />编辑</Btn>
                  <Btn onClick={() => setModal({ kind: 'extend', deadline: d })}><CalendarPlus className="w-3.5 h-3.5" />延期</Btn>
                  <Btn onClick={() => setModal({ kind: 'close', deadline: d })}><CheckCircle2 className="w-3.5 h-3.5" />关闭</Btn>
                </div>
              </div>
            ))}

            {closed.length > 0 && (
              showClosed ? (
                <div className="pt-2 space-y-2">
                  <button onClick={() => setShowClosed(false)} className="text-xs text-gray-500">收起已关闭的期限</button>
                  {closed.map((d) => (
                    <div key={d.id} className="bg-gray-50 rounded-lg px-3 py-2 flex flex-wrap items-center gap-3 text-sm">
                      <div className="min-w-0 mr-auto">
                        <p className="text-gray-700">{d.label}<span className="ml-2 text-xs text-gray-400">截止 {d.due_date_et}</span></p>
                        <p className="text-xs text-gray-500">
                          {fmtWhen(d.closed_at)} 关闭{d.close_note ? ` · ${d.close_note}` : ''}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${CLOSED_CLS[d.status] || CLOSED_CLS.cancelled}`}>{d.status_label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <button onClick={() => setShowClosed(true)} className="text-xs text-gray-500">显示已关闭的期限（{closed.length}）</button>
              )
            )}
          </div>
        )}

      {modal?.kind === 'new' && <DeadlineModal {...props} deadline={null} />}
      {modal?.kind === 'edit' && <DeadlineModal {...props} />}
      {modal?.kind === 'extend' && <ExtendModal {...props} />}
      {modal?.kind === 'close' && <CloseModal {...props} />}
    </section>
  );
}
