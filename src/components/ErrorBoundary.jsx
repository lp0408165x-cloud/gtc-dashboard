import { Component } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * 区块级错误边界：包住的子树渲染出错时只显示本区块的提示，不整页白屏。
 * 典型触发：把后端返回的非字符串（FastAPI 的 detail 可能是 object / array）
 * 直接当成 React 子节点渲染。
 *
 * 用法：<ErrorBoundary label="闸门记录"><Xxx /></ErrorBoundary>
 *
 * 路由级用 PageErrorBoundary（本文件导出）：换页（pathname 变）时自动清除错误状态，
 * 出错时显示整页提示而不是白屏。
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.retry = this.retry.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary${this.props.label ? ': ' + this.props.label : ''}]`, error, info);
  }

  componentDidUpdate(prevProps) {
    // 路由切换后给新页面一次机会，不把上一页的错误带过去
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.retry();
    }
  }

  retry() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg = this.state.error?.message || String(this.state.error || '未知错误');
    if (this.props.page) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="mt-3 font-semibold text-gray-800">页面出错了</p>
            <p className="mt-1 text-sm text-gray-500">
              请重试或刷新页面；如仍有问题，请联系 <a className="underline" href="mailto:info@gtc-ai-global.com">info@gtc-ai-global.com</a>
            </p>
            <p className="mt-3 text-xs text-gray-400 break-all">{msg}</p>
            <div className="mt-4 flex justify-center gap-3">
              <button onClick={this.retry}
                      className="inline-flex items-center gap-1 px-4 py-2 text-sm rounded-lg bg-gtc-navy text-white">
                <RotateCcw className="w-4 h-4" />重试
              </button>
              <button onClick={() => window.location.reload()}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700">
                刷新页面
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
        <p className="font-semibold text-amber-800 flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {this.props.label ? `${this.props.label}显示异常` : '此区块显示异常'}
        </p>
        <p className="text-xs text-amber-700 mt-1 break-all">{msg}</p>
        <button
          onClick={this.retry}
          className="mt-2 inline-flex items-center gap-1 text-xs text-amber-800 hover:text-amber-900 underline underline-offset-2"
        >
          <RotateCcw className="w-3 h-3" />重试渲染
        </button>
      </div>
    );
  }
}

/** 路由级错误边界：包住页面，换页自动复位 */
export function PageErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return <ErrorBoundary page resetKey={pathname}>{children}</ErrorBoundary>;
}
