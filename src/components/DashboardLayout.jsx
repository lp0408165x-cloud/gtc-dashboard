import { useState, useRef, useEffect } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { Bell, Search, Settings, LogOut, ChevronDown } from 'lucide-react';
import AIChatWidget from './AIChatWidget';

const DashboardLayout = () => {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const userMenuRef = useRef(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gtc-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gtc-gold/30 border-t-gtc-gold rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gtc-light flex">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索案件、文件..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-lg focus:bg-white focus:border-gtc-gold focus:ring-1 focus:ring-gtc-gold transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* 铃铛按钮 */}
            <div className="relative">
              <button
                onClick={() => setShowNotification(!showNotification)}
                className="relative p-2 text-gray-500 hover:text-gtc-navy hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              {showNotification && (
                <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-lg border border-gray-100 z-50 p-4">
                  <p className="text-sm font-medium text-gtc-navy mb-2">通知</p>
                  <p className="text-sm text-gray-400 text-center py-4">暂无新通知</p>
                </div>
              )}
            </div>

            {/* 用户头像下拉菜单 */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 pl-4 border-l border-gray-200 hover:opacity-80 transition-opacity"
              >
                <div className="w-9 h-9 bg-gtc-gold rounded-full flex items-center justify-center text-gtc-navy font-medium">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gtc-navy">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.role || '用户'}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-2">
                  <button
                    onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    个人设置
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
      <AIChatWidget />
    </div>
  );
};

export default DashboardLayout;
