import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AdapterCredits {
  sms_balance: number;
  email_daily_sent: number;
  email_daily_limit: number;
  whatsapp_session_count: number;
  notification_deliveries_today: number;
}

interface Telemetry {
  total_institutions: number;
  total_branches: number;
  total_active_students: number;
  total_hifz_students: number;
  total_residential_students: number;
  total_teachers: number;
  total_staff: number;
  total_payroll_profiles: number;
  payroll_pending_approval: number;
  total_outstanding_dues: number;
  total_collected_this_month: number;
  sqlite_storage_bytes: number;
  sqlite_page_count?: number;
  adapter_credits: AdapterCredits;
  generated_at: string;
  uptime_ms: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

const MetricCard: React.FC<{ icon: string; label: string; value: string | number; sub?: string; color?: string }> = ({
  icon, label, value, sub, color = 'text-emerald-400',
}) => (
  <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 hover:border-emerald-500 transition-colors">
    <div className="flex items-center gap-3 mb-3">
      <span className="text-2xl">{icon}</span>
      <span className="text-gray-400 text-sm font-medium">{label}</span>
    </div>
    <div className={`text-3xl font-bold ${color}`}>{value}</div>
    {sub && <div className="text-gray-500 text-xs mt-1">{sub}</div>}
  </div>
);

export const SuperAdminDashboard: React.FC = () => {
  const { apiCall } = useAuth();
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    try {
      const data = await apiCall<Telemetry>('/api/v1/telemetry');
      setTelemetry(data);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Telemetry fetch failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-400" />
      </div>
    );
  }

  if (error || !telemetry) {
    return (
      <div className="bg-red-900/20 border border-red-700 rounded-2xl p-6 text-red-400">
        <p className="font-bold">⚠️ Telemetry Error</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const emailUsagePct = Math.round(
    (telemetry.adapter_credits.email_daily_sent / telemetry.adapter_credits.email_daily_limit) * 100
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🌐 সুপার অ্যাডমিন ড্যাশবোর্ড</h1>
          <p className="text-gray-400 text-sm mt-1">প্ল্যাটফর্ম টেলিমেট্রি — কোনো ব্যক্তিগত তথ্য নেই (Zero PII)</p>
        </div>
        <div className="text-right">
          <div className="text-emerald-400 text-sm font-mono">⏱ Uptime: {formatUptime(telemetry.uptime_ms)}</div>
          <div className="text-gray-500 text-xs">{new Date(telemetry.generated_at).toLocaleString('bn-BD')}</div>
          <button
            onClick={fetchTelemetry}
            className="mt-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-lg transition"
          >
            🔄 রিফ্রেশ
          </button>
        </div>
      </div>

      {/* Institution Grid */}
      <div>
        <h2 className="text-gray-300 font-semibold mb-3 text-sm uppercase tracking-wider">📊 প্রতিষ্ঠান সংখ্যা</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon="🏫" label="মোট প্রতিষ্ঠান" value={telemetry.total_institutions} />
          <MetricCard icon="🌿" label="শাখা" value={telemetry.total_branches} />
          <MetricCard icon="👨‍🎓" label="সক্রিয় শিক্ষার্থী" value={telemetry.total_active_students.toLocaleString('bn-BD')} color="text-blue-400" />
          <MetricCard icon="📖" label="হিফজ শিক্ষার্থী" value={telemetry.total_hifz_students} color="text-purple-400" />
        </div>
      </div>

      {/* Staff Grid */}
      <div>
        <h2 className="text-gray-300 font-semibold mb-3 text-sm uppercase tracking-wider">👥 জনবল</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon="🏠" label="আবাসিক শিক্ষার্থী" value={telemetry.total_residential_students} color="text-orange-400" />
          <MetricCard icon="🧕" label="উস্তাদ / শিক্ষক" value={telemetry.total_teachers} />
          <MetricCard icon="👔" label="কর্মকর্তা/কর্মচারী" value={telemetry.total_staff} />
          <MetricCard icon="📋" label="বেতন প্রোফাইল" value={telemetry.total_payroll_profiles} />
        </div>
      </div>

      {/* Finance Summary */}
      <div>
        <h2 className="text-gray-300 font-semibold mb-3 text-sm uppercase tracking-wider">💰 আর্থিক সারসংক্ষেপ (চলতি মাস)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            icon="✅"
            label="আদায় হয়েছে"
            value={`৳${telemetry.total_collected_this_month.toLocaleString('bn-BD')}`}
            color="text-emerald-400"
          />
          <MetricCard
            icon="⚠️"
            label="মোট বকেয়া"
            value={`৳${telemetry.total_outstanding_dues.toLocaleString('bn-BD')}`}
            color="text-red-400"
          />
          <MetricCard
            icon="🕐"
            label="পেরোল অনুমোদন বাকি"
            value={telemetry.payroll_pending_approval}
            color={telemetry.payroll_pending_approval > 0 ? 'text-yellow-400' : 'text-emerald-400'}
          />
        </div>
      </div>

      {/* Storage & Adapters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Storage */}
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <h3 className="text-gray-300 font-semibold mb-4 flex items-center gap-2">
            <span>💾</span> ডেটাবেজ সংরক্ষণ
          </h3>
          <div className="text-4xl font-bold text-cyan-400 mb-1">{formatBytes(telemetry.sqlite_storage_bytes)}</div>
          <p className="text-gray-500 text-sm">SQLite WAL Mode · {telemetry.sqlite_page_count?.toLocaleString() ?? '—'} পৃষ্ঠা</p>
          <div className="mt-3 bg-gray-700 rounded-full h-2">
            <div
              className="bg-cyan-400 h-2 rounded-full transition-all"
              style={{ width: `${Math.min((telemetry.sqlite_storage_bytes / (100 * 1024 * 1024)) * 100, 100).toFixed(0)}%` }}
            />
          </div>
          <p className="text-gray-600 text-xs mt-1">100 MB সীমার মধ্যে</p>
        </div>

        {/* Adapters */}
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
          <h3 className="text-gray-300 font-semibold mb-4 flex items-center gap-2">
            <span>📡</span> নোটিফিকেশন অ্যাডাপ্টার
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">📧 ইমেইল (আজ)</span>
              <span className="text-white font-mono">
                {telemetry.adapter_credits.email_daily_sent}/{telemetry.adapter_credits.email_daily_limit}
              </span>
            </div>
            <div className="bg-gray-700 rounded-full h-1.5">
              <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${emailUsagePct}%` }} />
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-400">📱 SMS ব্যালেন্স</span>
              <span className="text-yellow-400 font-mono">৳{telemetry.adapter_credits.sms_balance}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">💬 WhatsApp সেশন</span>
              <span className="text-green-400 font-mono">{telemetry.adapter_credits.whatsapp_session_count}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">🔔 নোটিফিকেশন (আজ)</span>
              <span className="text-emerald-400 font-mono">{telemetry.adapter_credits.notification_deliveries_today}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
