import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle, BookOpen, Clock, Play } from 'lucide-react';
import { trainingAPI } from '../services/api';

export default function LessonView() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completeResult, setCompleteResult] = useState(null);

  useEffect(() => { loadLesson(); }, [lessonId]);

  const loadLesson = async () => {
    try { setLoading(true); const r = await trainingAPI.getLesson(lessonId); setData(r); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleComplete = async () => {
    try { setCompleting(true); const r = await trainingAPI.completeLesson(lessonId); setCompleteResult(r); setData(p => ({ ...p, status: 'completed' })); }
    catch (err) { console.error(err); } finally { setCompleting(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-center py-24 text-slate-500">课时不存在</div>;

  const { lesson, status } = data;
  const isCompleted = status === 'completed';
  const progress = completeResult?.course_progress;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <button onClick={() => navigate(`/training/courses/${lesson.course_id}`)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> 返回课程
      </button>

      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[11px] text-slate-600 font-mono uppercase tracking-wider">Lesson {lesson.sort_order}</span>
          {isCompleted && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full ring-1 ring-emerald-500/20">
              <CheckCircle className="w-3 h-3" /> 已完成
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">{lesson.title}</h1>
        {lesson.description && <p className="text-slate-400 mt-2 text-sm leading-relaxed">{lesson.description}</p>}
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{lesson.duration_minutes} 分钟</span>
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{lesson.content_type}</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-8">
        {lesson.content_type === 'video' && lesson.content_url ? (
          <div className="aspect-video bg-slate-950 rounded-xl flex items-center justify-center">
            <a href={lesson.content_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition">
              <Play className="w-8 h-8" /><span>播放视频</span>
            </a>
          </div>
        ) : lesson.content_text ? (
          <div className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{lesson.content_text}</div>
        ) : (
          <div className="text-center py-12 text-slate-600"><BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" /><p className="text-sm">课时内容待添加</p></div>
        )}
      </div>

      {/* Action */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-6">
        {progress && (
          <div className="mb-4 p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
            <p className="text-emerald-400 text-sm font-medium mb-2">
              {progress.all_completed ? '🎉 所有课时已完成，可以参加考试！' : `✅ 课时完成 ${progress.completed}/${progress.total}`}
            </p>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${progress.all_completed ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          {!isCompleted && !completeResult ? (
            <button onClick={handleComplete} disabled={completing}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50">
              {completing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle className="w-4 h-4" /> 标记为已完成</>}
            </button>
          ) : (
            <div className="text-emerald-400 flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4" /> 已完成</div>
          )}
          {progress?.all_completed && (
            <button onClick={() => navigate(`/training/courses/${lesson.course_id}/exam`)}
              className="px-6 py-2.5 bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 rounded-xl text-sm font-medium hover:bg-amber-500/15 transition-all flex items-center gap-2">
              参加考试 <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
