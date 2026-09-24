// ============================================================
// 网页标题（微信内置浏览器的顶栏显示的就是它）
//
//   案件室（/r/…、/room…、/room-login）：GTC 案件室
//   其余页面：GTC 平台
//
// index.html 里有一段同样规则的内联脚本，保证首次打开链接时标题就对，
// 不先闪一下默认标题。两处规则要一起改。标题里不出现 AI。
// ============================================================
export const ROOM_TITLE = 'GTC 案件室';
export const APP_TITLE = 'GTC 平台';

export const isRoomPath = (pathname) => /^\/(r|room)(\/|$)|^\/room-login(\/|$)/.test(pathname || '');

export const titleFor = (pathname) => (isRoomPath(pathname) ? ROOM_TITLE : APP_TITLE);
