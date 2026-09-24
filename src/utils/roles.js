// ============================================================
// 角色判断（单一真源）
//
// user.role 是后端 /auth/me 返回的角色名：
//   super_admin / admin / expert / analyst / client
//
// 「内部角色」与后端 services/tenant_scope.py 的判断保持一致。
// 未知或缺失的角色一律按客户处理：宁可错藏，不可错放。
//
// 注意：浏览器里缓存的 gtc_user 是登录时存下的。后端开始返回 role
// 之前登录的账号，要退出重登一次才有 role 字段。
// ============================================================

export const INTERNAL_ROLES = ['super_admin', 'admin', 'expert'];

export const isInternal = (user) => INTERNAL_ROLES.includes(user?.role);

// 案件参与人：只能进案件室（/room），不进后台
export const isParticipant = (user) => user?.role === 'participant';
