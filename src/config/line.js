// ============================================================
// 线路配置（单一真源）
//
// 所有 API / WebSocket 地址都从这里取，不要在别处再写域名。
// 切换方式：
//   1. localStorage 的 gtc_line：'cn' = 中国线路，其余/缺省 = 默认线路
//   2. URL 参数 ?line=cn —— 写入 localStorage 后重载（带参链接可直接发给客户）
//
// API_BASE 只在模块加载时求值一次，所以切换线路后必须 reload 才生效。
// ============================================================

const DEFAULT_API_BASE =
  import.meta.env.VITE_API_URL || 'https://api.gtc-ai-global.com';

// 香港 VPS 上的 nginx 反代，回源到 api.gtc-ai-global.com
const CN_API_BASE = 'https://cn.gtc-ai-global.com';

export const LINE_KEY = 'gtc_line';

export const LINES = [
  { id: 'default', label: '默认' },
  { id: 'cn', label: '中国加速' },
];

// 归一化：只认 'cn'，其余一律当默认
const normalize = (v) => (v === 'cn' ? 'cn' : 'default');

// 读当前线路。localStorage 在隐私模式下可能抛错，兜底回默认。
export function getLine() {
  try {
    return normalize(localStorage.getItem(LINE_KEY));
  } catch {
    return 'default';
  }
}

// 写线路。返回 true 表示值确实变了（调用方需要 reload），false 表示没变。
export function setLine(line) {
  const next = normalize(line);
  if (getLine() === next) return false;
  try {
    if (next === 'default') localStorage.removeItem(LINE_KEY);
    else localStorage.setItem(LINE_KEY, next);
    return true;
  } catch {
    return false;
  }
}

// 处理 ?line=cn：写入 localStorage，并把该参数从地址栏抹掉。
// 线路真的变了就 replace 重载（模块要重新求值 API_BASE）；没变就只清地址栏。
// 重载后 URL 已无 line 参数，不会二次触发，也就不会循环。
export function bootstrapLineFromURL() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('line')) return;

    const changed = setLine(url.searchParams.get('line'));
    url.searchParams.delete('line');

    if (changed) window.location.replace(url.toString());
    else window.history.replaceState({}, '', url.toString());
  } catch {
    // URL 解析失败就当没带参数，不影响正常启动
  }
}

// 当前线路的 HTTP base，不带尾斜杠
export const API_BASE = getLine() === 'cn' ? CN_API_BASE : DEFAULT_API_BASE;

// 当前线路的 WebSocket base
export const WS_BASE = API_BASE.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
