import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * 区块级错误边界：包住的子树渲染出错时只显示本区块的提示，不整页白屏。
 * 典型触发：把后端返回的非字符串（FastAPI 的 detail 可能是 object / array）
 * 直接当成 React 子节点渲染。
 *
 * 用法：<ErrorBoundary label="闸门记录"><Xxx /></ErrorBoundary>
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

  retry() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg = this.state.error?.message || String(this.state.error || '未知错误');
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
