import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Clock, CheckCircle, Circle, PlayCircle,
  Award, FileText, Lock, ChevronRight, AlertCircle
} from 'lucide-react';
import { trainingAPI } from '../services/api';

const statusIcon = {
  completed: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  in_progress: <PlayCircle className="w-5 h-5 text-blue-400" />,
  not_started: <Circle className="w-5 h-5 text-slate-700" />,
};

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadCourse(); }, [courseId]);

  const loadCourse = async () => {
    try { setLoading(true); const r = await trainingAPI.getCourseDetail(courseId); setData(r); }
    catch (err) { setError('加载失败'); } finally { setLoading(false); }
  };

  const handleEnroll = async () => {
    try { setEnrolling(true); await trainingAPI.enrollCourse(courseId); await loadCourse(); }
    catch (err) { setError(err.response?.data?.detail || '报名失败'); } finally { setEnrolling(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-24 text-slate-500"><AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-40" /><p>{error || '课程不存在'}</p></div>
  );

  const { course, lessons, total_lessons, completed_lessons, progress_percent, enrolled, exam_questions_count } = data;
  const allCompleted = total_lessons > 0 && completed_lessons === total_lessons;

  return (
    <div className="space-y-6 pb-8">
      <button onClick={() => navigate('/training')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> 返回课程列表
      </button>

      {/* Course Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.06),transparent_60%)]" />
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg ring-1 ring-blue-500/20">{course.code}</span>
                <span className="text-xs text-slate-600 uppercase tracking-wide font-medium">{course.category}</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{course.title}</h1>
              <p className="text-slate-400 mt-2 text-sm leading-relaxed">{course.description}</p>
              <div className="flex items-center gap-5 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{course.duration_hours} 小时</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{total_lessons} 课时</span>
                {exam_questions_count > 0 && <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" />{exam_questions_count} 道考题</span>}
              </div>
            </div>

            <div className="lg:w-64 space-y-4">
              {enrolled ? (
                <>
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500">学习进度</span>
                      <span className={`text-sm font-bold tabular-nums ${allCompleted ? 'text-emerald-400' : 'text-blue-400'}`}>{progress_percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${allCompleted ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
                        style={{ width: `${progress_percent}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-600 mt-2">{completed_lessons}/{total_lessons} 课时完成</p>
                  </div>
                  {allCompleted && exam_questions_count > 0 && (
                    <button onClick={() => navigate(`/training/courses/${courseId}/exam`)}
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 hover:bg-amber-500/15 transition-all flex items-center justify-center gap-2">
                      <Award className="w-5 h-5" /> 参加考试
                    </button>
                  )}
                </>
              ) : (
                <button onClick={handleEnroll} disabled={enrolling}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {enrolling ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><PlayCircle className="w-5 h-5" /> 立即报名</>}
                </button>
              )}
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        </div>
      </div>

      {/* Lesson List */}
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/80">
          <h2 className="text-base font-semibold text-white">课程大纲</h2>
        </div>
        <div className="divide-y divide-slate-800/60">
          {lessons.map((lesson, index) => (
            <div key={lesson.id}
              onClick={() => enrolled && navigate(`/training/lessons/${lesson.id}`)}
              className={`flex items-center gap-4 px-6 py-4 transition-all ${enrolled ? 'hover:bg-white/[0.02] cursor-pointer' : 'opacity-50'}`}>
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-slate-800/60 flex items-center justify-center">
                {enrolled ? statusIcon[lesson.status] : <span className="text-slate-700 text-xs font-mono">{String(index + 1).padStart(2, '0')}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium ${lesson.status === 'completed' ? 'text-slate-500' : 'text-white'}`}>{lesson.title}</h3>
                {lesson.description && <p className="text-xs text-slate-600 mt-0.5 truncate">{lesson.description}</p>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[11px] text-slate-600">{lesson.duration_minutes}min</span>
                {enrolled ? <ChevronRight className="w-4 h-4 text-slate-700" /> : <Lock className="w-4 h-4 text-slate-700" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
