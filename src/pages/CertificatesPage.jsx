import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, Calendar, Shield, ShieldCheck, ShieldX, Copy, Check } from 'lucide-react';
import { trainingAPI } from '../services/api';

export default function CertificatesPage() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => { loadCerts(); }, []);

  const loadCerts = async () => {
    try { setLoading(true); const d = await trainingAPI.getCertificates(); setCertificates(d); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const copyNumber = (n) => { navigator.clipboard.writeText(n); setCopiedId(n); setTimeout(() => setCopiedId(null), 2000); };
  const isExpired = (d) => d ? new Date(d) < new Date() : false;

  if (loading) return <div className="flex items-center justify-center py-24"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 pb-8">
      <button onClick={() => navigate('/training')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition"><ArrowLeft className="w-4 h-4" /> 返回培训中心</button>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 rounded-full bg-amber-500" />
            <span className="text-xs font-semibold tracking-widest text-amber-400/80 uppercase">Certificates</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">我的证书</h1>
        </div>
        <span className="text-xs text-slate-600 bg-slate-800/50 px-3 py-1.5 rounded-lg">{certificates.length} 张证书</span>
      </div>

      {certificates.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/60 border border-slate-700/40 rounded-2xl">
          <Award className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 text-base mb-1">暂无证书</p>
          <p className="text-slate-600 text-sm">完成课程并通过考试即可获得</p>
          <button onClick={() => navigate('/training')} className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-500 transition">开始学习</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {certificates.map(cert => {
            const expired = isExpired(cert.valid_until);
            return (
              <div key={cert.id} className={`bg-slate-900/60 border rounded-2xl overflow-hidden ${expired ? 'border-red-500/30' : 'border-amber-500/25'}`}>
                <div className={`h-[2px] ${expired ? 'bg-red-500/60' : 'bg-gradient-to-r from-amber-500 to-yellow-400'}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {expired ? <ShieldX className="w-9 h-9 text-red-400/60" /> : <ShieldCheck className="w-9 h-9 text-amber-400" />}
                      <div>
                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${expired ? 'text-red-400' : 'text-amber-400'}`}>{expired ? '已过期' : '有效'}</p>
                        <h3 className="text-white font-semibold text-sm">{cert.course_title || '培训证书'}</h3>
                      </div>
                    </div>
                    {cert.exam_score && <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg ring-1 ring-emerald-500/20">{cert.exam_score} 分</span>}
                  </div>

                  <div className="bg-slate-950/40 rounded-xl p-3 mb-4">
                    <p className="text-[10px] text-slate-600 mb-1 uppercase tracking-wider">证书编号</p>
                    <div className="flex items-center justify-between">
                      <code className="text-xs text-amber-400 font-mono">{cert.certificate_number}</code>
                      <button onClick={() => copyNumber(cert.certificate_number)} className="text-slate-600 hover:text-white transition">
                        {copiedId === cert.certificate_number ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-[11px] text-slate-600">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />颁发: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('zh-CN') : '-'}</span>
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" />有效至: {cert.valid_until ? new Date(cert.valid_until).toLocaleDateString('zh-CN') : '永久'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
