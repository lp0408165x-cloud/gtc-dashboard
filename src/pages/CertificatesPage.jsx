aimport React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Award, Calendar, Shield, ShieldCheck, ShieldX, ExternalLink, Copy, Check
} from 'lucide-react';
import { trainingAPI } from '../services/api';

export default function CertificatesPage() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const data = await trainingAPI.getCertificates();
      setCertificates(data);
    } catch (err) {
      console.error('加载证书失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyNumber = (certNumber) => {
    navigator.clipboard.writeText(certNumber);
    setCopiedId(certNumber);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isExpired = (validUntil) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/training')} className="flex items-center gap-2 text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> 返回培训中心
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Award className="w-7 h-7 text-amber-400" />
          我的证书
        </h1>
        <span className="text-sm text-slate-500">{certificates.length} 张证书</span>
      </div>

      {certificates.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <Award className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg mb-2">暂无证书</p>
          <p className="text-slate-500 text-sm">完成课程学习并通过考试即可获得证书</p>
          <button
            onClick={() => navigate('/training')}
            className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            开始学习
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {certificates.map(cert => {
            const expired = isExpired(cert.valid_until);
            return (
              <div
                key={cert.id}
                className={`bg-slate-800/50 border rounded-xl overflow-hidden ${
                  expired ? 'border-red-500/30' : 'border-amber-500/30'
                }`}
              >
                {/* 顶部装饰 */}
                <div className={`h-1.5 ${expired ? 'bg-red-500' : 'bg-gradient-to-r from-amber-500 to-yellow-500'}`} />

                <div className="p-6">
                  {/* 证书图标和状态 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {expired ? (
                        <ShieldX className="w-10 h-10 text-red-400" />
                      ) : (
                        <ShieldCheck className="w-10 h-10 text-amber-400" />
                      )}
                      <div>
                        <p className={`text-xs font-medium ${expired ? 'text-red-400' : 'text-amber-400'}`}>
                          {expired ? '已过期' : '有效'}
                        </p>
                        <h3 className="text-white font-semibold">{cert.course_title || '培训证书'}</h3>
                      </div>
                    </div>
                    {cert.exam_score && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        考试 {cert.exam_score} 分
                      </span>
                    )}
                  </div>

                  {/* 证书编号 */}
                  <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-slate-500 mb-1">证书编号</p>
                    <div className="flex items-center justify-between">
                      <code className="text-sm text-amber-400 font-mono">{cert.certificate_number}</code>
                      <button
                        onClick={() => copyNumber(cert.certificate_number)}
                        className="text-slate-500 hover:text-white transition"
                      >
                        {copiedId === cert.certificate_number ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 日期 */}
                  <div className="flex items-center gap-6 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      颁发: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('zh-CN') : '-'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      有效至: {cert.valid_until ? new Date(cert.valid_until).toLocaleDateString('zh-CN') : '永久'}
                    </span>
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
