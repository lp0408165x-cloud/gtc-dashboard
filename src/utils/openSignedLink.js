// ============================================================
// 打开存储桶里的文件
//
// case-files 桶是私有的，链接由后端现签、几分钟内有效，所以不能提前放在 <a href> 里：
// 点击时先向后端要链接再打开。窗口要在点击的同步阶段先开出来，
// 等拿到链接再跳转，否则浏览器会把异步之后的 window.open 当弹窗拦掉。
// ============================================================
import api from '../services/api';

export async function openSignedLink(apiPath) {
  const w = window.open('', '_blank');
  if (w) w.opener = null;
  try {
    const { data } = await api.get(apiPath);
    if (w) w.location.href = data.url;
    else window.location.href = data.url;
  } catch (e) {
    if (w) w.close();
    const detail = e.response?.data?.detail;
    alert(typeof detail === 'string' ? detail : '打开文件失败，请稍后重试');
  }
}
