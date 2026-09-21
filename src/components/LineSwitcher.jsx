import { useState } from 'react';
import { Globe } from 'lucide-react';
import { LINES, getLine, setLine } from '../config/line';

// 线路切换。切换后必须整页 reload —— API_BASE 是模块加载时求值的常量。
// variant: 'light' 浅色底（设置页） | 'dark' 深色底（登录页）
export default function LineSwitcher({ variant = 'light' }) {
  const [current, setCurrent] = useState(getLine);
  const dark = variant === 'dark';

  const handleSwitch = (id) => {
    if (id === current) return;
    setCurrent(id);
    if (setLine(id)) window.location.reload();
  };

  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex items-center gap-1.5 text-sm ${
          dark ? 'text-gray-400' : 'text-gray-600'
        }`}
      >
        <Globe className="w-4 h-4" />
        线路
      </span>

      <div
        className={`inline-flex rounded-lg p-0.5 ${
          dark ? 'bg-white/10' : 'bg-gray-100'
        }`}
      >
        {LINES.map((line) => {
          const active = line.id === current;
          return (
            <button
              key={line.id}
              type="button"
              onClick={() => handleSwitch(line.id)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                active
                  ? dark
                    ? 'bg-gtc-gold text-gtc-navy font-medium'
                    : 'bg-white text-gtc-navy font-medium shadow-sm'
                  : dark
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {line.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
