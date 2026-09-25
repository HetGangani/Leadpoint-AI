'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Sparkles,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Search,
  ExternalLink,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  X,
  PhoneCall,
  Loader2,
} from 'lucide-react';
import BusinessAnalyzeModal from './BusinessAnalyzeModal';
import CsvImportModal from './CsvImportModal';

export default function LeadDiscoveryPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [harvesting, setHarvesting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters state
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');
  const [selectedIndustry, setSelectedIndustry] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedScore, setSelectedScore] = useState('ALL');

  // Modals state
  const [isAnalyzeOpen, setIsAnalyzeOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<any | null>(null);

  // Fetch leads on mount
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leads/discover');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLeads(data.data);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Harvest public requirements
  const handleHarvestLeads = async () => {
    setHarvesting(true);
    try {
      const res = await fetch('/api/leads/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          industry: selectedIndustry,
        }),
      });
      const data = await res.json();
      if (data.success && data.allLeads) {
        setLeads(data.allLeads);
      }
    } catch (err) {
      console.error('Harvesting error:', err);
    } finally {
      setHarvesting(false);
    }
  };

  // Export to CSV trigger
  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (selectedPlatform !== 'ALL') params.set('platform', selectedPlatform);
    if (selectedIndustry !== 'ALL') params.set('industry', selectedIndustry);
    if (selectedScore === 'HIGH') params.set('minScore', '0.90');
    if (selectedScore === 'MEDIUM') params.set('minScore', '0.80');

    window.open(`/api/leads/export?${params.toString()}`, '_blank');
  };

  // Derived filter options
  const platforms = ['ALL', 'LinkedIn', 'X/Twitter', 'Upwork', 'RFP Directory', 'CSV Import'];
  const industries = [
    'ALL',
    'Financial Services',
    'Aerospace',
    'Healthcare',
    'Retail',
    'Logistics',
    'IT Services',
    'Public Sector',
  ];
  const statuses = ['ALL', 'NEW', 'QUALIFIED', 'CONTACTED', 'INTERESTED', 'CALENDLY_SENT', 'BOOKED', 'UNRESPONSIVE'];
  const scores = [
    { label: 'All Scores', value: 'ALL' },
    { label: 'High Intent (>90%)', value: 'HIGH' },
    { label: 'Medium Intent (>80%)', value: 'MEDIUM' },
  ];

  // Filtering logic
  const filteredLeads = leads.filter((lead) => {
    if (selectedPlatform !== 'ALL' && !lead.sourcePlatform?.toLowerCase().includes(selectedPlatform.toLowerCase())) {
      return false;
    }
    if (selectedIndustry !== 'ALL' && !lead.industry?.toLowerCase().includes(selectedIndustry.toLowerCase())) {
      return false;
    }
    if (selectedStatus !== 'ALL' && lead.status !== selectedStatus) {
      return false;
    }
    if (selectedScore === 'HIGH' && (lead.relevanceScore || 0) < 0.9) {
      return false;
    }
    if (selectedScore === 'MEDIUM' && (lead.relevanceScore || 0) < 0.8) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lead.name?.toLowerCase().includes(q);
      const matchCompany = lead.companyName?.toLowerCase().includes(q);
      const matchEmail = lead.businessEmail?.toLowerCase().includes(q);
      const matchContent = lead.postContent?.toLowerCase().includes(q);
      if (!matchName && !matchCompany && !matchEmail && !matchContent) {
        return false;
      }
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-500/10 text-blue-800 border-blue-400/30';
      case 'QUALIFIED':
        return 'bg-purple-500/10 text-purple-800 border-purple-400/30 font-semibold';
      case 'INTERESTED':
        return 'bg-teal-500/10 text-teal-800 border-teal-400/30 font-semibold';
      case 'CONTACTED':
      case 'FOLLOW_UP_REQUIRED':
        return 'bg-[#FBBF24]/15 text-amber-900 border-[#FBBF24]/40 font-semibold';
      case 'BOOKED':
      case 'CALENDLY_SENT':
        return 'bg-[#34D399]/15 text-emerald-900 border-[#34D399]/40 font-bold';
      case 'NOT_INTERESTED':
      case 'UNRESPONSIVE':
        return 'bg-[#F87171]/15 text-rose-800 border-[#F87171]/40';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#5C1D3A]/15 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 bg-[#E6F0FA]/90 border border-[#5C1D3A]/20 text-[#0F0F12] text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 shadow-xs">
            <Target className="h-3.5 w-3.5 text-[#E5C158]" />
            <span>Lead Discovery & Sourcing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F0F12]">
            Prospect Accounts & Intent Signals
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Search, filter, and qualify high-intent opportunities across social signals and CSV imports.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAnalyzeOpen(true)}
            className="btn-secondary-glass inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#E5C158]" />
            <span>Analyze ICP</span>
          </button>

          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="btn-secondary-glass inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold"
          >
            <Upload className="h-3.5 w-3.5 text-[#0F0F12]" />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="btn-secondary-glass inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5 text-[#0F0F12]" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleHarvestLeads}
            disabled={harvesting}
            className="btn-primary-black inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#F6E27A] ${harvesting ? 'animate-spin' : ''}`} />
            <span>{harvesting ? 'Harvesting...' : 'Harvest Signals'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card-solid rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, company, or requirement..."
              className="w-full bg-[#F2F0FF]/60 border border-[#5C1D3A]/20 rounded-xl pl-9 pr-3 py-2 text-xs text-[#0F0F12] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F0F12]"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-600 self-end md:self-auto">
            <Filter className="h-3.5 w-3.5 text-[#0F0F12]" />
            <span>Showing <strong className="text-[#0F0F12] font-bold">{filteredLeads.length}</strong> of {leads.length} leads</span>
          </div>
        </div>

        {/* Filter Selects */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-[#5C1D3A]/10 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full bg-[#F2F0FF]/60 border border-[#5C1D3A]/20 rounded-xl px-2.5 py-1.5 text-[#0F0F12] text-xs focus:outline-none focus:ring-1 focus:ring-[#0F0F12]"
            >
              {platforms.map((p) => (
                <option key={p} value={p}>{p === 'ALL' ? 'All Platforms' : p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Industry</label>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full bg-[#F2F0FF]/60 border border-[#5C1D3A]/20 rounded-xl px-2.5 py-1.5 text-[#0F0F12] text-xs focus:outline-none focus:ring-1 focus:ring-[#0F0F12]"
            >
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind === 'ALL' ? 'All Industries' : ind}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pipeline Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-[#F2F0FF]/60 border border-[#5C1D3A]/20 rounded-xl px-2.5 py-1.5 text-[#0F0F12] text-xs focus:outline-none focus:ring-1 focus:ring-[#0F0F12]"
            >
              {statuses.map((st) => (
                <option key={st} value={st}>{st === 'ALL' ? 'All Statuses' : st}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Relevance Score</label>
            <select
              value={selectedScore}
              onChange={(e) => setSelectedScore(e.target.value)}
              className="w-full bg-[#F2F0FF]/60 border border-[#5C1D3A]/20 rounded-xl px-2.5 py-1.5 text-[#0F0F12] text-xs focus:outline-none focus:ring-1 focus:ring-[#0F0F12]"
            >
              {scores.map((sc) => (
                <option key={sc.value} value={sc.value}>{sc.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Desktop Table & Mobile Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 space-y-2 glass-card-solid rounded-2xl">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#0F0F12]" />
          <p className="text-xs font-semibold text-slate-700">Loading leads database...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-12 text-center glass-card-solid rounded-2xl text-slate-500 space-y-2">
          <Target className="h-8 w-8 mx-auto text-slate-400" />
          <p className="text-sm font-bold text-[#0F0F12]">No leads match current filters</p>
          <p className="text-xs text-slate-500">Try changing your search keywords or click "Harvest Signals".</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block glass-card-solid rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#E6F0FA]/90 border-b border-[#5C1D3A]/15 text-slate-700 uppercase font-bold text-[11px]">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">Lead & Contact</th>
                    <th scope="col" className="px-5 py-3.5">Company & Vertical</th>
                    <th scope="col" className="px-4 py-3.5">Platform</th>
                    <th scope="col" className="px-4 py-3.5">Score</th>
                    <th scope="col" className="px-4 py-3.5">Status</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#5C1D3A]/10">
                  {filteredLeads.map((lead) => {
                    const score = Math.round((lead.relevanceScore || 0.85) * 100);
                    return (
                      <tr key={lead.id} className="hover:bg-[#E6F0FA]/60 transition-colors group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-[#0F0F12] text-[#F6E27A] border border-[#E5C158]/30 font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
                            </div>
                            <div>
                              <div className="font-bold text-[#0F0F12]">{lead.name}</div>
                              <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span>{lead.businessEmail}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-[#0F0F12]">{lead.companyName}</div>
                          <div className="text-[11px] text-slate-500">{lead.industry}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-block px-2.5 py-0.5 bg-white/70 border border-[#5C1D3A]/15 rounded-md text-[11px] text-slate-800 font-medium">
                            {lead.sourcePlatform || 'LinkedIn'}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                            score >= 90
                              ? 'bg-[#34D399]/15 text-emerald-900 border-[#34D399]/40'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {score}% Match
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center space-x-2">
                            <a
                              href={`/voice?leadId=${lead.id}`}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-[#0F0F12] hover:bg-[#E6F0FA] border border-transparent hover:border-[#5C1D3A]/15 transition"
                              title="Launch Voice SDR Call"
                            >
                              <PhoneCall className="h-4 w-4" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setSelectedLeadForDetail(lead)}
                              className="btn-secondary-glass inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (Hidden on desktop) */}
          <div className="md:hidden space-y-3">
            {filteredLeads.map((lead) => {
              const score = Math.round((lead.relevanceScore || 0.85) * 100);
              return (
                <div key={lead.id} className="glass-card-solid rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-[#0F0F12] text-sm">{lead.name}</h3>
                      <div className="text-xs text-slate-600 flex items-center space-x-1 mt-0.5">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        <span>{lead.companyName}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5 truncate">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate">{lead.businessEmail}</span>
                    </div>
                    {lead.phone && (
                      <div className="flex items-center space-x-1.5">
                        <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#5C1D3A]/10 text-xs">
                    <span className="font-bold text-[#0F0F12] bg-[#E6F0FA] border border-[#5C1D3A]/20 px-2.5 py-0.5 rounded-md">
                      {score}% Relevance
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedLeadForDetail(lead)}
                      className="btn-secondary-glass inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold"
                    >
                      <span>View Details</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Lead Detail Slide-over / Modal */}
      {selectedLeadForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0F12]/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="glass-modal rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#5C1D3A]/15 flex items-center justify-between bg-[#E6F0FA]/60">
              <div>
                <h3 className="text-base font-extrabold text-[#0F0F12]">{selectedLeadForDetail.name}</h3>
                <p className="text-xs text-slate-600">{selectedLeadForDetail.companyName} • {selectedLeadForDetail.industry}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeadForDetail(null)}
                className="p-1.5 text-slate-500 hover:text-[#0F0F12] rounded-xl hover:bg-white/60 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              <div className="flex items-center justify-between p-3.5 bg-white/70 rounded-xl border border-[#5C1D3A]/15">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Pipeline Status</span>
                  <div className="font-extrabold text-[#0F0F12]">{selectedLeadForDetail.status}</div>
                </div>
                <div className="space-y-0.5 text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Relevance Match</span>
                  <div className="font-extrabold text-[#0F0F12]">
                    {Math.round((selectedLeadForDetail.relevanceScore || 0.85) * 100)}%
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-600 text-xs uppercase tracking-wider">Contact Details</h4>
                <div className="p-3.5 bg-white/70 border border-[#5C1D3A]/15 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3.5 w-3.5 text-[#0F0F12]" />
                    <span className="font-medium text-[#0F0F12]">{selectedLeadForDetail.businessEmail}</span>
                  </div>
                  {selectedLeadForDetail.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3.5 w-3.5 text-[#0F0F12]" />
                      <span className="font-medium text-[#0F0F12]">{selectedLeadForDetail.phone}</span>
                    </div>
                  )}
                  {selectedLeadForDetail.originalPostUrl && (
                    <div className="flex items-center space-x-2 pt-1 border-t border-[#5C1D3A]/10">
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                      <a
                        href={selectedLeadForDetail.originalPostUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0F0F12] underline hover:text-[#5C1D3A] truncate max-w-sm font-medium"
                      >
                        {selectedLeadForDetail.originalPostUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirement Post Content */}
              {selectedLeadForDetail.postContent && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-600 text-xs uppercase tracking-wider">Sourced Intent Requirement</h4>
                  <div className="p-3.5 bg-white/70 border border-[#5C1D3A]/15 rounded-xl italic text-slate-800 leading-relaxed">
                    "{selectedLeadForDetail.postContent}"
                  </div>
                </div>
              )}

              {/* Next best action recommendation */}
              <div className="p-3.5 bg-[#E6F0FA]/90 border border-[#5C1D3A]/20 rounded-xl text-[#0F0F12] space-y-1 shadow-xs">
                <span className="font-bold text-[11px] uppercase tracking-wider text-[#0F0F12] flex items-center space-x-1">
                  <Sparkles className="h-3 w-3 text-[#E5C158]" />
                  <span>Suggested Next Action:</span>
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedLeadForDetail.status === 'CALENDLY_SENT'
                    ? '📱 Await prospect booking via SMS or trigger follow-up.'
                    : selectedLeadForDetail.status === 'QUALIFIED'
                    ? '📞 Dispatch Voice AI Agent to qualify timeline and budget.'
                    : 'Dispatch introductory solution deck and case study.'}
                </p>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-[#5C1D3A]/15 bg-[#E6F0FA]/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLeadForDetail(null)}
                className="btn-primary-black px-5 py-2 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <BusinessAnalyzeModal
        isOpen={isAnalyzeOpen}
        onClose={() => setIsAnalyzeOpen(false)}
        onAnalysisSuccess={() => {
          setIsAnalyzeOpen(false);
          fetchLeads();
        }}
      />

      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={() => {
          setIsImportOpen(false);
          fetchLeads();
        }}
      />
    </div>
  );
}
