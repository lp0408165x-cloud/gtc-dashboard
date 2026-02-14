import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Clock, Users, Award, ChevronRight,
  Filter, Search, Play, CheckCircle, Lock, BarChart3, Star
} from 'lucide-react';
import { trainingAPI } from '../services/api';

const categoryMap = {
  all: { label: '全部课程', icon: BookOpen },
  uflpa: { label: 'UFLPA 合规', icon: GraduationCap },
  cbp: { label: 'CBP 海关', icon: Users },
  audit: { label: '审计应对', icon: BarChart3 },
  ai: { label: 'AI 工具', icon: Star },
};

const difficultyMap = {
  beginner: { label: '入门', color: 'bg-green-500/20 text-green-400' },
  intermediate: { label: '进阶', color: 'bg-yellow-500/20 text-yellow-400' },
  advanced: { label: '高级', color: 'bg-red-500/20 text-red-400' },
};

export default function TrainingCenter() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await trainingAPI.getCourses();
      setCourses(data);
    } catch (err) {
      console.error('加载课程失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(c => {
    const matchCategory = activeCategory === 'all' || c.category === activeCategory;
    const matchSearch = !searchTerm ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  // 统计
  const totalCourses = courses.length;
  const enrolledCourses = courses.filter(c => c.enrolled).length;
  const completedCourses = courses.filter(c => c.progress_percent === 100).length;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-blue-400" />
            培训中心
          </h1>
          <p className="text-slate-400 mt-1">系统化学习全球贸易合规专业知识</p>
        </div>
        <button
          onClick={() => navigate('/training/certificates')}
          className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition flex items-center gap-2"
        >
          <Award className="w-4 h-4" />
          我的证书
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">可用课程</p>
              <p className="text-2xl font-bold text-white mt-1">{totalCourses}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-400 opacity-60" />
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">已报名</p>
              <p className="text-2xl font-bold text-white mt-1">{enrolledCourses}</p>
            </div>
            <Play className="w-8 h-8 text-green-400 opacity-60" />
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">已完成</p>
              <p className="text-2xl font-bold text-white mt-1">{completedCourses}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-amber-400 opacity-60" />
          </div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="搜索课程..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(categoryMap).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeCategory === key
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 课程列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>暂无匹配的课程</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => navigate(`/training/courses/${course.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({ course, onClick }) {
  const diff = difficultyMap[course.difficulty] || difficultyMap.beginner;
  const hasProgress = course.enrolled && course.progress_percent > 0;
  const isCompleted = course.progress_percent === 100;

  return (
    <div
      onClick={onClick}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-blue-500/30 transition cursor-pointer group"
    >
      {/* 顶部色条 */}
      <div className="h-1.5 bg-gradient-to-r from-blue-500 to-cyan-500" />

      <div className="p-5">
        {/* 标签行 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
            {course.code}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${diff.color}`}>
            {diff.label}
          </span>
        </div>

        {/* 标题 */}
        <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-blue-400 transition">
          {course.title}
        </h3>

        {/* 描述 */}
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
          {course.description}
        </p>

        {/* 课程信息 */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {course.duration_hours}小时
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {course.total_lessons}课时
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {course.category}
          </span>
        </div>

        {/* 进度条 / 状态 */}
        {course.enrolled ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">
                {isCompleted ? '已完成' : `${course.completed_lessons}/${course.total_lessons} 课时`}
              </span>
              <span className={`text-xs font-medium ${isCompleted ? 'text-green-400' : 'text-blue-400'}`}>
                {course.progress_percent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${course.progress_percent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">未报名</span>
            <span className="text-xs text-blue-400 group-hover:text-blue-300 flex items-center gap-1">
              查看详情 <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
