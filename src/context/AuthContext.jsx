import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 初始化 - 检查本地存储的 token
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('gtc_token');
      const savedUser = localStorage.getItem('gtc_user');
      
     if (token && savedUser && savedUser !== 'undefined') {
  try {
    const parsedUser = JSON.parse(savedUser);
    if (parsedUser) {
      setUser(parsedUser);
    }
          // 可选：验证 token 是否有效
          // const currentUser = await authAPI.getCurrentUser();
          // setUser(currentUser);
        } catch (err) {
          console.error('Token validation failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // 登录
  const login = async (email, password) => {
    setError(null);
    try {
     const userInfo = { email: email };
localStorage.setItem('gtc_user', JSON.stringify(userInfo));
setUser(userInfo);
return data;
    } catch (err) {
      const message = err.response?.data?.detail || '登录失败，请检查邮箱和密码';
      setError(message);
      throw new Error(message);
    }
  };

  // 注册
  const register = async (userData) => {
    setError(null);
    try {
      const data = await authAPI.register(userData);
      return data;
    } catch (err) {
      const message = err.response?.data?.detail || '注册失败，请稍后重试';
      setError(message);
      throw new Error(message);
    }
  };

  // 登出
  const logout = () => {
    localStorage.removeItem('gtc_token');
    localStorage.removeItem('gtc_user');
    setUser(null);
  };

  // 检查是否已登录
  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('gtc_token');
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
