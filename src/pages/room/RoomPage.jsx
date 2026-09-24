// ============================================================
// 案件室（1b 临时落地页）
//
// 1b 只负责「登录后到得了这里、且只看得到自己的案件」。
// 待您提供 / 已提交 / 上传等完整页面在 1c 替换本文件。
// ============================================================
import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { roomAPI, errorText } from '../../services/roomApi';
import { RoomShell } from './RoomAuth';

export default function RoomPage() {
  const { caseId } = useParams();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) return;
    roomAPI.me().then(setMe).catch((ex) => setErr(errorText(ex, '加载失败，请稍后重试')));
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

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

  const current = me.cases.find((c) => String(c.case_id) === String(caseId));
  if (!current) {
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

  return (
    <RoomShell title={current.case_title} subtitle={current.display_name || me.user.email}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-700 leading-relaxed">
        您已登录。案件室页面正在完善，如需提交材料，请发送至
        <a className="underline ml-1" href="mailto:info@gtc-ai-global.com">info@gtc-ai-global.com</a>。
      </div>
      {me.cases.length > 1 && (
        <div className="mt-6">
          <p className="text-xs text-gray-400 mb-2">您加入的其他案件</p>
          <div className="space-y-2">
            {me.cases.filter((c) => c !== current).map((c) => (
              <button key={c.case_id} onClick={() => navigate(`/room/${c.case_id}`)}
                      className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm">
                {c.case_title}
              </button>
            ))}
          </div>
        </div>
      )}
      <button onClick={signOut} className="mt-8 text-sm text-gray-500 flex items-center gap-1">
        <LogOut className="w-4 h-4" />退出登录
      </button>
    </RoomShell>
  );
}
