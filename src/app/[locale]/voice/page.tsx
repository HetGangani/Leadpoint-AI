'use client';

import React, { useState } from 'react';
import { PhoneCall, Layers, Zap, ArrowLeft, Target, Sparkles, Database, ShieldCheck } from 'lucide-react';
import VoiceAgentSimulator from '@/components/voice/VoiceAgentSimulator';
import CampaignLauncher from '@/components/campaigns/CampaignLauncher';

export default function VoiceAndCampaignsPage() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'campaigns'>('simulator');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <a href="/en/leads" className="bg-slate-800 p-2 rounded-xl text-slate-300 hover:text-white transition border border-slate-700">
            <ArrowLeft className="h-4 w-4" />
          </a>
          <div className="bg-blue-600/20 p-2 rounded-xl border border-blue-500/30 text-blue-400">
            <Zap className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            LeadPoint AI Voice Platform
          </span>
        </div>

        <nav className="flex items-center space-x-6 text-sm text-slate-300">
          <a href="/en/leads" className="hover:text-blue-400 transition flex items-center space-x-1">
            <Target className="h-4 w-4 text-slate-400" />
            <span>Lead Discovery</span>
          </a>
          <a href="/en/voice" className="text-blue-400 font-semibold flex items-center space-x-1">
            <PhoneCall className="h-4 w-4 text-blue-400" />
            <span>Voice AI & Campaigns</span>
          </a>
        </nav>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-center">
          <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 inline-flex space-x-2">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-6 py-2.5 rounded-xl font-semibold text-xs transition flex items-center space-x-2 ${
                activeTab === 'simulator'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PhoneCall className="h-4 w-4" />
              <span>Voice Agent Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-6 py-2.5 rounded-xl font-semibold text-xs transition flex items-center space-x-2 ${
                activeTab === 'campaigns'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Campaign Automation Launcher</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'simulator' ? (
          <VoiceAgentSimulator />
        ) : (
          <CampaignLauncher />
        )}
      </div>
    </main>
  );
}
