import React, { useState, useEffect } from 'react';
import {
  GraduationCap, BookOpen, FileText, Plus, Edit, Trash2, Save,
  X, BarChart3, ChevronDown, ChevronUp
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

  useEffect(() => { loadData(); }, []);
  const loadData = async () => {
    try {
      setLoading(true);
      const [s, c] = await Promise.all([trainingAPI.admin.getStats().catch(() => null), trainingAPI.getCourses()]);
      setStats(s); setCourses(c);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 rounded-full bg-blue-500" />
          <span className="text-xs font-semibold tracking-widest text-blue-400/80 uppercase">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-1">培训管理</h1>
      </div>

      <div className="flex gap-1 bg-slate-900/40 p-1 rounded-xl border border-slate-700/30 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key ? 'bg-blue-500/15 text-blue-400' : 'text-slate-500 hover:text-slate-300'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
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

function StatsPanel({ stats }) {
  if (!stats) return <p className="text-slate-600 text-sm">暂无统计数据</p>;
  const cards = [
    { label: '课程总数', value: stats.courses?.total || 0, sub: `${stats.courses?.published || 0} 已发布`, color: 'text-blue-400' },
    { label: '报名人次', value: stats.enrollments || 0, color: 'text-emerald-400' },
    { label: '考试次数', value: stats.exams?.total || 0, sub: `${stats.exams?.passed || 0} 通过`, color: 'text-amber-400' },
    { label: '通过率', value: `${stats.pass_rate || 0}%`, color: 'text-cyan-400' },
    { label: '证书颁发', value: stats.certificates || 0, color: 'text-violet-400' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((c, i) => (
        <div key={i} className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-4">
          <p className="text-[11px] text-slate-600 uppercase tracking-wider font-medium">{c.label}</p>
          <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          {c.sub && <p className="text-[10px] text-slate-700 mt-0.5">{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}

function CoursesPanel({ courses, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ code: '', title: '', description: '', category: 'uflpa', difficulty: 'beginner', duration_hours: 0, is_published: false, sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [lessonForm, setLessonForm] = useState(null);

  const resetForm = () => { setFormData({ code: '', title: '', description: '', category: 'uflpa', difficulty: 'beginner', duration_hours: 0, is_published: false, sort_order: 0 }); setEditingId(null); setShowForm(false); setError(''); };

  const startEdit = (c) => {
    setFormData({ code: c.code, title: c.title, description: c.description || '', category: c.category || 'uflpa', difficulty: c.difficulty || 'beginner', duration_hours: c.duration_hours || 0, is_published: c.is_published, sort_order: c.sort_order || 0 });
    setEditingId(c.id); setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.title) { setError('课程代码和标题必填'); return; }
    try {
      setSaving(true); setError('');
      editingId ? await trainingAPI.admin.updateCourse(editingId, formData) : await trainingAPI.admin.createCourse(formData);
      resetForm(); onRefresh();
    } catch (err) { setError(err.response?.data?.detail || '保存失败'); } finally { setSaving(false); }
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title) return;
    try { await trainingAPI.admin.createLesson(lessonForm); setLessonForm(null); onRefresh(); }
    catch (err) { setError(err.response?.data?.detail || '保存课时失败'); }
  };

  const inputCls = "px-3 py-2 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40 transition";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-500 transition flex items-center gap-2">
          <Plus className="w-4 h-4" /> 新建课程
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900/60 border border-blue-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium text-sm">{editingId ? '编辑课程' : '新建课程'}</h3>
            <button onClick={resetForm} className="text-slate-600 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input placeholder="课程代码 (如 M7)" value={formData.code} onChange={e => setFormData(p => ({...p, code: e.target.value}))} className={inputCls} disabled={!!editingId} />
            <input placeholder="课程标题" value={formData.title} onChange={e => setFormData(p => ({...p, title: e.target.value}))} className={`${inputCls} md:col-span-2`} />
          </div>
          <textarea placeholder="课程描述" value={formData.description} onChange={e => setFormData(p => ({...p, description: e.target.value}))} rows={2} className={`w-full ${inputCls}`} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={formData.category} onChange={e => setFormData(p => ({...p, category: e.target.value}))} className={inputCls}>
              <option value="uflpa">UFLPA</option><option value="cbp">CBP</option><option value="audit">审计</option><option value="ai">AI</option><option value="custom">定制</option>
            </select>
            <select value={formData.difficulty} onChange={e => setFormData(p => ({...p, difficulty: e.target.value}))} className={inputCls}>
              <option value="beginner">入门</option><option value="intermediate">进阶</option><option value="advanced">高级</option>
            </select>
            <input type="number" placeholder="时长(h)" value={formData.duration_hours} onChange={e => setFormData(p => ({...p, duration_hours: parseInt(e.target.value) || 0}))} className={inputCls} />
            <label className="flex items-center gap-2 text-sm text-slate-400 px-3">
              <input type="checkbox" checked={formData.is_published} onChange={e => setFormData(p => ({...p, is_published: e.target.checked}))} className="rounded border-slate-600" /> 发布
            </label>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-500 transition flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? '保存中...' : '保存'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {courses.map(course => (
          <div key={course.id} className="bg-slate-900/60 border border-slate-700/40 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-4">
              <span className="text-[10px] font-bold tracking-wider text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">{course.code}</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-sm font-medium truncate">{course.title}</h4>
                <p className="text-[11px] text-slate-600">{course.total_lessons} 课时 · {course.duration_hours}h · {course.category}</p>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded-lg font-medium ${course.is_published ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-slate-800 text-slate-500'}`}>
                {course.is_published ? '已发布' : '草稿'}
              </span>
              <button onClick={() => startEdit(course)} className="text-slate-600 hover:text-blue-400 transition"><Edit className="w-4 h-4" /></button>
              <button onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)} className="text-slate-600 hover:text-white transition">
                {expandedCourse === course.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            {expandedCourse === course.id && (
              <div className="border-t border-slate-800/60 px-5 py-4 bg-slate-950/20">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-500">课时管理</p>
                  <button onClick={() => setLessonForm({ course_id: course.id, title: '', description: '', content_type: 'text', content_text: '', duration_minutes: 30, sort_order: (course.total_lessons || 0) + 1 })}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"><Plus className="w-3 h-3" /> 添加课时</button>
                </div>
                {lessonForm && lessonForm.course_id === course.id && (
                  <div className="bg-slate-900/60 border border-blue-500/15 rounded-xl p-3 mb-3 space-y-2">
                    <input placeholder="课时标题" value={lessonForm.title} onChange={e => setLessonForm(p => ({...p, title: e.target.value}))} className={`w-full ${inputCls}`} />
                    <textarea placeholder="内容" value={lessonForm.content_text || ''} onChange={e => setLessonForm(p => ({...p, content_text: e.target.value}))} rows={3} className={`w-full ${inputCls}`} />
                    <div className="flex gap-2">
                      <input type="number" placeholder="时长(分)" value={lessonForm.duration_minutes} onChange={e => setLessonForm(p => ({...p, duration_minutes: parseInt(e.target.value) || 0}))} className={`w-28 ${inputCls}`} />
                      <button onClick={handleSaveLesson} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs hover:bg-blue-500">保存</button>
                      <button onClick={() => setLessonForm(null)} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs hover:bg-slate-700">取消</button>
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-slate-700">共 {course.total_lessons} 个课时</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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

  useEffect(() => { if (selectedCode) loadQ(); }, [selectedCode]);
  const loadQ = async () => {
    try { setLoading(true); const d = await trainingAPI.admin.getQuestions(selectedCode); setQuestions(d); }
    catch { setQuestions([]); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!formData.question_text) { setError('题目必填'); return; }
    const valid = formData.options.filter(o => o.text.trim());
    if (valid.length < 2) { setError('至少2个选项'); return; }
    try {
      setError(''); await trainingAPI.admin.createQuestion({ ...formData, module_code: selectedCode, options: valid });
      setShowForm(false);
      setFormData({ module_code: '', question_text: '', question_type: 'single_choice', options: [{ key: 'A', text: '' }, { key: 'B', text: '' }, { key: 'C', text: '' }, { key: 'D', text: '' }], correct_answer: 'A', explanation: '', difficulty: 1, sort_order: questions.length + 1 });
      loadQ();
    } catch (err) { setError(err.response?.data?.detail || '保存失败'); }
  };

  const handleDelete = async (id) => { if (!window.confirm('确认删除？')) return; try { await trainingAPI.admin.deleteQuestion(id); loadQ(); } catch {} };

  const inputCls = "px-3 py-2 bg-slate-950/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/40 transition";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <select value={selectedCode} onChange={e => setSelectedCode(e.target.value)} className={`${inputCls} min-w-[240px]`}>
          {courses.map(c => <option key={c.code} value={c.code}>{c.code} - {c.title}</option>)}
        </select>
        <span className="text-xs text-slate-600">{questions.length} 道题</span>
        <button onClick={() => { setShowForm(true); setFormData(p => ({...p, sort_order: questions.length + 1})); }}
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-500 transition flex items-center gap-2">
          <Plus className="w-4 h-4" /> 添加题目
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900/60 border border-blue-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium text-sm">新建题目</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-600 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <textarea placeholder="题目内容" value={formData.question_text} onChange={e => setFormData(p => ({...p, question_text: e.target.value}))} rows={2} className={`w-full ${inputCls}`} />
          <div className="space-y-2">
            {formData.options.map((opt, i) => (
              <div key={opt.key} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 w-5 font-medium">{opt.key}.</span>
                <input placeholder={`选项 ${opt.key}`} value={opt.text} onChange={e => { const o = [...formData.options]; o[i].text = e.target.value; setFormData(p => ({...p, options: o})); }} className={`flex-1 ${inputCls}`} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-[10px] text-slate-600 block mb-1 uppercase tracking-wider">正确答案</label>
              <select value={formData.correct_answer} onChange={e => setFormData(p => ({...p, correct_answer: e.target.value}))} className={`w-full ${inputCls}`}>
                <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></div>
            <div><label className="text-[10px] text-slate-600 block mb-1 uppercase tracking-wider">难度</label>
              <select value={formData.difficulty} onChange={e => setFormData(p => ({...p, difficulty: parseInt(e.target.value)}))} className={`w-full ${inputCls}`}>
                <option value={1}>简单</option><option value={2}>中等</option><option value={3}>困难</option></select></div>
            <div><label className="text-[10px] text-slate-600 block mb-1 uppercase tracking-wider">排序</label>
              <input type="number" value={formData.sort_order} onChange={e => setFormData(p => ({...p, sort_order: parseInt(e.target.value) || 0}))} className={`w-full ${inputCls}`} /></div>
          </div>
          <input placeholder="解析（选填）" value={formData.explanation} onChange={e => setFormData(p => ({...p, explanation: e.target.value}))} className={`w-full ${inputCls}`} />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-500 transition flex items-center gap-2"><Save className="w-4 h-4" /> 保存</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 text-slate-600"><FileText className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">暂无题目</p></div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-slate-900/60 border border-slate-700/40 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-[10px] font-bold ring-1 ring-blue-500/20">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-white text-sm mb-2">{q.question_text}</p>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {q.options.map(opt => (
                      <span key={opt.key} className={`text-[11px] px-2 py-1 rounded-lg ${q.correct_answer === opt.key ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-slate-950/30 text-slate-600'}`}>
                        {opt.key}. {opt.text}
                      </span>
                    ))}
                  </div>
                  {q.explanation && <p className="text-[11px] text-slate-700">解析: {q.explanation}</p>}
                </div>
                <button onClick={() => handleDelete(q.id)} className="text-slate-700 hover:text-red-400 transition flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
