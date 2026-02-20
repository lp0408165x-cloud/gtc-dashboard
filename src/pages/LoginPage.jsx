import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || '登录失败，请检查邮箱和密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gtc-navy flex">
      {/* 左侧品牌区域 */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-gtc-navy via-gtc-blue to-gtc-navy"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gtc-gold/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gtc-accent/10 rounded-full blur-3xl"></div>
        
        {/* 内容 */}
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-12 h-12 text-gtc-gold" />
            <span className="text-3xl font-display font-bold text-white">GTC-AI</span>
          </div>
          
          <h1 className="text-5xl font-display font-bold text-white leading-tight mb-6">
            海关查扣<br />
            <span className="text-gtc-gold">专业处理平台</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-md">
            资深专家合规团队，为您的供应链保驾护航。
            快速响应CBP查扣，专业申诉文书生成。
          </p>
          
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gtc-gold">98%</div>
              <div className="text-sm text-gray-400">申诉成功率</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gtc-gold">24h</div>
              <div className="text-sm text-gray-400">快速响应</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gtc-gold">500+</div>
              <div className="text-sm text-gray-400">成功案例</div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* 移动端 Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <Shield className="w-10 h-10 text-gtc-gold" />
            <span className="text-2xl font-display font-bold text-white">GTC-AI</span>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
            <h2 className="text-2xl font-display font-bold text-gtc-navy mb-2">
              欢迎回来
            </h2>
            <p className="text-gray-500 mb-8">
              登录您的账户，继续管理合规案件
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  邮箱地址
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gtc-gold focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-gtc-gold focus:ring-gtc-gold"
                  />
                  <span className="text-sm text-gray-600">记住我</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-gtc-accent hover:underline"
                >
                  忘记密码？
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gtc-navy text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gtc-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    登录
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <span className="text-gray-500">还没有账户？</span>{' '}
              <Link
                to="/register"
                className="text-gtc-accent font-medium hover:underline"
              >
                立即注册
              </Link>
            </div>
          </div>

          <p className="text-center text-gray-400 text-sm mt-8">
            © 2025 GTC-AI Global. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
