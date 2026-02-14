import React, { useState, useEffect } from 'react';
import {
  GraduationCap, BookOpen, FileText, Plus, Edit, Trash2, Save,
  X, BarChart3, Eye, EyeOff, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { trainingAPI } from '../services/api';

const tabs = [
  { key: 'stats', label: '统计概览', icon: BarChart3 },
  { key: 'courses', label: '课程管理', icon: GraduationCap },
  { key: 'questions', label: '题库管理', icon: FileText },
];

export default function TrainingAdmin() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, coursesData] = await Promise.all([
        trainingAPI.admin.getStats().catch(() => null),
        trainingAPI.getCourses()
      ]);
      setStats(statsData);
      setCourses(coursesData);
    } catch (err) {
      console.error('加载数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-3">
        <GraduationCap className="w-7 h-7 text-blue-400" />
        培训管理
      </h1>

      {/* Tab */}
      <div className="flex gap-2 border-b border-slate-700/50 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition border-b-2 -mb-[2px] ${
              activeTab === tab.key
                ? 'text-blue-400 border-blue-400 bg-slate-800/50'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      ) : (
        <>
          {activeTab === 'stats' && <StatsPanel stats={stats} />}
          {activeTab === 'courses' && <CoursesPanel courses={courses} onRefresh={loadData} />}
          {activeTab === 'questions' && <QuestionsPanel courses={courses} />}
        </>
      )}
    </div>
  );
}


// ============ 统计面板 ============
function StatsPanel({ stats }) {
  if (!stats) return <p className="text-slate-500">暂无统计数据</p>;

  const cards = [
    { label: '课程总数', value: stats.courses?.total || 0, sub: `${stats.courses?.published || 0} 已发布`, color: 'text-blue-400' },
    { label: '报名人次', value: stats.enrollments || 0, color: 'text-green-400' },
    { label: '考试次数', value: stats.exams?.total || 0, sub: `${stats.exams?.passed || 0} 通过`, color: 'text-amber-400' },
    { label: '通过率', value: `${stats.pass_rate || 0}%`, color: 'text-cyan-400' },
    { label: '证书颁发', value: stats.certificates || 0, color: 'text-purple-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <p className="text-slate-500 text-xs">{card.label}</p>
          <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          {card.sub && <p className="text-xs text-slate-600 mt-1">{card.sub}</p>}
        </div>
      ))}
    </div>
  );
}


