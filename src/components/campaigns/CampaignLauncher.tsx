'use client';

import React, { useState, useEffect } from 'react';
import {
  Play, Plus, PhoneCall, RefreshCw, CheckCircle2, Flame,
  Clock, Shield, Settings, Users, ArrowRight, Globe, Layers, AlertCircle
} from 'lucide-react';
import { CampaignSummary, CampaignType, SupportedLocale } from '@/types';

export default function CampaignLauncher() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [executingCampaignId, setExecutingCampaignId] = useState<string | null>(null);
  const [executionLogs, setExecutionLogs] = useState<Array<{ leadName: string; companyName: string; disposition: string; isHighIntent: boolean; nextBestAction: string }>>([]);

  // Form State
  const [name, setName] = useState('Enterprise Cloud Migration Outreach Q3');
  const [type, setType] = useState<CampaignType>('LEADS_AND_CALLING');
  const [timezone, setTimezone] = useState('America/New_York');
  const [retryCount, setRetryCount] = useState(3);
  const [targetLanguage, setTargetLanguage] = useState<SupportedLocale>('en');
  const [scheduleCron, setScheduleCron] = useState('0 9 * * 1-5');

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          timezone,
          retryCount,
          targetLanguage,
          scheduleCron,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteCampaign = async (campaignId: string) => {
    setExecutingCampaignId(campaignId);
    setExecutionLogs([]);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/execute`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setExecutionLogs(data.executedCalls || []);
        fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExecutingCampaignId(null);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs px-3 py-1 rounded-full mb-2">
            <Layers className="h-3.5 w-3.5" />
            <span>Multi-Channel Campaign Automation • Unanswered Call Retry Engine</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Campaign Automation Launcher</h2>
          <p className="text-sm text-slate-400">
            Launch B2B voice campaigns with automated retry loops, timezone scheduling, and live execution streams.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-blue-500/20 transition flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Voice Campaign</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center space-y-3">
            <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" />
            <p className="text-sm">Loading Voice Campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center space-y-3">
            <Layers className="h-10 w-10 text-slate-600 mb-2" />
            <p className="text-base font-semibold text-white">No Active Campaigns Configured</p>
            <p className="text-xs text-slate-400 max-w-md">
              Create your first voice outreach campaign to start connecting with enriched leads and auto-qualifying high intent prospects.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              + Launch First Campaign
            </button>
          </div>
        ) : (
          campaigns.map((c: any) => (
            <div
              key={c.id}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-bold text-white text-lg">{c.name}</h3>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full uppercase border ${
                        c.type === 'LEADS_AND_CALLING'
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      }`}
                    >
                      {c.type === 'LEADS_AND_CALLING' ? 'Leads + Calling' : 'Calling Only'}
                    </span>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {c.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5 text-blue-400" />
                      Timezone: <strong className="text-slate-200">{c.timezone}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-purple-400" />
                      Retry Loop: <strong className="text-slate-200">{c.retryCount} Max Retries</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
                      Total Calls: <strong className="text-slate-200">{c.voiceCallsCount || 0}</strong>
                    </span>
                    {c.highIntentCount > 0 && (
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Flame className="h-3.5 w-3.5" />
                        🔥 High Intent Flagged: {c.highIntentCount}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleExecuteCampaign(c.id)}
                    disabled={executingCampaignId === c.id}
                    className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {executingCampaignId === c.id ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Executing Batch Calls...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Run Batch Execution</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Retry & Target Policy Footer */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Cron Schedule: <code className="text-slate-200 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono">{c.scheduleCron || '0 9 * * 1-5'}</code></span>
                <span>Unanswered Retries Queued: <strong className="text-purple-300">{c.unansweredCount || 0}</strong></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Execution Progress & Live Stream Logs */}
      {executionLogs.length > 0 && (
        <div className="bg-slate-900 border border-blue-500/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Live Campaign Call Stream Execution</h3>
                <p className="text-xs text-slate-400">Processed batch calls with automatic retry loop queueing and intent auto-flagging.</p>
              </div>
            </div>
            <span className="text-xs font-mono bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
              {executionLogs.length} calls processed
            </span>
          </div>

          <div className="space-y-3">
            {executionLogs.map((log, idx) => (
              <div
                key={idx}
                className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white text-sm">{log.leadName}</span>
                    <span className="text-xs text-slate-400">({log.companyName})</span>
                    {log.isHighIntent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <Flame className="h-3 w-3 text-amber-400" />
                        <span>🔥 HIGH INTENT</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{log.nextBestAction}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs font-mono font-semibold px-3 py-1 rounded-full border ${
                      log.disposition === 'INTERESTED'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : log.disposition === 'BUSY'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    }`}
                  >
                    Disposition: {log.disposition}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-xl space-y-6 relative animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-400" />
                <span>Configure New Voice Outreach Campaign</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Campaign Strategy</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CampaignType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="LEADS_AND_CALLING">Leads + Calling</option>
                    <option value="CALLING_ONLY">Calling Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Target Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="America/New_York">EST (New York)</option>
                    <option value="America/Los_Angeles">PST (Los Angeles)</option>
                    <option value="Europe/London">GMT (London)</option>
                    <option value="Europe/Berlin">CET (Berlin)</option>
                    <option value="Asia/Kolkata">IST (India)</option>
                    <option value="Asia/Tokyo">JST (Tokyo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Unanswered Call Retries</label>
                  <select
                    value={retryCount}
                    onChange={(e) => setRetryCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={1}>1 Retry Attempt</option>
                    <option value={2}>2 Retry Attempts</option>
                    <option value={3}>3 Retry Attempts (Recommended)</option>
                    <option value={5}>5 Retry Attempts</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Voice Agent Language</label>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value as SupportedLocale)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="en">English (US)</option>
                    <option value="es">Spanish (Español)</option>
                    <option value="de">German (Deutsch)</option>
                    <option value="hi">Hindi (हिंदी)</option>
                    <option value="fr">French (Français)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Schedule Cron Expression</label>
                <input
                  type="text"
                  value={scheduleCron}
                  onChange={(e) => setScheduleCron(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20"
                >
                  Create & Launch Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
