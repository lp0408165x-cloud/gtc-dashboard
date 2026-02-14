import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Award, AlertTriangle, Send } from 'lucide-react';
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

  useEffect(() => { loadQuestions(); }, [courseId]);

  const loadQuestions = async () => {
    try { setLoading(true); const d = await trainingAPI.getExamQuestions(courseId); setQuestions(d); }
    catch (err) { setError(err.response?.data?.detail || '加载考试题目失败'); } finally { setLoading(false); }
  };

  const handleAnswer = (qid, ans) => setAnswers(p => ({ ...p, [qid]: ans }));

  const handleSubmit = async () => {
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) { setError(`还有 ${unanswered.length} 题未作答`); return; }
    try {
      setSubmitting(true); setError('');
      const d = await trainingAPI.submitExam(courseId, questions.map(q => ({ question_id: q.id, answer: answers[q.id] })));
      setResult(d);
    } catch (err) { setError(err.response?.data?.detail || '提交失败'); } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;

  if (error && questions.length === 0) return (
    <div className="space-y-6 pb-8">
      <button onClick={() => navigate(`/training/courses/${courseId}`)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition"><ArrowLeft className="w-4 h-4" /> 返回课程</button>
      <div className="text-center py-24"><AlertTriangle className="w-12 h-12 text-amber-400/60 mx-auto mb-4" /><p className="text-slate-400 text-sm">{error}</p></div>
    </div>
  );

  if (result) {
    const pct = Math.round(result.score / result.total_questions * 100);
    return (
      <div className="space-y-6 max-w-3xl mx-auto pb-8">
        <div className={`rounded-2xl p-10 text-center border ${result.passed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
          {result.passed ? <Award className="w-16 h-16 text-amber-400 mx-auto mb-4" /> : <XCircle className="w-16 h-16 text-red-400/60 mx-auto mb-4" />}
          <h2 className="text-2xl font-bold text-white mb-2">{result.passed ? '🎉 恭喜通过！' : '未通过考试'}</h2>
          <p className="text-4xl font-bold mb-1">
            <span className={result.passed ? 'text-emerald-400' : 'text-red-400'}>{result.score}</span>
            <span className="text-slate-600 text-lg"> / {result.total_questions}</span>
          </p>
          <p className="text-slate-500 text-sm">正确率 {pct}%（及格线 80%）</p>
          {result.passed && <p className="text-amber-400/80 mt-4 text-sm">证书已自动生成</p>}
          <div className="flex gap-3 justify-center mt-8">
            <button onClick={() => navigate(`/training/courses/${courseId}`)} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm hover:bg-slate-700 transition">返回课程</button>
            {result.passed ? (
              <button onClick={() => navigate('/training/certificates')} className="px-6 py-2.5 bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 rounded-xl text-sm hover:bg-amber-500/15 transition flex items-center gap-2"><Award className="w-4 h-4" /> 查看证书</button>
            ) : (
              <button onClick={() => { setResult(null); setAnswers({}); loadQuestions(); }} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-500 transition">重新考试</button>
            )}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-4">答题详情</h3>
          <div className="space-y-3">
            {result.answers?.map((a, i) => (
              <div key={i} className={`p-4 rounded-xl border ${a.correct ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                <div className="flex items-start gap-3">
                  {a.correct ? <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-400 mt-0.5" />}
                  <div className="text-sm">
                    <span className="text-slate-500">第 {i + 1} 题 — </span>
                    <span className={a.correct ? 'text-emerald-400' : 'text-red-400'}>你答: {a.answer}</span>
                    {!a.correct && <span className="text-emerald-400 ml-2">正确: {a.correct_answer}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-8">
      <button onClick={() => navigate(`/training/courses/${courseId}`)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition"><ArrowLeft className="w-4 h-4" /> 返回课程</button>

      <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">课程考试</h1>
            <p className="text-slate-500 text-xs mt-1">共 {questions.length} 题，80% 及格</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-400 tabular-nums">{answeredCount}<span className="text-slate-600 text-sm">/{questions.length}</span></p>
            <p className="text-[10px] text-slate-600">已作答</p>
          </div>
        </div>
        <div className="w-full h-1 bg-slate-800 rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${answeredCount / questions.length * 100}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold ring-1 ring-blue-500/20">{idx + 1}</span>
              <p className="text-white text-sm leading-relaxed">{q.question_text}</p>
            </div>
            <div className="space-y-2 ml-10">
              {q.options.map(opt => (
                <label key={opt.key}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                    answers[q.id] === opt.key
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      : 'bg-slate-950/30 border-slate-800/50 text-slate-400 hover:border-slate-700'
                  }`}>
                  <input type="radio" name={`q-${q.id}`} value={opt.key} checked={answers[q.id] === opt.key} onChange={() => handleAnswer(q.id, opt.key)} className="hidden" />
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${answers[q.id] === opt.key ? 'border-blue-400 bg-blue-500' : 'border-slate-700'}`}>
                    {answers[q.id] === opt.key && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="text-xs font-semibold mr-1.5 w-4">{opt.key}.</span>
                  <span className="text-sm">{opt.text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

      <div className="flex justify-end">
        <button onClick={handleSubmit} disabled={submitting}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50">
          {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> 提交答卷</>}
        </button>
      </div>
    </div>
  );
}
