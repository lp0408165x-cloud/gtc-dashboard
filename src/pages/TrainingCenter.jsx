import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, Users, Award, ChevronRight,
  Search, Play, CheckCircle, BarChart3, Star, Layers, Shield, Zap
} from 'lucide-react';
import { trainingAPI } from '../services/api';

const categoryMap = {
  all: { label: '全部', icon: Layers },
  uflpa: { label: 'UFLPA', icon: Shield },
  cbp: { label: 'CBP', icon: Users },
  audit: { label: '审计', icon: BarChart3 },
  ai: { label: 'AI', icon: Zap },
};

const difficultyConfig = {
  beginner: { label: '入门', bg: 'bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20' },
  intermediate: { label: '进阶', bg: 'bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20' },
  advanced: { label: '高级', bg: 'bg-rose-400/10 text-rose-400 ring-1 ring-rose-400/20' },
};

const categoryColors = {
  uflpa: { accent: 'from-blue-600 to-indigo-600', bg: 'bg-blue-500/8' },
  cbp: { accent: 'from-cyan-600 to-teal-600', bg: 'bg-cyan-500/8' },
  audit: { accent: 'from-violet-600 to-purple-600', bg: 'bg-violet-500/8' },
  ai: { accent: 'from-orange-500 to-amber-500', bg: 'bg-orange-500/8' },
  custom: { accent: 'from-slate-600 to-slate-500', bg: 'bg-slate-500/8' },
};

export default function TrainingCenter() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadCourses(); }, []);

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
    const matchCat = activeCategory === 'all' || c.category === activeCategory;
    const matchSearch = !searchTerm || c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalCourses = courses.length;
  const enrolledCourses = courses.filter(c => c.enrolled).length;
  const completedCourses = courses.filter(c => c.progress_percent === 100).length;
  const totalHours = courses.reduce((sum, c) => sum + (c.duration_hours || 0), 0);

  return (
    <div className="space-y-8 pb-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/40">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.06),transparent_60%)]" />
        <div className="relative px-8 py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold tracking-widest text-blue-400/80 uppercase">Training Center</span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight mt-2">培训中心</h1>
              <p className="text-slate-400 mt-2 text-sm max-w-md leading-relaxed">系统化学习全球贸易合规专业知识，获取专业认证</p>
            </div>
            <button onClick={() => navigate('/training/certificates')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20 hover:bg-amber-500/15 hover:ring-amber-500/30 transition-all">
              <Award className="w-4 h-4" /> 我的证书
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-8">
            {[
              { label: '可用课程', value: totalCourses, icon: BookOpen, color: 'text-blue-400' },
              { label: '已报名', value: enrolledCourses, icon: Play, color: 'text-emerald-400' },
              { label: '已完成', value: completedCourses, icon: CheckCircle, color: 'text-amber-400' },
              { label: '总课时', value: `${totalHours}h`, icon: Clock, color: 'text-violet-400' },
            ].map((s, i) => (
              <div key={i} className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{s.label}</p>
                    <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                  </div>
                  <s.icon className={`w-5 h-5 ${s.color} opacity-30`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" placeholder="搜索课程..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/40 focus:bg-slate-900/80 transition-all" />
        </div>
        <div className="flex gap-1.5 bg-slate-900/40 p-1 rounded-xl border border-slate-700/30">
          {Object.entries(categoryMap).map(([key, { label, icon: Icon }]) => (
            <button key={key} onClick={() => setActiveCategory(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeCategory === key ? 'bg-blue-500/15 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-xs text-slate-600">加载课程...</span>
          </div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-slate-500 text-sm">暂无匹配的课程</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredCourses.map((course, index) => (
            <CourseCard key={course.id} course={course} index={index} onClick={() => navigate(`/training/courses/${course.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCard({ course, onClick }) {
  const diff = difficultyConfig[course.difficulty] || difficultyConfig.beginner;
  const colors = categoryColors[course.category] || categoryColors.custom;
  const isCompleted = course.progress_percent === 100;

  return (
    <div onClick={onClick}
      className="group relative bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden hover:border-slate-600/60 hover:bg-slate-900/80 transition-all duration-300 cursor-pointer">
      <div className={`h-[2px] bg-gradient-to-r ${colors.accent} opacity-60 group-hover:opacity-100 transition-opacity`} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
              <span className="text-[10px] font-bold tracking-wider">{course.code}</span>
            </div>
            {isCompleted && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-medium text-emerald-400">完成</span>
              </div>
            )}
          </div>
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${diff.bg}`}>{diff.label}</span>
        </div>

        <h3 className="text-white font-semibold text-[15px] leading-snug mb-1.5 group-hover:text-blue-300 transition-colors">{course.title}</h3>
        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-4">{course.description}</p>

        <div className="flex items-center gap-3 text-[11px] text-slate-600 mb-4">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration_hours}小时</span>
          <span className="w-0.5 h-0.5 rounded-full bg-slate-700" />
          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.total_lessons}课时</span>
          <span className="w-0.5 h-0.5 rounded-full bg-slate-700" />
          <span className="uppercase font-medium tracking-wide">{course.category}</span>
        </div>

        <div className="pt-3 border-t border-slate-800/80">
          {course.enrolled ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-500">{isCompleted ? '课程完成' : `进度 ${course.completed_lessons}/${course.total_lessons}`}</span>
                <span className={`text-[11px] font-semibold tabular-nums ${isCompleted ? 'text-emerald-400' : 'text-blue-400'}`}>{course.progress_percent}%</span>
              </div>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
                  style={{ width: `${course.progress_percent}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600">尚未报名</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 group-hover:text-blue-400 transition-colors font-medium">
                查看详情 <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