// ============ 课程管理面板 ============
function CoursesPanel({ courses, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    code: '', title: '', description: '', category: 'uflpa',
    difficulty: 'beginner', duration_hours: 0, is_published: false, sort_order: 0
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [lessonForm, setLessonForm] = useState(null);

  const resetForm = () => {
    setFormData({ code: '', title: '', description: '', category: 'uflpa', difficulty: 'beginner', duration_hours: 0, is_published: false, sort_order: 0 });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const startEdit = (course) => {
    setFormData({
      code: course.code, title: course.title, description: course.description || '',
      category: course.category || 'uflpa', difficulty: course.difficulty || 'beginner',
      duration_hours: course.duration_hours || 0, is_published: course.is_published,
      sort_order: course.sort_order || 0
    });
    setEditingId(course.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.title) { setError('课程代码和标题必填'); return; }
    try {
      setSaving(true);
      setError('');
      if (editingId) {
        await trainingAPI.admin.updateCourse(editingId, formData);
      } else {
        await trainingAPI.admin.createCourse(formData);
      }
      resetForm();
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.detail || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title) return;
    try {
      await trainingAPI.admin.createLesson(lessonForm);
      setLessonForm(null);
      onRefresh();
    } catch (err) {
      setError(err.response?.data?.detail || '保存课时失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> 新建课程
        </button>
      </div>

      {/* 新建/编辑表单 */}
      {showForm && (
        <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium">{editingId ? '编辑课程' : '新建课程'}</h3>
            <button onClick={resetForm} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="课程代码 (如 M7)" value={formData.code} onChange={e => setFormData(p => ({...p, code: e.target.value}))}
              className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" disabled={!!editingId} />
            <input placeholder="课程标题" value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))}
              className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 md:col-span-2" />
          </div>
          <textarea placeholder="课程描述" value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} rows={2}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select value={formData.category} onChange={e => setFormData(p => ({...p, category: e.target.value}))}
              className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm">
              <option value="uflpa">UFLPA</option><option value="cbp">CBP</option>
              <option value="audit">审计</option><option value="ai">AI</option><option value="custom">定制</option>
            </select>
            <select value={formData.difficulty} onChange={e => setFormData(p => ({...p, difficulty: e.target.value}))}
              className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm">
              <option value="beginner">入门</option><option value="intermediate">进阶</option><option value="advanced">高级</option>
            </select>
            <input type="number" placeholder="时长(小时)" value={formData.duration_hours} onChange={e => setFormData(p => ({...p, duration_hours: parseInt(e.target.value) || 0}))}
              className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" />
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input type="checkbox" checked={formData.is_published} onChange={e => setFormData(p => ({...p, is_published: e.target.checked}))} className="rounded" />
              发布
            </label>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? '保存中...' : '保存'}
          </button>
        </div>
      )}

      {/* 课程列表 */}
      <div className="space-y-3">
        {courses.map(course => (
          <div key={course.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{course.code}</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">{course.title}</h4>
                <p className="text-xs text-slate-500">{course.total_lessons} 课时 · {course.duration_hours}h · {course.category}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${course.is_published ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                {course.is_published ? '已发布' : '草稿'}
              </span>
              <button onClick={() => startEdit(course)} className="text-slate-500 hover:text-blue-400 transition"><Edit className="w-4 h-4" /></button>
              <button onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)} className="text-slate-500 hover:text-white transition">
                {expandedCourse === course.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* 展开：添加课时 */}
            {expandedCourse === course.id && (
              <div className="border-t border-slate-700/50 p-4 bg-slate-900/30">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-400">课时列表</p>
                  <button onClick={() => setLessonForm({ course_id: course.id, title: '', description: '', content_type: 'text', content_text: '', duration_minutes: 30, sort_order: (course.total_lessons || 0) + 1 })}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"><Plus className="w-3 h-3" /> 添加课时</button>
                </div>

                {lessonForm && lessonForm.course_id === course.id && (
                  <div className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-3 mb-3 space-y-2">
                    <input placeholder="课时标题" value={lessonForm.title} onChange={e => setLessonForm(p => ({...p, title: e.target.value}))}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-white text-sm" />
                    <textarea placeholder="课时内容" value={lessonForm.content_text || ''} onChange={e => setLessonForm(p => ({...p, content_text: e.target.value}))} rows={3}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-white text-sm" />
                    <div className="flex gap-2">
                      <input type="number" placeholder="时长(分钟)" value={lessonForm.duration_minutes} onChange={e => setLessonForm(p => ({...p, duration_minutes: parseInt(e.target.value) || 0}))}
                        className="w-32 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-white text-sm" />
                      <button onClick={handleSaveLesson} className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">保存</button>
                      <button onClick={() => setLessonForm(null)} className="px-4 py-2 bg-slate-700 text-white rounded text-sm hover:bg-slate-600">取消</button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-600">
                  共 {course.total_lessons} 个课时 — 在课程详情页可查看完整列表
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


// ============ 题库管理面板 ============
function QuestionsPanel({ courses }) {
  const [selectedCode, setSelectedCode] = useState(courses[0]?.code || '');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    module_code: '', question_text: '', question_type: 'single_choice',
    options: [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }],
    correct_answer: 'A', explanation: '', difficulty: 1, sort_order: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedCode) loadQuestions();
  }, [selectedCode]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await trainingAPI.admin.getQuestions(selectedCode);
      setQuestions(data);
    } catch (err) {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestion = async () => {
    if (!formData.question_text) { setError('题目内容必填'); return; }
    const validOptions = formData.options.filter(o => o.text.trim());
    if (validOptions.length < 2) { setError('至少需要2个选项'); return; }

    try {
      setError('');
      await trainingAPI.admin.createQuestion({
        ...formData,
        module_code: selectedCode,
        options: validOptions
      });
      setShowForm(false);
      setFormData({
        module_code: '', question_text: '', question_type: 'single_choice',
        options: [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }],
        correct_answer: 'A', explanation: '', difficulty: 1, sort_order: questions.length + 1
      });
      loadQuestions();
    } catch (err) {
      setError(err.response?.data?.detail || '保存失败');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确认删除该题目？')) return;
    try {
      await trainingAPI.admin.deleteQuestion(id);
      loadQuestions();
    } catch (err) {
      console.error('删除失败:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* 课程选择 */}
      <div className="flex items-center gap-4">
        <select value={selectedCode} onChange={e => setSelectedCode(e.target.value)}
          className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm">
          {courses.map(c => (
            <option key={c.code} value={c.code}>{c.code} - {c.title}</option>
          ))}
        </select>
        <span className="text-sm text-slate-500">{questions.length} 道题</span>
        <button onClick={() => { setShowForm(true); setFormData(p => ({...p, sort_order: questions.length + 1})); }}
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> 添加题目
        </button>
      </div>

      {/* 新建题目表单 */}
      {showForm && (
        <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium">新建题目</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <textarea placeholder="题目内容" value={formData.question_text} onChange={e => setFormData(p => ({...p, question_text: e.target.value}))} rows={2}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" />

          {/* 选项 */}
          <div className="space-y-2">
            {formData.options.map((opt, i) => (
              <div key={opt.key} className="flex items-center gap-2">
                <span className="text-sm text-slate-500 w-6">{opt.key}.</span>
                <input placeholder={`选项 ${opt.key}`} value={opt.text}
                  onChange={e => {
                    const newOpts = [...formData.options];
                    newOpts[i].text = e.target.value;
                    setFormData(p => ({...p, options: newOpts}));
                  }}
                  className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-white text-sm" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1">正确答案</label>
              <select value={formData.correct_answer} onChange={e => setFormData(p => ({...p, correct_answer: e.target.value}))}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-white text-sm">
                <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">难度</label>
              <select value={formData.difficulty} onChange={e => setFormData(p => ({...p, difficulty: parseInt(e.target.value)}))}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-white text-sm">
                <option value={1}>简单</option><option value={2}>中等</option><option value={3}>困难</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">排序</label>
              <input type="number" value={formData.sort_order} onChange={e => setFormData(p => ({...p, sort_order: parseInt(e.target.value) || 0}))}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-white text-sm" />
            </div>
          </div>

          <input placeholder="解析说明（选填）" value={formData.explanation} onChange={e => setFormData(p => ({...p, explanation: e.target.value}))}
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-sm" />

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={handleSaveQuestion} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm">
            <Save className="w-4 h-4" /> 保存题目
          </button>
        </div>
      )}

      {/* 题目列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>该课程暂无题目</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-white text-sm mb-2">{q.question_text}</p>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {q.options.map(opt => (
                      <span key={opt.key} className={`text-xs px-2 py-1 rounded ${
                        q.correct_answer === opt.key
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-slate-900/30 text-slate-500'
                      }`}>
                        {opt.key}. {opt.text}
                      </span>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-xs text-slate-600">解析: {q.explanation}</p>
                  )}
                </div>
                <button onClick={() => handleDelete(q.id)} className="text-slate-600 hover:text-red-400 transition flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
