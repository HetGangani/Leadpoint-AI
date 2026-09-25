'use client';

import React, { useState, useEffect } from 'react';
import {
  Play, Plus, PhoneCall, RefreshCw, CheckCircle2, Flame,
  Clock, Shield, Settings, Users, ArrowRight, Globe, Layers, AlertCircle, X
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

  const getCampaignStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'SCHEDULED':
        return 'bg-blue-500/10 text-blue-800 border-blue-400/30';
      case 'RUNNING':
      case 'ACTIVE':
        return 'bg-[#34D399]/15 text-emerald-900 border-[#34D399]/40 font-bold';
      case 'PAUSED':
        return 'bg-[#FBBF24]/15 text-amber-900 border-[#FBBF24]/40 font-semibold';
      case 'COMPLETED':
        return 'bg-purple-500/10 text-purple-800 border-purple-400/30 font-semibold';
      default:
        return 'bg-[#34D399]/15 text-emerald-800 border-[#34D399]/40';
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 glass-card-solid rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-[#0F0F12]">Campaign Automation Launcher</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Launch B2B voice campaigns with automated retry loops, timezone scheduling, and live execution streams.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn-primary-black py-2.5 px-4 text-xs font-bold flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 text-[#F6E27A]" />
          <span>New Voice Campaign</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="glass-card-solid rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center space-y-2 shadow-xs">
            <RefreshCw className="h-6 w-6 text-[#0F0F12] animate-spin" />
            <p className="text-xs font-semibold text-slate-700">Loading Voice Campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="glass-card-solid rounded-2xl p-12 text-center text-slate-500 flex flex-col items-center space-y-2.5 shadow-xs">
            <Layers className="h-8 w-8 text-slate-400 mb-1" />
            <p className="text-sm font-bold text-[#0F0F12]">No Active Campaigns Configured</p>
            <p className="text-xs text-slate-600 max-w-sm">
              Create your first voice outreach campaign to start connecting with enriched leads and auto-qualifying high intent prospects.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-2 btn-primary-black py-2 px-4 text-xs font-bold"
            >
              + Create Campaign
            </button>
          </div>
        ) : (
          campaigns.map((c: any) => (
            <div
              key={c.id}
              className="glass-card-solid rounded-2xl p-5 shadow-xs space-y-3.5 hover:border-[#0F0F12]/30 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <h3 className="font-extrabold text-[#0F0F12] text-base">{c.name}</h3>
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        c.type === 'LEADS_AND_CALLING'
                          ? 'bg-purple-500/10 border-purple-400/30 text-purple-800'
                          : 'bg-blue-500/10 border-blue-400/30 text-blue-800'
                      }`}
                    >
                      {c.type === 'LEADS_AND_CALLING' ? 'Leads + Calling' : 'Calling Only'}
                    </span>
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getCampaignStatusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                    <span className="flex items-center gap-1 font-medium">
                      <Globe className="h-3.5 w-3.5 text-[#0F0F12]" />
                      <span>{c.timezone}</span>
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5 text-[#0F0F12]" />
                      <span>{c.retryCount} Max Retries</span>
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <PhoneCall className="h-3.5 w-3.5 text-emerald-700" />
                      <span>{c.voiceCallsCount || 0} Calls</span>
                    </span>
                    {c.highIntentCount > 0 && (
                      <span className="flex items-center gap-1 text-amber-900 font-bold bg-[#FBBF24]/20 px-2 py-0.5 rounded-md border border-[#FBBF24]/40">
                        <Flame className="h-3.5 w-3.5 text-amber-600" />
                        <span>High Intent: {c.highIntentCount}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start md:self-auto">
                  <button
                    type="button"
                    onClick={() => handleExecuteCampaign(c.id)}
                    disabled={executingCampaignId === c.id}
                    className="btn-primary-black py-2 px-4 text-xs font-bold flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {executingCampaignId === c.id ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#F6E27A]" />
                        <span>Executing Calls...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-[#E5C158] text-[#E5C158]" />
                        <span>Run Batch Execution</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Schedule Footer */}
              <div className="bg-white/70 p-2.5 rounded-xl border border-[#5C1D3A]/15 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-700 gap-1.5">
                <span>Cron: <code className="text-[#0F0F12] bg-[#E6F0FA] px-2 py-0.5 rounded-md border border-[#5C1D3A]/20 font-mono text-[11px] font-bold">{c.scheduleCron || '0 9 * * 1-5'}</code></span>
                <span>Unanswered Retries Queued: <strong className="text-[#0F0F12]">{c.unansweredCount || 0}</strong></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Execution Progress & Live Stream Logs */}
      {executionLogs.length > 0 && (
        <div className="glass-card-solid rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#5C1D3A]/15 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-xl bg-[#E6F0FA] border border-[#5C1D3A]/20 text-[#0F0F12]">
                <RefreshCw className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-[#0F0F12] text-sm">Live Campaign Execution Stream</h3>
                <p className="text-xs text-slate-600">Processed batch calls with intent auto-flagging</p>
              </div>
            </div>
            <span className="text-xs font-bold bg-[#E6F0FA] border border-[#5C1D3A]/20 text-[#0F0F12] px-3 py-1 rounded-full">
              {executionLogs.length} calls processed
            </span>
          </div>

          <div className="space-y-2">
            {executionLogs.map((log, idx) => (
              <div
                key={idx}
                className="bg-white/70 p-3 rounded-xl border border-[#5C1D3A]/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#0F0F12]">{log.leadName}</span>
                    <span className="text-slate-500">({log.companyName})</span>
                    {log.isHighIntent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FBBF24]/20 text-amber-900 border border-[#FBBF24]/40 flex items-center gap-1">
                        <Flame className="h-3 w-3 text-amber-600" />
                        <span>HIGH INTENT</span>
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5">{log.nextBestAction}</p>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    log.disposition === 'INTERESTED'
                      ? 'bg-[#34D399]/15 border-[#34D399]/40 text-emerald-900'
                      : log.disposition === 'BUSY'
                      ? 'bg-[#FBBF24]/15 border-[#FBBF24]/40 text-amber-900'
                      : 'bg-blue-500/10 border-blue-400/30 text-blue-800'
                  }`}
                >
                  {log.disposition}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F0F12]/60 backdrop-blur-md overflow-y-auto">
          <div className="glass-modal rounded-3xl p-6 shadow-2xl w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#5C1D3A]/15 pb-3">
              <h3 className="font-extrabold text-[#0F0F12] text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-[#0F0F12]" />
                <span>Configure New Voice Campaign</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-[#0F0F12] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-3 py-2 text-[#0F0F12] focus:outline-none focus:ring-2 focus:ring-[#0F0F12]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Strategy</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CampaignType)}
                    className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-2.5 py-1.5 text-[#0F0F12] focus:outline-none focus:ring-2 focus:ring-[#0F0F12]"
                  >
                    <option value="LEADS_AND_CALLING">Leads + Calling</option>
                    <option value="CALLING_ONLY">Calling Only</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-2.5 py-1.5 text-[#0F0F12] focus:outline-none focus:ring-2 focus:ring-[#0F0F12]"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Max Retries</label>
                  <select
                    value={retryCount}
                    onChange={(e) => setRetryCount(Number(e.target.value))}
                    className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-2.5 py-1.5 text-[#0F0F12] focus:outline-none focus:ring-2 focus:ring-[#0F0F12]"
                  >
                    <option value={1}>1 Retry Attempt</option>
                    <option value={2}>2 Retry Attempts</option>
                    <option value={3}>3 Retry Attempts</option>
                    <option value={5}>5 Retry Attempts</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Agent Language</label>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value as SupportedLocale)}
                    className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-2.5 py-1.5 text-[#0F0F12] focus:outline-none focus:ring-2 focus:ring-[#0F0F12]"
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
                <label className="font-bold text-slate-700 block mb-1">Cron Expression</label>
                <input
                  type="text"
                  value={scheduleCron}
                  onChange={(e) => setScheduleCron(e.target.value)}
                  className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-3 py-1.5 text-[#0F0F12] focus:outline-none focus:ring-2 focus:ring-[#0F0F12] font-mono text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#5C1D3A]/15 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary-glass px-4 py-2 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-black px-5 py-2 font-bold text-xs"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
