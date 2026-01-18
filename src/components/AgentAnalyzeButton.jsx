import { useState } from 'react';
import { agentAPI } from '../services/agentApi';

export default function AgentAnalyzeButton({ caseId, onComplete }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = () => {
    setAnalyzing(true);
    setProgress(null);
    setError('');

    agentAPI.analyzeWithProgress(caseId, {
      onStart: (data) => {
        setProgress({ step: 0, total: 4, percent: 0, detail: '开始分析...' });
      },
      onProgress: (data) => {
        setProgress(data);
      },
      onComplete: (data) => {
        setAnalyzing(false);
        setProgress({ step: 4, total: 4, percent: 100, detail: '分析完成!' });
        onComplete && onComplete(data);
      },
      onError: (data) => {
        setAnalyzing(false);
        setError(data.message || '分析失败');
      }
    });
  };

  return (
    <div className="agent-analyze">
      <button
        onClick={handleAnalyze}
        disabled={analyzing}
        className={`px-4 py-2 rounded-lg font-medium transition-all ${
          analyzing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
        }`}
      >
        {analyzing ? '分析中...' : '一键智能分析'}
      </button>

      {progress && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              步骤 {progress.step}/{progress.total}: {progress.step_name || '准备中'}
            </span>
            <span className="text-sm text-gray-500">{progress.percent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          {progress.detail && (
            <p className="mt-2 text-sm text-gray-600">{progress.detail}</p>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}