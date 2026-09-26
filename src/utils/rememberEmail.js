// 登录页记住邮箱：登录成功后存，下次打开自动填好。
// localStorage 在隐私模式、被禁用时可能抛错：读不到就留空，写不进就算了，不影响登录。
export const ROOM_EMAIL_KEY = 'gtc_room_email';     // 案件室（验证码登录）
export const ADMIN_EMAIL_KEY = 'gtc_login_email';   // 后台（密码登录）

export function loadEmail(key) {
  try { return localStorage.getItem(key) || ''; } catch { return ''; }
}

export function saveEmail(key, email) {
  try { if (email) localStorage.setItem(key, String(email).trim().toLowerCase()); } catch { /* 忽略 */ }
}
