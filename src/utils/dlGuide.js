// ============================================================
// 微信下载引导（/room/dl-guide?u=…）
//
// 微信内置浏览器下载不了 Word / Excel / ZIP 等文件：点「下载」时不直接跳 /dl，而是跳到引导页，
// 提示「点右上角 ··· 选择在浏览器打开」。在外部浏览器打开引导页后自动跳到 u 开始下载。
// 这类链接由后端按 guide=true 签发，有效期 10 分钟（其余 300 秒）。
//
// u 只接受本站 /api/v1/dl/ 的相对路径（后端 storage_links.signed_url 的格式），
// 由引导页拼上当前线路的 API 地址——不接受任何完整 URL，防止被当作开放跳转。
// ============================================================
import { API_BASE, getLine } from '../config/line';

// /api/v1/dl/<payload>.<sig>/<百分号编码的文件名>；token 是 base64url，文件名段不含 / ? # \
const DL_PATH = /^\/api\/v1\/dl\/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\/[^/?#\\]*$/;

export function isSafeDlPath(u) {
  if (typeof u !== 'string' || !DL_PATH.test(u)) return false;
  const last = u.slice(u.lastIndexOf('/') + 1);
  return last !== '.' && last !== '..';               // 防止浏览器把 /x/.. 规范化到别的路径
}

export function fileNameFromDlPath(u) {
  try {
    return decodeURIComponent(u.slice(u.lastIndexOf('/') + 1)) || '文件';
  } catch {
    return '文件';
  }
}

// 引导页地址：保留当前线路（中国线路在外部浏览器里也继续走香港中转）
export function guidePageUrl(dlPath) {
  const q = new URLSearchParams({ u: dlPath });
  if (getLine() === 'cn') q.set('line', 'cn');
  return `/room/dl-guide?${q.toString()}`;
}

export const dlTarget = (dlPath) => `${API_BASE}${dlPath}`;

export const isWeChat = () => /MicroMessenger/i.test((typeof navigator !== 'undefined' && navigator.userAgent) || '');
