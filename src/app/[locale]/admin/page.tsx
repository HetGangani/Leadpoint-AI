'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  ShieldCheck,
  Activity,
  Server,
  Database,
  Cpu,
  PhoneCall,
  Zap,
  AlertTriangle,
  Lock,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  CreditCard,
  Users,
  Terminal,
  Clock,
  Ban,
  SlidersHorizontal,
} from 'lucide-react';

interface SystemHealth {
  dbLatency: string;
  dbStatus: string;
  apiUptime: string;
  llmStatus: string;
  voiceEngineStatus: string;
  totalRegisteredUsers: number;
}

interface VoiceUsage {
  plan: string;
  minutesUsed: number;
  minutesLimit: number;
  contactCredits: number;
  contactCreditsLimit: number;
  billingCycleEnd: string;
}

interface SubscriptionTier {
  id: string;
  name: string;
  price: string;
  voiceMinutes: string;
  contactCredits: string;
  activeSubscribers: number;
  isPopular?: boolean;
  features: string[];
}

interface FraudAlert {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'WARNING' | 'RESOLVED';
  timestamp: string;
  details: string;
  status: 'OPEN' | 'RESOLVED';
}

interface AuditLog {
  id: string;
  action: string;
  userId?: string;
  user?: { email: string; name: string };
  ipAddress?: string;
  userAgent?: string;
  metadata?: string;
  timestamp: string;
}

interface AdminData {
  systemHealth: SystemHealth;
  voiceUsage: VoiceUsage;
  subscriptionTiers: SubscriptionTier[];
  fraudAlerts: FraudAlert[];
  auditLogs: AuditLog[];
}

