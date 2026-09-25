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
  Trash2,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';
import BusinessAnalyzeModal from './BusinessAnalyzeModal';
import CsvImportModal from './CsvImportModal';

export default function LeadDiscoveryPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [harvesting, setHarvesting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Selection and deletion state
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

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

  // Harvest public requirements via Multi-Source Crawler (FR-2.1)
  const handleHarvestLeads = async () => {
    setHarvesting(true);
    try {
      const res = await fetch('/api/leads/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          industry: selectedIndustry,
          keywords: searchQuery.trim() ? [searchQuery.trim()] : undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.allLeads) {
        setLeads(data.allLeads);
        setFeedbackMessage(data.message || `Discovered ${data.newLeadsCount} new high-intent lead postings.`);
      }
    } catch (err) {
      console.error('Harvesting error:', err);
    } finally {
      setHarvesting(false);
      setTimeout(() => setFeedbackMessage(null), 5000);
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

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (leadsToSelect: any[]) => {
    if (selectedLeadIds.length === leadsToSelect.length && leadsToSelect.length > 0) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leadsToSelect.map((l) => l.id));
    }
  };

  const handleDeleteSingle = async (leadId: string, companyName: string) => {
    if (!window.confirm(`Permanently delete lead for "${companyName}"? This will also remove any related call records.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage(`Lead for "${companyName}" has been deleted.`);
        setSelectedLeadIds((prev) => prev.filter((id) => id !== leadId));
        fetchLeads();
      } else {
        alert(`Failed to delete lead: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error deleting lead: ${err.message}`);
    } finally {
      setDeleting(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLeadIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedLeadIds.length} selected lead(s)? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: selectedLeadIds }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage(`Successfully deleted ${data.deletedCount} lead(s).`);
        setSelectedLeadIds([]);
        fetchLeads();
      } else {
        alert(`Failed to delete leads: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error deleting leads: ${err.message}`);
    } finally {
      setDeleting(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
  };

  const handleDeleteUsed = async () => {
    if (!window.confirm('Delete all USED leads (leads that have been contacted, called, or moved beyond NEW status)?')) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter: 'used' }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackMessage(`Cleaned up ${data.deletedCount} used lead(s).`);
        setSelectedLeadIds([]);
        fetchLeads();
      } else {
        alert(`Failed to clean up leads: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeleting(false);
      setTimeout(() => setFeedbackMessage(null), 4000);
    }
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

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 rounded-2xl text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bulk Action & Management Toolbar */}
      {!loading && filteredLeads.length > 0 && (
        <div className="p-3 glass-card-solid rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => handleSelectAll(filteredLeads)}
              className="flex items-center space-x-2 text-slate-700 hover:text-[#0F0F12] transition px-2.5 py-1.5 rounded-xl hover:bg-[#E6F0FA]/60 font-semibold"
            >
              {selectedLeadIds.length === filteredLeads.length ? (
                <CheckSquare className="h-4 w-4 text-[#0F0F12]" />
              ) : (
                <Square className="h-4 w-4 text-slate-400" />
              )}
              <span>
                {selectedLeadIds.length === filteredLeads.length
                  ? 'Deselect All'
                  : `Select All (${filteredLeads.length})`}
              </span>
            </button>

            {selectedLeadIds.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#E6F0FA] border border-[#5C1D3A]/20 text-[#0F0F12] font-bold text-[11px]">
                {selectedLeadIds.length} selected
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {selectedLeadIds.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-700 border border-red-500/20 rounded-xl transition font-semibold text-xs disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Selected ({selectedLeadIds.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDeleteUsed}
              disabled={deleting}
              className="btn-secondary-glass flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              title="Purge leads that have been contacted, called, or booked"
            >
              <Trash2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Clean Up Used Leads</span>
            </button>
          </div>
        </div>
      )}

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
                    <th scope="col" className="w-10 px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleSelectAll(filteredLeads)}
                        title="Toggle Select All"
                      >
                        {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? (
                          <CheckSquare className="h-4 w-4 text-[#0F0F12]" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                    </th>
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
                    const isSelected = selectedLeadIds.includes(lead.id);
                    let enriched: any = {};
                    try {
                      enriched = JSON.parse(lead.enrichedData || '{}');
                    } catch (e) {}

                    return (
                      <tr
                        key={lead.id}
                        className={`transition-colors group ${
                          isSelected ? 'bg-[#E6F0FA]/80' : 'hover:bg-[#E6F0FA]/40'
                        }`}
                      >
                        <td className="w-10 px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(lead.id)}
                            className="p-1 text-slate-400 hover:text-[#0F0F12] transition"
                            title={isSelected ? 'Deselect lead' : 'Select lead'}
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-[#0F0F12]" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-400" />
                            )}
                          </button>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-[#0F0F12] text-[#F6E27A] border border-[#E5C158]/30 font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                              {lead.name ? lead.name.charAt(0).toUpperCase() : 'L'}
                            </div>
                            <div>
                              <div className="font-bold text-[#0F0F12] flex items-center space-x-2">
                                <span>{lead.name}</span>
                                {enriched.urgencyLevel && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                      enriched.urgencyLevel === 'CRITICAL'
                                        ? 'bg-red-500/15 border-red-500/30 text-red-800'
                                        : enriched.urgencyLevel === 'HIGH'
                                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-800'
                                        : 'bg-blue-500/10 border-blue-500/20 text-blue-800'
                                    }`}
                                  >
                                    ⚡ {enriched.urgencyLevel}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span>{lead.businessEmail}</span>
                                {lead.phone && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <Phone className="h-3 w-3 text-slate-400" />
                                    <span>{lead.phone}</span>
                                  </>
                                )}
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
                          <div className="inline-flex items-center space-x-1.5 justify-end">
                            {/* Call Lead Button */}
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const res = await fetch('/api/voice/call', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ leadId: lead.id }),
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    alert(`Call initiated via ${data.data.provider.toUpperCase()} provider!\nStatus: ${data.data.status.toUpperCase()}\nProvider Call ID: ${data.data.providerCallId}`);
                                  } else {
                                    alert(`Call initiation failed: ${data.error}`);
                                  }
                                  fetchLeads();
                                } catch (err: any) {
                                  alert(`Error calling lead: ${err.message}`);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center space-x-1 shadow-xs transition"
                              title="Initiate live Twilio phone call"
                            >
                              <Phone className="h-3 w-3" />
                              <span>Call</span>
                            </button>

                            {/* Simulate Call Button */}
                            <a
                              href={`/voice?leadId=${lead.id}`}
                              className="px-2.5 py-1 rounded-lg bg-[#0F0F12] text-[#F6E27A] hover:bg-[#1A1A22] text-[11px] font-semibold flex items-center space-x-1 transition shadow-xs"
                              title="Simulate Voice SDR Agent"
                            >
                              <Sparkles className="h-3 w-3 text-[#E5C158]" />
                              <span>Simulate</span>
                            </a>

                            {lead.status === 'CALENDLY_SENT' && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await fetch(`/api/webhooks/calendly`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ leadId: lead.id, inviteeEmail: lead.businessEmail }),
                                  });
                                  fetchLeads();
                                }}
                                className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-semibold hover:bg-emerald-100 transition"
                                title="Simulate Calendly Booking Webhook"
                              >
                                Booked
                              </button>
                            )}

                            {/* Inspect Details Button */}
                            <button
                              type="button"
                              onClick={() => setSelectedLeadForDetail(lead)}
                              className="btn-secondary-glass inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold"
                              title="Inspect lead details"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="h-3 w-3" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteSingle(lead.id, lead.companyName)}
                              disabled={deleting}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete lead permanently"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
              const isSelected = selectedLeadIds.includes(lead.id);
              let techStack: string[] = [];
              let enriched: any = {};
              try {
                enriched = JSON.parse(lead.enrichedData || '{}');
                if (Array.isArray(enriched.techStack)) techStack = enriched.techStack;
              } catch (e) {}

              return (
                <div
                  key={lead.id}
                  className={`glass-card-solid rounded-2xl p-4 shadow-sm space-y-3 transition ${
                    isSelected ? 'ring-2 ring-[#0F0F12] bg-[#E6F0FA]/80' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(lead.id)}
                        className="p-1 mt-0.5 text-slate-400 hover:text-[#0F0F12] transition"
                        title={isSelected ? 'Deselect lead' : 'Select lead'}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-[#0F0F12]" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-400" />
                        )}
                      </button>
                      <div>
                        <h3 className="font-extrabold text-[#0F0F12] text-sm">{lead.name}</h3>
                        <div className="text-xs text-slate-600 flex items-center space-x-1 mt-0.5">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          <span>{lead.companyName}</span>
                          <span className="text-slate-300">•</span>
                          <span>{lead.industry}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {enriched.urgencyLevel && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          enriched.urgencyLevel === 'CRITICAL'
                            ? 'bg-red-500/15 border-red-500/30 text-red-800'
                            : enriched.urgencyLevel === 'HIGH'
                            ? 'bg-amber-500/15 border-amber-500/30 text-amber-800'
                            : 'bg-blue-500/10 border-blue-500/20 text-blue-800'
                        }`}
                      >
                        ⚡ {enriched.urgencyLevel} Urgency
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-white/70 border border-[#5C1D3A]/15 text-slate-700 font-medium">
                      {lead.sourcePlatform || 'LinkedIn'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#34D399]/15 text-emerald-900 border border-[#34D399]/40">
                      {score}% Match
                    </span>
                  </div>

                  {/* Requirement Post Text */}
                  {lead.postContent && (
                    <div className="p-3 bg-white/70 border border-[#5C1D3A]/15 rounded-xl text-xs text-slate-700 leading-relaxed space-y-2">
                      <div>
                        <span className="text-slate-500 font-bold text-[10px] block mb-1 uppercase tracking-wider">
                          Requirement Post Text
                        </span>
                        "{lead.postContent}"
                      </div>

                      {/* Required Tech Stack & Budget Entities (FR-2.2) */}
                      {(techStack.length > 0 || enriched.estimatedBudget) && (
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#5C1D3A]/10">
                          {techStack.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 font-semibold uppercase">Tech Stack:</span>
                              {techStack.map((tech, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 border border-indigo-200 text-indigo-700"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}

                          {enriched.estimatedBudget && (
                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-semibold ml-auto">
                              <span>Budget: {enriched.estimatedBudget}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

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

                  {/* Action Controls for Voice Calling / Calendly / Follow-up */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#5C1D3A]/10 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Call Lead Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/voice/call', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ leadId: lead.id }),
                            });
                            const data = await res.json();
                            if (data.success) {
                              alert(`Call initiated via ${data.data.provider.toUpperCase()} provider!\nStatus: ${data.data.status.toUpperCase()}\nProvider Call ID: ${data.data.providerCallId}`);
                            } else {
                              alert(`Call initiation failed: ${data.error}`);
                            }
                            fetchLeads();
                          } catch (err: any) {
                            alert(`Error calling lead: ${err.message}`);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center space-x-1 shadow-xs transition"
                      >
                        <Phone className="h-3 w-3" />
                        <span>Call</span>
                      </button>

                      {/* Simulate AI Call Link Button */}
                      <a
                        href={`/voice?leadId=${lead.id}`}
                        className="px-2.5 py-1 rounded-lg bg-[#0F0F12] text-[#F6E27A] hover:bg-[#1A1A22] text-[11px] font-semibold flex items-center space-x-1 transition shadow-xs"
                      >
                        <Sparkles className="h-3 w-3 text-[#E5C158]" />
                        <span>Simulate</span>
                      </a>

                      {lead.status === 'CALENDLY_SENT' && (
                        <>
                          <button
                            type="button"
                            onClick={async () => {
                              await fetch(`/api/webhooks/calendly`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ leadId: lead.id, inviteeEmail: lead.businessEmail }),
                              });
                              fetchLeads();
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-semibold hover:bg-emerald-100 transition"
                          >
                            Simulate Booking
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await fetch(`/api/leads/${lead.id}/calendly-check?flagFollowUp=true`);
                              fetchLeads();
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-semibold hover:bg-amber-100 transition"
                          >
                            Flag Re-call
                          </button>
                        </>
                      )}

                      {lead.originalPostUrl && (
                        <a
                          href={lead.originalPostUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-[#0F0F12] hover:underline text-[11px] font-medium transition"
                        >
                          <span>Post</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedLeadForDetail(lead)}
                        className="btn-secondary-glass inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold"
                      >
                        <span>Details</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>

                      {/* Delete Lead Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSingle(lead.id, lead.companyName)}
                        disabled={deleting}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete lead permanently"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
