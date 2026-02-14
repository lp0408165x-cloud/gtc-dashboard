import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle, BookOpen, Clock, Play
} from 'lucide-react';
import { trainingAPI } from '../services/api';

export default function LessonView() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completeResult, setCompleteResult] = useState(null);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const result = await trainingAPI.getLesson(lessonId);
      setData(result);
    } catch (err) {
      console.error('加载课时失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      const result = await trainingAPI.completeLesson(lessonId);
      setCompleteResult(result);
      setData(prev => ({ ...prev, status: 'completed' }));
    } catch (err) {
      console.error('标记完成失败:', err);
    } finally {
      setCompleting(false);
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
    return <div className="text-center py-20 text-slate-500">课时不存在</div>;
  }

  const { lesson, status } = data;
  const isCompleted = status === 'completed';
  const progress = completeResult?.course_progress;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 顶部导航 */}
      <button
        onClick={() => navigate(`/training/courses/${lesson.course_id}`)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        返回课程
      </button>

      {/* 课时头部 */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-slate-500 font-mono">
            课时 {lesson.sort_order}
          </span>
          {isCompleted && (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
              <CheckCircle className="w-3 h-3" />
              已完成
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold text-white">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-slate-400 mt-2">{lesson.description}</p>
        )}
        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {lesson.duration_minutes} 分钟
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            {lesson.content_type}
          </span>
        </div>
      </div>

      {/* 课时内容 */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        {lesson.content_type === 'video' && lesson.content_url ? (
          <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
            <a
              href={lesson.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
            >
              <Play className="w-8 h-8" />
              <span>播放视频</span>
            </a>
          </div>
        ) : lesson.content_text ? (
          <div className="prose prose-invert max-w-none">
            <div className="text-slate-300 leading-relaxed whitespace-pre-wrap text-base">
              {lesson.content_text}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>课时内容待添加</p>
          </div>
        )}
      </div>

      {/* 完成按钮 / 进度反馈 */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        {completeResult && progress && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 font-medium mb-2">
              {progress.all_completed ? '🎉 恭喜！所有课时已完成，可以参加考试了！' : `✅ 课时完成！进度 ${progress.completed}/${progress.total}`}
            </p>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${progress.all_completed ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          {!isCompleted && !completeResult ? (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2 font-medium disabled:opacity-50"
            >
              {completing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  标记为已完成
                </>
              )}
            </button>
          ) : (
            <div className="text-green-400 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              已完成
            </div>
          )}

          {progress?.all_completed && (
            <button
              onClick={() => navigate(`/training/courses/${lesson.course_id}/exam`)}
              className="px-6 py-3 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition flex items-center gap-2 font-medium"
            >
              参加考试
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