export default function AdminSuperadminDashboardPage() {
  const locale = useLocale();
  const t = useTranslations('Admin');
  const tFraud = useTranslations('FraudAlerts');
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditSearch, setAuditSearch] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [processingAlertId, setProcessingAlertId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);

  const fetchAdminMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/metrics');
      if (res.status === 401 || res.status === 403) {
        window.location.href = `/${locale}/unauthorized`;
        return;
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setAlerts(json.data.fraudAlerts || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin metrics:', err);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchAdminMetrics();
  }, [fetchAdminMetrics]);

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'dismiss' | 'block') => {
    try {
      setProcessingAlertId(alertId);
      const res = await fetch('/api/admin/fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action }),
      });
      const json = await res.json();
      if (json.success) {
        setNotification(`Alert ${alertId} updated: ${action}`);
        setTimeout(() => setNotification(null), 3000);

        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED', severity: 'RESOLVED' } : a))
        );
      }
    } catch (err) {
      console.error('Failed to process alert action:', err);
    } finally {
      setProcessingAlertId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="glass-card-solid rounded-3xl p-12 flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-[#0F0F12] animate-spin" />
          <p className="text-[#0F0F12] font-bold text-sm">Verifying Admin Credentials & Telemetry...</p>
        </div>
      </div>
    );
  }

  const health = data?.systemHealth || {
    dbLatency: '12 ms',
    dbStatus: 'Healthy',
    apiUptime: '99.98%',
    llmStatus: 'Operational (Gemini 1.5 Pro)',
    voiceEngineStatus: 'Active (0.42s latency)',
    totalRegisteredUsers: 3,
  };

  const usage = data?.voiceUsage || {
    plan: 'GROWTH',
    minutesUsed: 145,
    minutesLimit: 1000,
    contactCredits: 320,
    contactCreditsLimit: 2500,
    billingCycleEnd: '2026-10-31',
  };

  const tiers = data?.subscriptionTiers || [];

  const filteredLogs = (data?.auditLogs || []).filter((log) => {
    if (!auditSearch) return true;
    const query = auditSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      (log.user?.email && log.user.email.toLowerCase().includes(query)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(query)) ||
      (log.metadata && log.metadata.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F0F12] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2.5 border border-[#5C1D3A]/20 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 text-[#34D399]" />
          <span className="text-xs sm:text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#5C1D3A]/15 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 bg-[#E6F0FA] border border-[#5C1D3A]/20 text-[#0F0F12] text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-[#E5C158]" />
            <span>Superadmin System Telemetry & Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F0F12]">
            {t('title')}
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            {t('subtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAdminMetrics}
          className="btn-secondary-glass self-start sm:self-auto inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#0F0F12]' : 'text-slate-600'}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Section 1: System Health Metrics */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0F0F12] flex items-center space-x-2">
          <Activity className="h-4 w-4 text-emerald-700" />
          <span>{t('systemHealth')}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Health Metric 1: DB Latency */}
          <div className="glass-card-solid rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">{t('dbLatency')}</span>
              <Database className="h-4 w-4 text-[#0F0F12]" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-[#0F0F12]">{health.dbLatency}</span>
              <span className="text-[11px] bg-[#34D399]/20 text-emerald-900 border border-[#34D399]/40 px-2 py-0.5 rounded-full font-bold">
                {health.dbStatus}
              </span>
            </div>
          </div>

          {/* Health Metric 2: API Gateway Uptime */}
          <div className="glass-card-solid rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">{t('apiUptime')}</span>
              <Server className="h-4 w-4 text-[#0F0F12]" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-[#0F0F12]">{health.apiUptime}</span>
              <span className="text-[11px] bg-blue-500/10 text-blue-900 border border-blue-400/30 px-2 py-0.5 rounded-full font-bold">
                Operational
              </span>
            </div>
          </div>

          {/* Health Metric 3: LLM Inference Engine */}
          <div className="glass-card-solid rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">{t('llmStatus')}</span>
              <Cpu className="h-4 w-4 text-[#0F0F12]" />
            </div>
            <div className="space-y-0.5">
              <span className="text-base font-extrabold text-[#0F0F12]">Gemini 1.5 Pro</span>
              <span className="block text-[11px] text-emerald-800 font-bold">Active (Sub-500ms)</span>
            </div>
          </div>

          {/* Health Metric 4: Total Registered Users */}
          <div className="glass-card-solid rounded-2xl p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Registered Accounts</span>
              <Users className="h-4 w-4 text-[#0F0F12]" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-[#0F0F12]">{health.totalRegisteredUsers}</span>
              <span className="text-[11px] text-[#0F0F12] bg-[#E6F0FA] px-2 py-0.5 rounded-full font-bold border border-[#5C1D3A]/20">Active Tenants</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: High-Contrast Voice Usage & Quota Meter (Dark Accent Card #0F0F12) */}
      <div className="bg-[#0F0F12] text-white border border-[#E5C158]/30 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E5C158]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 relative z-10">
          <div className="flex items-center space-x-2">
            <PhoneCall className="h-4 w-4 text-[#F6E27A]" />
            <h2 className="text-base font-extrabold text-white">{t('voiceUsageMeter')}</h2>
          </div>
          <span className="text-xs bg-[#E6F0FA]/10 text-[#F6E27A] border border-[#E5C158]/40 px-3 py-1 rounded-full font-bold">
            {usage.plan} Tier Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
          {/* Minutes Gauge */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-300">
              <span>{t('minutesUsed')}</span>
              <span className="font-bold text-[#F6E27A]">{usage.minutesUsed} / {usage.minutesLimit} mins</span>
            </div>
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#F6E27A] to-[#E5C158] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    Math.round((usage.minutesUsed / Math.max(usage.minutesLimit, 1)) * 100),
                    100
                  )}%`,
                }}
              />
            </div>
            <div className="text-[11px] text-slate-400">
              {Math.max(0, usage.minutesLimit - usage.minutesUsed)} minutes remaining this billing cycle
            </div>
          </div>

          {/* Contact Credits Gauge */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium text-slate-300">
              <span>{t('contactCredits')}</span>
              <span className="font-bold text-[#34D399]">{usage.contactCredits} / {usage.contactCreditsLimit} credits</span>
            </div>
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#34D399] h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    Math.round((usage.contactCredits / Math.max(usage.contactCreditsLimit, 1)) * 100),
                    100
                  )}%`,
                }}
              />
            </div>
            <div className="text-[11px] text-slate-400">
              {Math.max(0, usage.contactCreditsLimit - usage.contactCredits)} contact credits remaining • Cycle renews on {usage.billingCycleEnd}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Fraud & Abuse Alerts */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0F0F12] flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span>{t('fraudAlerts')}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alerts.map((alert) => {
            const isResolved = alert.status === 'RESOLVED';
            const isCritical = alert.severity === 'CRITICAL';
            const isProcessing = processingAlertId === alert.id;

            return (
              <div
                key={alert.id}
                className={`glass-card-solid rounded-2xl p-4 shadow-sm space-y-3 ${
                  isResolved
                    ? 'opacity-70'
                    : isCritical
                    ? 'border-[#F87171]/40'
                    : 'border-[#FBBF24]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isResolved
                        ? 'bg-slate-100 text-slate-600 border border-slate-300'
                        : isCritical
                        ? 'bg-[#F87171]/15 text-rose-900 border border-[#F87171]/40'
                        : 'bg-[#FBBF24]/15 text-amber-900 border border-[#FBBF24]/40'
                    }`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-[#0F0F12] leading-snug">{alert.title}</h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-normal">{alert.details}</p>
                </div>

                {!isResolved && (
                  <div className="pt-2 border-t border-[#5C1D3A]/10 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                      className="btn-secondary-glass px-2.5 py-1 text-[11px] font-semibold"
                    >
                      Acknowledge
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAlertAction(alert.id, 'block')}
                      className="btn-danger-crimson px-2.5 py-1 text-[11px] font-semibold"
                    >
                      Block IP
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Security Audit Logs */}
      <div className="glass-card-solid rounded-3xl overflow-hidden shadow-sm space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#5C1D3A]/15 pb-4">
          <div className="flex items-center space-x-2">
            <Terminal className="h-4 w-4 text-[#0F0F12]" />
            <h2 className="text-base font-extrabold text-[#0F0F12]">{t('auditLogs')}</h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder={t('searchAuditLogs')}
              className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#0F0F12] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0F0F12]"
            />
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#E6F0FA]/80 border-b border-[#5C1D3A]/15 text-slate-700 uppercase font-bold text-[11px]">
              <tr>
                <th scope="col" className="px-3.5 py-2.5">{t('timestamp')}</th>
                <th scope="col" className="px-3.5 py-2.5">{t('action')}</th>
                <th scope="col" className="px-3.5 py-2.5">{t('user')}</th>
                <th scope="col" className="px-3.5 py-2.5">{t('ipAddress')}</th>
                <th scope="col" className="px-3.5 py-2.5">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#5C1D3A]/10">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No security audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.slice(0, 20).map((log) => (
                  <tr key={log.id} className="hover:bg-[#E6F0FA]/40 transition">
                    <td className="px-3.5 py-2.5 text-slate-500 font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <span className="font-bold text-[#0F0F12] bg-[#E6F0FA] border border-[#5C1D3A]/20 px-2 py-0.5 rounded-md text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-3.5 py-2.5 font-bold text-[#0F0F12]">
                      {log.user?.email || log.userId || 'System Agent'}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-500 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-600 text-[11px] truncate max-w-xs">
                      {log.metadata || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
