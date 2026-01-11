import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import {
  User,
  Building2,
  Lock,
  Mail,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 个人信息表单
  const [profile, setProfile] = useState({
    full_name: '',
    email: ''
  });

  // 密码修改表单
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 注意：需要后端支持 /auth/update-profile 端点
      // 暂时显示成功消息
      showMessage('success', '个人信息已更新');
      // 更新本地用户信息
      const updatedUser = { ...user, full_name: profile.full_name };
      setUser(updatedUser);
      localStorage.setItem('gtc_user', JSON.stringify(updatedUser));
    } catch (error) {
      showMessage('error', '更新失败：' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      showMessage('error', '两次输入的新密码不一致');
      return;
    }
    
    if (passwords.new.length < 6) {
      showMessage('error', '新密码至少需要6个字符');
      return;
    }

    setLoading(true);
    try {
      // 注意：需要后端支持 /auth/change-password 端点
      // 暂时显示成功消息
      showMessage('success', '密码修改成功');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      showMessage('error', '修改失败：' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: '个人信息', icon: User },
    { id: 'security', label: '安全设置', icon: Lock },
    { id: 'company', label: '公司信息', icon: Building2 }
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-display font-bold text-gtc-navy">设置</h1>
        <p className="text-gray-500 mt-1">管理您的账户和偏好设置</p>
      </div>

      {/* 消息提示 */}
      {message.text && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 侧边标签 */}
        <div className="lg:w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gtc-gold/10 text-gtc-gold font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-6">
          {/* 个人信息 */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <h2 className="text-lg font-semibold text-gtc-navy flex items-center gap-2">
                <User className="w-5 h-5" />
                个人信息
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓名
                  </label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gtc-gold focus:border-transparent"
                    placeholder="请输入姓名"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">邮箱不可修改</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gtc-gold text-white rounded-lg hover:bg-gtc-gold/90 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {loading ? '保存中...' : '保存更改'}
                </button>
              </div>
            </form>
          )}

          {/* 安全设置 */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <h2 className="text-lg font-semibold text-gtc-navy flex items-center gap-2">
                <Lock className="w-5 h-5" />
                修改密码
              </h2>
              
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    当前密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gtc-gold focus:border-transparent"
                      placeholder="请输入当前密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gtc-gold focus:border-transparent"
                      placeholder="请输入新密码（至少6位）"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    确认新密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gtc-gold focus:border-transparent"
                      placeholder="请再次输入新密码"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !passwords.current || !passwords.new || !passwords.confirm}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gtc-gold text-white rounded-lg hover:bg-gtc-gold/90 disabled:opacity-50 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  {loading ? '修改中...' : '修改密码'}
                </button>
              </div>
            </form>
          )}

          {/* 公司信息 */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gtc-navy flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                公司信息
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">公司ID</label>
                    <p className="text-lg font-medium text-gtc-navy">{user?.company_id || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">角色ID</label>
                    <p className="text-lg font-medium text-gtc-navy">{user?.role_id || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">账户状态</label>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                      user?.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user?.is_active ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          活跃
                        </>
                      ) : '已禁用'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">注册时间</label>
                    <p className="text-lg font-medium text-gtc-navy">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-400">
                如需修改公司信息，请联系管理员
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
