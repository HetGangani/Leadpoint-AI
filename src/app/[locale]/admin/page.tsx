'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('Admin');
  const tFraud = useTranslations('FraudAlerts');
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditSearch, setAuditSearch] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [processingAlertId, setProcessingAlertId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);

  const fetchAdminMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/metrics');
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
  };

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

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
        setNotification(`Alert ${alertId} ${action}d successfully`);
        setTimeout(() => setNotification(null), 3000);

        // Update local alerts state
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
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
          <p className="text-slate-400 font-medium text-sm">Initializing Superadmin Security Portal...</p>
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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-amber-400/30 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 text-white" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-full mb-3">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <span>Superadmin System Telemetry & Control Center</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {t('title')}
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            {t('subtitle')}
          </p>
        </div>

        <button
          onClick={fetchAdminMetrics}
          className="self-start md:self-auto inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:border-slate-600 text-sm font-medium transition shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh System Metrics</span>
        </button>
      </div>

      {/* Section 1: System Health Metrics */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          <span>{t('systemHealth')}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Health Metric 1: DB Latency */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase">{t('dbLatency')}</span>
              <Database className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-white tracking-tight">{health.dbLatency}</span>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
                {health.dbStatus}
              </span>
            </div>
          </div>

          {/* Health Metric 2: API Gateway Uptime */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase">{t('apiUptime')}</span>
              <Server className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-white tracking-tight">{health.apiUptime}</span>
              <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/20 font-medium">
                Operational
              </span>
            </div>
          </div>

          {/* Health Metric 3: LLM Status */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase">{t('llmStatus')}</span>
              <Cpu className="h-4 w-4 text-purple-400" />
            </div>
            <div className="space-y-1">
              <span className="text-lg font-bold text-white">{health.llmStatus}</span>
              <p className="text-xs text-slate-400">Gemini 1.5 Pro & Flash Online</p>
            </div>
          </div>

          {/* Health Metric 4: Voice Engine Latency */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase">{t('voiceEngine')}</span>
              <PhoneCall className="h-4 w-4 text-amber-400" />
            </div>
            <div className="space-y-1">
              <span className="text-lg font-bold text-white">{health.voiceEngineStatus}</span>
              <p className="text-xs text-slate-400">Retell API Webhook Registered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Voice Usage Meter & Allocation */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20 text-blue-400">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t('voiceUsageMeter')}</h3>
              <p className="text-xs text-slate-400">Current Plan: <span className="font-semibold text-blue-400">{usage.plan}</span></p>
            </div>
          </div>
          <span className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 self-start sm:self-auto">
            Billing Cycle Ends: {new Date(usage.billingCycleEnd).toLocaleDateString()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Voice Minutes Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline text-sm">
              <span className="text-slate-300 font-medium">{t('minutesUsed')}</span>
              <span className="font-mono font-bold text-white">
                {usage.minutesUsed} / {usage.minutesLimit} mins
              </span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-500"
                style={{
                  width: `${Math.min(Math.round((usage.minutesUsed / usage.minutesLimit) * 100), 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {usage.minutesLimit - usage.minutesUsed} minutes remaining for active campaign dispatches.
            </p>
          </div>

          {/* Contact Enrichment Credits Progress */}
          <div className="space-y-3">
            <div className="flex justify-between items-baseline text-sm">
              <span className="text-slate-300 font-medium">{t('contactCredits')}</span>
              <span className="font-mono font-bold text-white">
                {usage.contactCredits} / {usage.contactCreditsLimit} credits
              </span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500"
                style={{
                  width: `${Math.min(Math.round((usage.contactCredits / usage.contactCreditsLimit) * 100), 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-400">
              {usage.contactCreditsLimit - usage.contactCredits} credits available for LinkedIn intent enrichment.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Subscription Tiers */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-indigo-400" />
          <span>{t('subscriptionTiers')}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`bg-slate-900/90 border rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between relative ${
                tier.id === usage.plan
                  ? 'border-blue-500 ring-1 ring-blue-500/50'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {tier.id === usage.plan && (
                <span className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
                  {t('activePlan')}
                </span>
              )}

              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-white">{tier.price}</span>
                </div>
                <div className="text-xs text-slate-400 space-y-1 font-mono pt-2 border-t border-slate-800">
                  <div>🎙️ Voice Minutes: <span className="text-slate-200">{tier.voiceMinutes}</span></div>
                  <div>🎯 Contact Enrichment: <span className="text-slate-200">{tier.contactCredits}</span></div>
                </div>

                <ul className="space-y-2 text-xs text-slate-300 pt-3">
                  {tier.features.map((feat, i) => (
                    <li key={i} className="flex items-center space-x-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={`w-full py-2.5 rounded-xl font-semibold text-xs transition ${
                  tier.id === usage.plan
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {t('upgrade')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Fraud & Abuse Detection Alerts */}
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="bg-red-500/10 p-2 rounded-xl border border-red-500/20 text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{t('fraudAlerts')}</h2>
            <p className="text-xs text-slate-400">Automated security triggers flagging suspicious activity, rate breaches, and concurrency spikes.</p>
          </div>
        </div>

        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-slate-900/90 border rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                alert.severity === 'CRITICAL'
                  ? 'border-red-500/50 bg-red-950/10'
                  : alert.severity === 'WARNING'
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : 'border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <AlertTriangle
                  className={`h-5 w-5 mt-0.5 shrink-0 ${
                    alert.severity === 'CRITICAL'
                      ? 'text-red-400'
                      : alert.severity === 'WARNING'
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-white">{alert.title}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        alert.severity === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : alert.severity === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{alert.details}</p>
                  <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                    Logged: {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {alert.status === 'OPEN' ? (
                <div className="flex items-center space-x-2 self-end md:self-auto shrink-0">
                  <button
                    onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                    disabled={processingAlertId === alert.id}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold transition"
                  >
                    {t('acknowledgeAlert')}
                  </button>
                  <button
                    onClick={() => handleAlertAction(alert.id, 'block')}
                    disabled={processingAlertId === alert.id}
                    className="px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-300 text-xs font-semibold transition flex items-center space-x-1"
                  >
                    <Ban className="h-3 w-3" />
                    <span>Block IP</span>
                  </button>
                </div>
              ) : (
                <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg font-medium self-end md:self-auto">
                  ✓ {tFraud('statusResolved')}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: Security Audit Logs Table */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('auditLogs')}</h2>
              <p className="text-xs text-slate-400">Real-time enterprise audit trail of administrative actions, logins, and API triggers.</p>
            </div>
          </div>

          {/* Audit Logs Filter Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder={t('searchAuditLogs')}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">{t('timestamp')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('action')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('user')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('ipAddress')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('userAgent')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('metadata')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-sans text-xs">
                      No security audit log entries match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-400 whitespace-nowrap">
                        <span className="bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-200 whitespace-nowrap font-sans">
                        {log.user?.email || log.userId || 'System'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {log.ipAddress || '127.0.0.1'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-[200px] truncate font-sans text-[11px]">
                        {log.userAgent || 'LeadPoint-Core'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-[250px] truncate font-mono text-[10px]">
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
    </div>
  );
}
