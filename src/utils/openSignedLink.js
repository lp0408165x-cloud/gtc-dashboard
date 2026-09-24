// ============================================================
// 打开存储桶里的文件
//
// 链接由后端现签、几分钟内有效（/api/v1/dl/…，后端转发并带原文件名），所以不能提前放在 <a href> 里：
// 点击时先向后端要链接再打开。
//   查看（仅 PDF / 图片）：窗口要在点击的同步阶段先开出来，拿到链接再跳转，否则会被当弹窗拦掉
//   下载：附件响应不会让当前页离开，直接在当前页打开，避免留下一个空白标签页
// ============================================================
import api from '../services/api';
import { API_BASE } from '../config/line';

// 后端返回以 / 开头的相对路径：拼上当前线路的 API 地址（中国线路经香港中转）
export const absoluteFileUrl = (url) => (url && url.startsWith('/') ? `${API_BASE}${url}` : url);

// 浏览器能直接打开的格式；其余（Word / Excel / ZIP 等）只提供下载。与后端 storage_links.VIEWABLE 一致
const VIEWABLE = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'];
export const isViewable = (name) => {
  const i = (name || '').lastIndexOf('.');
  return i > 0 && VIEWABLE.includes(name.slice(i + 1).toLowerCase());
};

export async function openSignedLink(apiPath) {
  const download = /[?&]download=true\b/.test(apiPath);
  const w = download ? null : window.open('', '_blank');
  if (w) w.opener = null;
  try {
    const { data } = await api.get(apiPath);
    const url = absoluteFileUrl(data.url);
    if (w) w.location.href = url;
    else window.location.href = url;
  } catch (e) {
    if (w) w.close();
    const detail = e.response?.data?.detail;
    alert(typeof detail === 'string' ? detail : '打开文件失败，请稍后重试');
  }
}
