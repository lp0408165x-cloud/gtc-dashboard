// ============================================================
// 案件室登录（不设密码）
//
//   /r/:token     专属链接：确认案件 → 向邀请邮箱发验证码 → 输入 → 进入案件室
//   /room-login   已加入的成员：填邮箱 → 收验证码 → 输入 → 进入案件室
//
// 手机与微信内置浏览器是主场景：单列布局，390px 宽可用，验证码框唤起数字键盘。
// ============================================================
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { roomAPI, errorText } from '../../services/roomApi';

const RESEND_SECONDS = 60;   // 与后端重发间隔一致

// ---------------------------------------------------------------- 外框
export function RoomShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-gtc-navy text-white px-5 py-4">
        <p className="text-xs text-white/60">GTC 案件室</p>
        <h1 className="text-lg font-semibold mt-0.5 break-words">{title}</h1>
        {subtitle && <p className="text-sm text-white/70 mt-1 break-words">{subtitle}</p>}
      </header>
      <main className="flex-1 w-full max-w-md mx-auto px-5 py-6">{children}</main>
      <footer className="text-center text-xs text-gray-400 py-5 px-5">
        如有疑问请联系 <a className="underline" href="mailto:info@gtc-ai-global.com">info@gtc-ai-global.com</a>
      </footer>
    </div>
  );
}

const Btn = ({ children, busy, ...p }) => (
  <button
    {...p}
    disabled={busy || p.disabled}
    className="w-full h-12 rounded-xl bg-gtc-navy text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
  >
    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
    {children}
  </button>
);

const Err = ({ text }) =>
  text ? <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{text}</p> : null;

// ---------------------------------------------------------------- 验证码输入步骤（两页共用）
function CodeStep({ emailShown, onVerify, onResend }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [left, setLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (left <= 0) return undefined;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) { setErr('请输入 6 位数字验证码'); return; }
    setBusy(true); setErr('');
    try { await onVerify(code); }
    catch (ex) { setErr(errorText(ex, '验证失败，请重试')); setBusy(false); }
  };

  const resend = async () => {
    setErr('');
    try { await onResend(); setLeft(RESEND_SECONDS); setCode(''); }
    catch (ex) { setErr(errorText(ex, '发送失败，请稍后再试')); }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-gray-600">
        验证码已发送至 <span className="font-medium text-gray-800">{emailShown}</span>，请查收邮件后填写。
      </p>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        autoFocus
        placeholder="6 位验证码"
        className="w-full h-14 text-center text-2xl tracking-[0.5em] border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gtc-gold"
      />
      <Err text={err} />
      <Btn type="submit" busy={busy}>进入案件室</Btn>
      <button
        type="button"
        onClick={resend}
        disabled={left > 0}
        className="w-full text-sm text-gtc-navy disabled:text-gray-400 py-2"
      >
        {left > 0 ? `没收到？${left} 秒后可重新发送` : '重新发送验证码'}
      </button>
      <p className="text-xs text-gray-400 leading-relaxed">
        收不到邮件时，请先查看垃圾邮件箱；仍然没有，请联系 GTC，我们可以为您提供一次性登录码。
      </p>
    </form>
  );
}

// 登录成功：存 token 与用户，进入对应案件
function useFinishLogin() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  return (data) => {
    localStorage.setItem('gtc_token', data.access_token);
    localStorage.setItem('gtc_user', JSON.stringify(data.user));
    setUser(data.user);
    navigate(`/room/${data.case_id}`, { replace: true });
  };
}

// ---------------------------------------------------------------- /r/:token
export function InviteLoginPage() {
  const { token } = useParams();
  const finish = useFinishLogin();
  const [info, setInfo] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    roomAPI.inviteInfo(token).then(setInfo).catch((ex) => setLoadErr(errorText(ex, '链接无效')));
  }, [token]);

  if (loadErr) {
    return (
      <RoomShell title="链接无法使用">
        <div className="space-y-4">
          <Err text={loadErr} />
          <Link to="/room-login" className="block text-center text-sm text-gtc-navy underline">已加入过案件？用邮箱验证码登录</Link>
        </div>
      </RoomShell>
    );
  }
  if (!info) {
    return <RoomShell title="正在打开…"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></RoomShell>;
  }

  const send = async () => {
    setBusy(true); setErr('');
    try { await roomAPI.inviteSendCode(token); setSent(true); }
    catch (ex) { setErr(errorText(ex, '发送失败，请稍后再试')); }
    finally { setBusy(false); }
  };

  return (
    <RoomShell title={info.case_title} subtitle={info.display_name ? `${info.display_name}，您好` : '您好'}>
      {!sent ? (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-gtc-gold flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 leading-relaxed">
              您受邀加入本案件，在此查看需要提供的材料并上传。为确认身份，我们会向
              <span className="font-medium"> {info.email_masked} </span>发送一个 6 位验证码。
            </p>
          </div>
          <Err text={err} />
          <Btn onClick={send} busy={busy}>发送验证码</Btn>
        </div>
      ) : (
        <div className="space-y-4">
          <CodeStep
            emailShown={info.email_masked}
            onResend={() => roomAPI.inviteSendCode(token)}
            onVerify={async (code) => finish(await roomAPI.verify(null, code, token))}
          />
        </div>
      )}
    </RoomShell>
  );
}

// ---------------------------------------------------------------- /room-login
export function RoomLoginPage() {
  const finish = useFinishLogin();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const request = async (e) => {
    e?.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setErr('请填写有效的邮箱'); return; }
    setBusy(true); setErr('');
    try { await roomAPI.requestCode(email); setSent(true); }
    catch (ex) { setErr(errorText(ex, '发送失败，请稍后再试')); }
    finally { setBusy(false); }
  };

  return (
    <RoomShell title="登录案件室" subtitle="用加入案件时的邮箱登录，无需密码">
      {!sent ? (
        <form onSubmit={request} className="space-y-4">
          <label className="block text-sm text-gray-600">
            邮箱
            <div className="mt-1 relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                className="w-full h-12 pl-9 pr-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gtc-gold"
              />
            </div>
          </label>
          <Err text={err} />
          <Btn type="submit" busy={busy}>获取验证码</Btn>
        </form>
      ) : (
        <CodeStep
          emailShown={email}
          onResend={() => roomAPI.requestCode(email)}
          onVerify={async (code) => finish(await roomAPI.verify(email, code))}
        />
      )}
      {sent && (
        <p className="text-xs text-gray-400 mt-4">
          如该邮箱已加入案件，会收到验证码邮件。也可以填写 GTC 提供的一次性登录码。
        </p>
      )}
    </RoomShell>
  );
}
