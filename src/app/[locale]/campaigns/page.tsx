'use client';

import React from 'react';
import CampaignLauncher from '@/components/campaigns/CampaignLauncher';
import { Layers, Sparkles, PhoneCall, Calendar } from 'lucide-react';

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#5C1D3A]/15">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0F0F12]">
            Outreach Campaigns & Orchestration
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Schedule and launch autonomous multi-turn Voice SDR calling batches across qualified cohorts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#E6F0FA]/90 border border-[#5C1D3A]/20 text-[#0F0F12] text-xs font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#E5C158]" />
            <span>Automated SDR Dispatch</span>
          </span>
        </div>
      </div>

      {/* Campaign Launcher Workspace Component */}
      <CampaignLauncher />
    </div>
  );
}
