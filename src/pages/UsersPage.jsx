import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/usersApi';

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 邀请表单
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('analyst');
  const [inviting, setInviting] = useState(false);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, invitationsData] = await Promise.all([
        usersAPI.list(),
        usersAPI.listInvitations(),
      ]);
      setUsers(usersData);
      setInvitations(invitationsData);
    } catch (err) {
      setError('加载数据失败: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 邀请用户
  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setError('');
    setSuccess('');

    try {
      const result = await usersAPI.invite(inviteEmail, inviteRole);
      setSuccess(`邀请已发送！链接: ${result.invite_link}`);
      setInviteEmail('');
      setShowInviteForm(false);
      loadData();
    } catch (err) {
      setError('邀请失败: ' + (err.response?.data?.detail || err.message));
    } finally {
      setInviting(false);
    }
  };

  // 启用/禁用用户
  const handleToggleActive = async (userId, currentActive) => {
    try {
      await usersAPI.update(userId, { is_active: !currentActive });
      setSuccess(currentActive ? '用户已禁用' : '用户已启用');
      loadData();
    } catch (err) {
      setError('操作失败: ' + (err.response?.data?.detail || err.message));
    }
  };

  // 终止用户
  const handleTerminate = async (userId, email) => {
    if (!window.confirm(`确定要终止用户 ${email} 吗？此操作不可逆。`)) {
      return;
    }

    try {
      await usersAPI.terminate(userId);
      setSuccess(`用户 ${email} 已被终止`);
      loadData();
    } catch (err) {
      setError('终止失败: ' + (err.response?.data?.detail || err.message));
    }
  };

  // 角色显示
  const getRoleBadge = (roleName) => {
    const colors = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      analyst: 'bg-green-100 text-green-800',
      expert: 'bg-yellow-100 text-yellow-800',
      client: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      super_admin: '超级管理员',
      admin: '管理员',
      analyst: '分析师',
      expert: '专家',
      client: '客户',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[roleName] || 'bg-gray-100 text-gray-800'}`}>
        {labels[roleName] || roleName}
      </span>
    );
  };

  // 状态显示
  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        正常
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        已禁用
      </span>
    );
  };

  // 检查权限
  const canManageUsers = user?.role_id === 4 || user?.role_id === 1;
  const isSuperAdmin = user?.role_id === 4;
  if (!canManageUsers) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">您没有权限访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-500 mt-1">管理员工账号和权限</p>
        </div>
        <button
          onClick={() => setShowInviteForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          邀请员工
        </button>
      </div>

      {/* 提示消息 */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button onClick={() => setError('')} className="text-red-600 underline text-sm mt-1">关闭</button>
        </div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
          <button onClick={() => setSuccess('')} className="text-green-600 underline text-sm mt-1">关闭</button>
        </div>
      )}

      {/* 邀请表单弹窗 */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">邀请新员工</h2>
            <form onSubmit={handleInvite}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱地址
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="employee@company.com"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  角色
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="analyst">分析师</option>
                  {isSuperAdmin && <option value="admin">管理员</option>}
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {inviting ? '发送中...' : '发送邀请'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 加载中 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-500">加载中...</p>
        </div>
      ) : (
        <>
          {/* 用户列表 */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">用户列表 ({users.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用户
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      角色
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      公司
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      注册时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id} className={!u.is_active ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{u.full_name || '-'}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(u.role_name)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {u.company_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(u.is_active)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(u.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {u.id !== user?.id && (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleToggleActive(u.id, u.is_active)}
                              className={`px-3 py-1 rounded text-sm ${
                                u.is_active
                                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {u.is_active ? '禁用' : '启用'}
                            </button>
                            {isSuperAdmin && (
                              <button
                                onClick={() => handleTerminate(u.id, u.email)}
                                className="px-3 py-1 rounded text-sm bg-red-100 text-red-700 hover:bg-red-200"
                              >
                                终止
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 待处理邀请 */}
          {invitations.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">待处理邀请 ({invitations.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        邮箱
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        角色
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        邀请链接
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        过期时间
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invitations.map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {inv.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(inv.role_name)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {inv.token !== '[已使用]' ? (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(inv.invite_link);
                                setSuccess('链接已复制到剪贴板');
                              }}
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              复制链接
                            </button>
                          ) : (
                            <span className="text-gray-400">已使用</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(inv.expires_at).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
