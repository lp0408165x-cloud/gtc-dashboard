import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Clock, CheckCircle, Circle, PlayCircle,
  Award, FileText, Lock, ChevronRight, AlertCircle
} from 'lucide-react';
import { trainingAPI } from '../services/api';

const statusIcon = {
  completed: <CheckCircle className="w-5 h-5 text-green-400" />,
  in_progress: <PlayCircle className="w-5 h-5 text-blue-400" />,
  not_started: <Circle className="w-5 h-5 text-slate-600" />,
};

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const result = await trainingAPI.getCourseDetail(courseId);
      setData(result);
    } catch (err) {
      console.error('加载课程详情失败:', err);
      setError('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      await trainingAPI.enrollCourse(courseId);
      await loadCourse();
    } catch (err) {
      setError(err.response?.data?.detail || '报名失败');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-slate-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p>{error || '课程不存在'}</p>
      </div>
    );
  }

  const { course, lessons, total_lessons, completed_lessons, progress_percent, enrolled, exam_questions_count } = data;
  const allCompleted = total_lessons > 0 && completed_lessons === total_lessons;

  return (
    <div className="space-y-6">
      {/* 顶部导航 */}
      <button
        onClick={() => navigate('/training')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        返回课程列表
      </button>

      {/* 课程头部 */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded">
                {course.code}
              </span>
              <span className="text-sm text-slate-500">{course.category}</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{course.title}</h1>
            <p className="text-slate-400">{course.description}</p>

            <div className="flex items-center gap-6 mt-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {course.duration_hours} 小时
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {total_lessons} 课时
              </span>
              {exam_questions_count > 0 && (
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  {exam_questions_count} 道考题
                </span>
              )}
            </div>
          </div>

          {/* 右侧操作区 */}
          <div className="lg:w-64 space-y-4">
            {enrolled ? (
              <>
                {/* 进度 */}
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">学习进度</span>
                    <span className={`text-sm font-bold ${allCompleted ? 'text-green-400' : 'text-blue-400'}`}>
                      {progress_percent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${allCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${progress_percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    {completed_lessons}/{total_lessons} 课时完成
                  </p>
                </div>

                {/* 考试入口 */}
                {allCompleted && exam_questions_count > 0 && (
                  <button
                    onClick={() => navigate(`/training/courses/${courseId}/exam`)}
                    className="w-full px-4 py-3 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition flex items-center justify-center gap-2 font-medium"
                  >
                    <Award className="w-5 h-5" />
                    参加考试
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center justify-center gap-2 font-medium disabled:opacity-50"
              >
                {enrolling ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5" />
                    立即报名
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-4">{error}</p>
        )}
      </div>

      {/* 课时列表 */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="p-4 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">课程大纲</h2>
        </div>
        <div className="divide-y divide-slate-700/30">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              onClick={() => {
                if (enrolled) navigate(`/training/lessons/${lesson.id}`);
              }}
              className={`flex items-center gap-4 p-4 transition ${
                enrolled
                  ? 'hover:bg-slate-700/30 cursor-pointer'
                  : 'opacity-60'
              }`}
            >
              {/* 序号/状态 */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-900/50 flex items-center justify-center">
                {enrolled ? (
                  statusIcon[lesson.status]
                ) : (
                  <span className="text-slate-600 text-sm font-mono">{String(index + 1).padStart(2, '0')}</span>
                )}
              </div>

              {/* 课时信息 */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium ${
                  lesson.status === 'completed' ? 'text-slate-400' : 'text-white'
                }`}>
                  {lesson.title}
                </h3>
                {lesson.description && (
                  <p className="text-sm text-slate-500 mt-0.5 truncate">{lesson.description}</p>
                )}
              </div>

              {/* 时长 */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-slate-500">
                  {lesson.duration_minutes} 分钟
                </span>
                {enrolled ? (
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                ) : (
                  <Lock className="w-4 h-4 text-slate-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
