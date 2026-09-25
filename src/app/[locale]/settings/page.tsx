'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  PhoneCall,
  CalendarCheck,
  Bot,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Radio,
  Key,
  Sliders,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'telephony' | 'calendly' | 'ai'>('profile');
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState('CloudScale Consulting Group');
  const [companyUrl, setCompanyUrl] = useState('https://www.cloudscaleconsulting.example.com');
  const [description, setDescription] = useState(
    'Enterprise IT consulting specializing in Microsoft 365, SharePoint Online migrations, Azure identity, and Zero Trust security.'
  );

  // Telephony states
  const [telephonyProvider, setTelephonyProvider] = useState<'MOCK' | 'TWILIO'>('MOCK');
  const [twilioPhone, setTwilioPhone] = useState('+15553829901');

  // Calendly states
  const [calendlyUrl, setCalendlyUrl] = useState('https://calendly.com/leadpoint-demo/20min');

  // AI Persona
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [sdrPersona, setSdrPersona] = useState('Alex Carter');
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (mounted && data.success && data.data?.companyProfile) {
          const profile = data.data.companyProfile;
          if (profile.name) setCompanyName(profile.name);
          if (profile.website) setCompanyUrl(profile.website);
          if (profile.description) setDescription(profile.description);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500 glass-card-solid rounded-3xl max-w-4xl mx-auto shadow-sm">
        <RefreshCw className="h-7 w-7 animate-spin mx-auto text-[#0F0F12] mb-3" />
        <p className="text-sm font-bold text-[#0F0F12]">Loading Workspace Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#5C1D3A]/15">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F0F12]">
            Workspace Configuration
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage your company ICP, telephony provider, Calendly scheduling links, and AI SDR personas.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#34D399]/20 border border-[#34D399]/40 text-emerald-900 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Settings saved successfully</span>
          </div>
        )}
      </div>

      {/* Main Settings Layout (Desktop Left Nav, Content Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Navigation (Sidebar) */}
        <aside className="md:col-span-4 p-2 glass-card-solid rounded-3xl shadow-sm space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-2">
            Settings Modules
          </div>
          {[
            { id: 'profile', label: 'Company Profile & ICP', icon: Building2 },
            { id: 'telephony', label: 'Voice & Telephony', icon: PhoneCall },
            { id: 'calendly', label: 'Calendly & SMS Handoff', icon: CalendarCheck },
            { id: 'ai', label: 'AI Persona & Models', icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                  active
                    ? 'bg-[#E6F0FA] text-[#0F0F12] border border-[#5C1D3A]/20 shadow-xs'
                    : 'text-slate-600 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#E5C158]' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Content Workspace */}
        <div className="md:col-span-8 p-6 glass-card-solid rounded-3xl shadow-sm">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Tab 1: Company Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-base font-extrabold text-[#0F0F12]">Company & ICP Definition</h2>
                  <p className="text-xs text-slate-600">
                    Used by the AI engine to match incoming buyer intent with your core services.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-3 py-2 text-[#0F0F12] focus:outline-none focus:ring-2 focus:ring-[#0F0F12] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Company Website</label>
                    <input
                      type="url"
                      value={companyUrl}
                      onChange={(e) => setCompanyUrl(e.target.value)}
                      className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-3 py-2 text-[#0F0F12] focus:outline-none focus:ring-2 focus:ring-[#0F0F12] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Business Description & Core Offerings
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-3 py-2 text-[#0F0F12] focus:outline-none focus:ring-2 focus:ring-[#0F0F12] text-xs leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Telephony */}
            {activeTab === 'telephony' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-base font-extrabold text-[#0F0F12]">Telephony & Voice Carrier</h2>
                  <p className="text-xs text-slate-600">
                    Configure SIP trunking and caller ID settings for outbound SDR calls.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Carrier Provider</label>
                    <select
                      value={telephonyProvider}
                      onChange={(e) => setTelephonyProvider(e.target.value as any)}
                      className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-3 py-2 text-[#0F0F12] focus:outline-none focus:ring-2 focus:ring-[#0F0F12] text-xs"
                    >
                      <option value="MOCK">Mock Telephony Gateway (Local Dev & Testing)</option>
                      <option value="TWILIO">Twilio Voice & SMS Carrier (Production)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Outbound Caller ID Phone</label>
                    <input
                      type="text"
                      value={twilioPhone}
                      onChange={(e) => setTwilioPhone(e.target.value)}
                      placeholder="+15553829901"
                      className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-3 py-2 text-[#0F0F12] focus:outline-none focus:ring-2 focus:ring-[#0F0F12] text-xs"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">E.164 formatted telephone number.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Calendly */}
            {activeTab === 'calendly' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-base font-extrabold text-[#0F0F12]">Calendly & Handoff Integration</h2>
                  <p className="text-xs text-slate-600">
                    Define the scheduling link sent to high-intent prospects upon successful qualification.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Calendly Scheduling URL</label>
                    <input
                      type="url"
                      value={calendlyUrl}
                      onChange={(e) => setCalendlyUrl(e.target.value)}
                      placeholder="https://calendly.com/your-team/20min"
                      className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-3 py-2 text-[#0F0F12] focus:outline-none focus:ring-2 focus:ring-[#0F0F12] text-xs"
                    />
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#E6F0FA]/80 border border-[#5C1D3A]/20 text-[#0F0F12] space-y-1 shadow-xs">
                    <div className="font-bold text-xs flex items-center space-x-1.5">
                      <CalendarCheck className="w-3.5 h-3.5 text-[#E5C158]" />
                      <span>Automated SMS Dispatch</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-normal">
                      When the Voice SDR identifies positive human handoff intent, this link is texted directly to the caller's verified phone number.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: AI Model & Persona */}
            {activeTab === 'ai' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-base font-extrabold text-[#0F0F12]">AI SDR Model & Persona</h2>
                  <p className="text-xs text-slate-600">
                    Control speech latency, generative LLM tier, and language defaults.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">AI Generative Engine</label>
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-3 py-2 text-[#0F0F12] focus:outline-none focus:ring-2 focus:ring-[#0F0F12] text-xs"
                    >
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra low-latency conversational audio)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep complex qualification reasoning)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">SDR Agent Persona Name</label>
                    <input
                      type="text"
                      value={sdrPersona}
                      onChange={(e) => setSdrPersona(e.target.value)}
                      className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-3 py-2 text-[#0F0F12] focus:outline-none focus:ring-2 focus:ring-[#0F0F12] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Default Locale</label>
                    <select
                      value={defaultLanguage}
                      onChange={(e) => setDefaultLanguage(e.target.value)}
                      className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-3 py-2 text-[#0F0F12] focus:outline-none focus:ring-2 focus:ring-[#0F0F12] text-xs"
                    >
                      <option value="en">English (US / UK / Global)</option>
                      <option value="de">German (Deutsch)</option>
                      <option value="es">Spanish (Español)</option>
                      <option value="fr">French (Français)</option>
                      <option value="hi">Hindi (हिंदी)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 border-t border-[#5C1D3A]/15 flex justify-end">
              <button
                type="submit"
                className="btn-primary-black inline-flex items-center space-x-1.5 px-5 py-2.5 text-xs font-bold"
              >
                <Save className="w-3.5 h-3.5 text-[#F6E27A]" />
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
