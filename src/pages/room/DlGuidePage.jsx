// ============================================================
// 微信下载引导页 /room/dl-guide?u=<本站 /api/v1/dl/ 相对路径>
//
//   微信里：只提示「点右上角 ··· 选择在浏览器打开，即可下载」和文件名，不跳转
//   其他浏览器：自动跳到 u 开始下载（不需要登录，链接本身就是授权）
//   u 不合法：提示链接无效，不跳转（见 utils/dlGuide.isSafeDlPath）
// ============================================================
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, FileText, MoreHorizontal } from 'lucide-react';
import { RoomShell } from './RoomAuth';
import { dlTarget, fileNameFromDlPath, isSafeDlPath, isWeChat } from '../../utils/dlGuide';
import { getLine } from '../../config/line';

export default function DlGuidePage() {
  const [params] = useSearchParams();
  const u = params.get('u') || '';
  const safe = isSafeDlPath(u);
  const wechat = isWeChat();
  const name = useMemo(() => (safe ? fileNameFromDlPath(u) : ''), [safe, u]);

  useEffect(() => {
    if (safe && !wechat) window.location.replace(dlTarget(u));
  }, [safe, wechat, u]);

  // 中国线路：启动时 bootstrapLineFromURL 会把 ?line=cn 从地址栏抹掉；
  // 微信「在浏览器打开」用的是地址栏里的地址，所以这里补回去，外部浏览器也继续走香港中转
  useEffect(() => {
    if (!safe || getLine() !== 'cn') return;
    const url = new URL(window.location.href);
    if (url.searchParams.get('line') !== 'cn') {
      url.searchParams.set('line', 'cn');
      window.history.replaceState({}, '', url.toString());
    }
  }, [safe]);

  if (!safe) {
    return (
      <RoomShell title="下载文件">
        <p className="text-sm text-gray-600">链接无效，请返回案件室重新点击「下载」。</p>
      </RoomShell>
    );
  }

  return (
    <RoomShell title="下载文件">
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
          <FileText className="w-5 h-5 text-gtc-navy shrink-0 mt-0.5" />
          <p className="text-sm text-gray-800 break-all">{name}</p>
        </div>
        {wechat ? (
          <p className="text-base text-gray-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 flex items-start gap-2">
            <MoreHorizontal className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            点右上角 ··· 选择在浏览器打开，即可下载
          </p>
        ) : (
          <div className="text-sm text-gray-600 space-y-2">
            <p>正在开始下载……</p>
            <a href={dlTarget(u)} className="inline-flex items-center gap-1 text-gtc-navy underline">
              <Download className="w-4 h-4" />如果没有开始，点这里下载
            </a>
          </div>
        )}
      </div>
    </RoomShell>
  );
}
