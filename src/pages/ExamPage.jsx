import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, CheckCircle, XCircle, Award, AlertTriangle, Send
} from 'lucide-react';
import { trainingAPI } from '../services/api';

export default function ExamPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadQuestions();
  }, [courseId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await trainingAPI.getExamQuestions(courseId);
      setQuestions(data);
    } catch (err) {
      setError(err.response?.data?.detail || '加载考试题目失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    // 检查是否全部作答
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      setError(`还有 ${unanswered.length} 题未作答`);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const answerList = questions.map(q => ({
        question_id: q.id,
        answer: answers[q.id]
      }));
      const data = await trainingAPI.submitExam(courseId, answerList);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate(`/training/courses/${courseId}`)} className="flex items-center gap-2 text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> 返回课程
        </button>
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  // 考试结果页
  if (result) {
    const scorePercent = Math.round(result.score / result.total_questions * 100);
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className={`rounded-xl p-8 text-center border ${
          result.passed
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          {result.passed ? (
            <Award className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          ) : (
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold text-white mb-2">
            {result.passed ? '🎉 恭喜通过！' : '未通过考试'}
          </h2>
          <p className="text-4xl font-bold mb-2">
            <span className={result.passed ? 'text-green-400' : 'text-red-400'}>
              {result.score}
            </span>
            <span className="text-slate-500 text-lg"> / {result.total_questions}</span>
          </p>
          <p className="text-slate-400">
            正确率 {scorePercent}%（及格线 80%）
          </p>

          {result.passed && (
            <p className="text-amber-400 mt-4">证书已自动生成，可在"我的证书"中查看</p>
          )}

          <div className="flex gap-4 justify-center mt-6">
            <button
              onClick={() => navigate(`/training/courses/${courseId}`)}
              className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
            >
              返回课程
            </button>
            {result.passed ? (
              <button
                onClick={() => navigate('/training/certificates')}
                className="px-6 py-2.5 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                查看证书
              </button>
            ) : (
              <button
                onClick={() => { setResult(null); setAnswers({}); loadQuestions(); }}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                重新考试
              </button>
            )}
          </div>
        </div>

        {/* 答题详情 */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">答题详情</h3>
          <div className="space-y-4">
            {result.answers?.map((ans, i) => (
              <div key={i} className={`p-4 rounded-lg border ${
                ans.correct ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
              }`}>
                <div className="flex items-start gap-3">
                  {ans.correct ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm text-slate-400">第 {i + 1} 题</p>
                    <p className="text-white text-sm">
                      你的答案: <span className={ans.correct ? 'text-green-400' : 'text-red-400'}>{ans.answer}</span>
                      {!ans.correct && (
                        <span className="text-green-400 ml-3">正确答案: {ans.correct_answer}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 答题页
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <button onClick={() => navigate(`/training/courses/${courseId}`)} className="flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> 返回课程
      </button>

      {/* 考试头部 */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">课程考试</h1>
            <p className="text-slate-400 text-sm mt-1">共 {questions.length} 题，80% 及格</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-400">{answeredCount}/{questions.length}</p>
            <p className="text-xs text-slate-500">已作答</p>
          </div>
        </div>
        {/* 进度条 */}
        <div className="w-full h-1.5 bg-slate-700 rounded-full mt-4 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${answeredCount / questions.length * 100}%` }}
          />
        </div>
      </div>

      {/* 题目列表 */}
      <div className="space-y-5">
        {questions.map((q, index) => (
          <div key={q.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">
                {index + 1}
              </span>
              <p className="text-white">{q.question_text}</p>
            </div>
            <div className="space-y-2 ml-10">
              {q.options.map(opt => (
                <label
                  key={opt.key}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition border ${
                    answers[q.id] === opt.key
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                      : 'bg-slate-900/30 border-slate-700/30 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={opt.key}
                    checked={answers[q.id] === opt.key}
                    onChange={() => handleAnswer(q.id, opt.key)}
                    className="hidden"
                  />
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    answers[q.id] === opt.key ? 'border-blue-400 bg-blue-500' : 'border-slate-600'
                  }`}>
                    {answers[q.id] === opt.key && <span className="w-2 h-2 rounded-full bg-white"></span>}
                  </span>
                  <span className="text-sm font-medium mr-2">{opt.key}.</span>
                  <span className="text-sm">{opt.text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 提交 */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2 font-medium disabled:opacity-50"
        >
          {submitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Send className="w-5 h-5" />
              提交答卷
            </>
          )}
        </button>
      </div>
    </div>
  );
}
