import { useState, useEffect } from 'react';
import { casesAPI } from '../services/api';
import { AlertTriangle, Clock, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DeadlineAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const cases = await casesAPI.list();
        const now = new Date();
        const upcoming = cases
          .filter(c => c.cbp_deadline && !['closed', 'approved'].includes(c.status))
          .map(c => {
            const deadline = new Date(c.cbp_deadline);
            const diffMs = deadline - now;
            const diffDays = Math.ceil(diffMs / 86400000);
            return { ...c, deadline, diffDays };
          })
          .filter(c => c.diffDays <= 7) // 7天内
          .sort((a, b) => a.diffDays - b.diffDays);
        setAlerts(upcoming);
      } catch {}
    };
    fetchAlerts();
  }, []);

  const visible = alerts.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map(alert => {
        const isOverdue = alert.diffDays < 0;
        const isUrgent = alert.diffDays <= 2 && alert.diffDays >= 0;
        const bgColor = isOverdue ? 'bg-red-50 border-red-300' : isUrgent ? 'bg-orange-50 border-orange-300' : 'bg-amber-50 border-amber-200';
        const textColor = isOverdue ? 'text-red-700' : isUrgent ? 'text-orange-700' : 'text-amber-700';
        const iconColor = isOverdue ? 'text-red-500' : isUrgent ? 'text-orange-500' : 'text-amber-500';

        return (
          <div key={alert.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${bgColor}`}>
            {isOverdue
              ? <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
              : <Clock className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
            }
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${textColor}`}>
                {isOverdue
                  ? `⚠️ 已逾期 ${Math.abs(alert.diffDays)} 天`
                  : alert.diffDays === 0
                  ? '🔴 今天截止！'
                  : `🟡 ${alert.diffDays} 天后截止`
                }
                {' — '}
                <span className="font-normal truncate">
                  {alert.case_title || `案件 #${alert.id}`}
                  {alert.case_number && ` (${alert.case_number})`}
                </span>
              </p>
              <p className={`text-xs ${textColor} opacity-80`}>
                CBP截止日期：{alert.deadline.toLocaleDateString('zh-CN')}
                {alert.case_type && ` · ${alert.case_type}`}
                {alert.port_of_entry && ` · ${alert.port_of_entry}`}
              </p>
            </div>
            <Link
              to={`/cases/${alert.id}`}
              className={`inline-flex items-center gap-1 text-xs font-medium ${textColor} hover:underline flex-shrink-0`}
            >
              查看 <ArrowRight className="w-3 h-3" />
            </Link>
            <button
              onClick={() => setDismissed(new Set([...dismissed, alert.id]))}
              className={`p-1 rounded hover:bg-black/10 flex-shrink-0 ${textColor}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default DeadlineAlerts;
