import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import {
  Shield, LayoutDashboard, FolderOpen, FilePlus, BarChart3,
  Settings, LogOut, Users, ChevronLeft, ChevronRight, Package,
  CreditCard, BookOpen, GraduationCap, Calculator,
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNavItems = [
    // ── 所有用户可见 ──
    { path: '/dashboard',           icon: LayoutDashboard, label: '控制台',    adminOnly: false },
    { path: '/cases',               icon: FolderOpen,      label: '案件管理',  adminOnly: false },
    { path: '/cases/new',           icon: FilePlus,        label: '新建案件',  adminOnly: false },
    { path: '/supply-chain-review', icon: Package,         label: '供应链审查',adminOnly: false },
    { path: '/supplier-scan',       icon: ShieldAlert,     label: '供应商扫描',adminOnly: false },
    { path: '/tariff-calculator',   icon: Calculator,      label: '关税计算器',adminOnly: false },
    { path: '/analytics',           icon: BarChart3,       label: '数据分析',  adminOnly: false },
    { path: '/resources',           icon: BookOpen,        label: '资料库',    adminOnly: false },
    { path: '/subscription',        icon: CreditCard,      label: '订阅管理',  adminOnly: false },
    { path: '/training',            icon: GraduationCap,   label: '培训中心',  adminOnly: false, end: true },
    // ── 仅管理员可见 ──
    { path: '/training/admin',      icon: GraduationCap,   label: '培训管理',  adminOnly: true },
    { path: '/users',               icon: Users,           label: '用户管理',  adminOnly: true },
    { path: '/settings',            icon: Settings,        label: '设置',      adminOnly: false },
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className={`bg-gtc-navy h-screen sticky top-0 transition-all duration-300 flex flex-col ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className="p-6 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-gtc-gold flex-shrink-0" />
          {!collapsed && <span className="text-xl font-display font-bold text-white">GTC-AI</span>}
        </div>
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-white transition-colors">
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/cases' || item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive ? 'bg-gtc-gold text-gtc-navy font-medium' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-white/10">
        {!collapsed && user && (
          <div className="mb-4 px-3">
            <p className="text-white font-medium truncate">{user.full_name}</p>
            <p className="text-gray-400 text-sm truncate">{user.email}</p>
            {isAdmin && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-gtc-gold/20 text-gtc-gold text-xs rounded-full">管理员</span>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-gray-300 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>退出登录</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
