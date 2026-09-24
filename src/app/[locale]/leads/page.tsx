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
  Zap,
  Globe,
  Layers,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
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
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedScore, setSelectedScore] = useState('ALL');

  // Modals state
  const [isAnalyzeOpen, setIsAnalyzeOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

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
  const locations = ['ALL', 'San Francisco', 'Seattle', 'Chicago', 'New York', 'Atlanta', 'Washington, DC'];
  const scores = [
    { label: 'All Scores', value: 'ALL' },
    { label: 'High Intent (>90%)', value: 'HIGH' },
    { label: 'Medium Intent (>80%)', value: 'MEDIUM' },
  ];

  // Filtering logic
  const filteredLeads = leads.filter((lead) => {
    // Platform match
    if (selectedPlatform !== 'ALL') {
      const p = lead.sourcePlatform?.toLowerCase() || '';
      if (!p.includes(selectedPlatform.toLowerCase())) return false;
    }

    // Industry match
    if (selectedIndustry !== 'ALL') {
      const ind = lead.industry?.toLowerCase() || '';
      if (!ind.includes(selectedIndustry.toLowerCase())) return false;
    }

    // Location match
    if (selectedLocation !== 'ALL') {
      let locStr = '';
      try {
        const enriched = JSON.parse(lead.enrichedData || '{}');
        locStr = enriched.headquarters || '';
      } catch (e) {}
      if (!locStr.toLowerCase().includes(selectedLocation.toLowerCase())) return false;
    }

    // Score match
    if (selectedScore === 'HIGH' && (lead.relevanceScore || 0) < 0.9) return false;
    if (selectedScore === 'MEDIUM' && (lead.relevanceScore || 0) < 0.8) return false;

    // Search Query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = lead.name?.toLowerCase().includes(q);
      const companyMatch = lead.companyName?.toLowerCase().includes(q);
      const emailMatch = lead.businessEmail?.toLowerCase().includes(q);
      const postMatch = lead.postContent?.toLowerCase().includes(q);
      if (!nameMatch && !companyMatch && !emailMatch && !postMatch) return false;
    }

    return true;
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <a
            href="/en"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition flex items-center text-xs space-x-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </a>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                LeadPoint AI • Lead Discovery & Sourcing
              </h1>
              <p className="text-xs text-slate-400">Autonomous social requirement harvesting & intent scoring</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAnalyzeOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center space-x-2 transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Analyze Business ICP</span>
          </button>

          <button
            onClick={handleHarvestLeads}
            disabled={harvesting}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${harvesting ? 'animate-spin' : ''}`} />
            <span>{harvesting ? 'Harvesting...' : 'Harvest Requirements'}</span>
          </button>

          <button
            onClick={() => setIsImportOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-600/25 transition"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-emerald-600/25 transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export to CSV</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="p-6 max-w-7xl mx-auto w-full space-y-6 flex-1">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block mb-1">Total Discovered Leads</span>
              <span className="text-2xl font-bold text-white">{leads.length}</span>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <Target className="h-5 w-5" />
            </div>
          </div>

          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block mb-1">High Intent (&gt;90% Score)</span>
              <span className="text-2xl font-bold text-emerald-400">
                {leads.filter((l) => (l.relevanceScore || 0) >= 0.9).length}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block mb-1">Harvested Sources</span>
              <span className="text-2xl font-bold text-purple-400">4 Platforms</span>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
              <Globe className="h-5 w-5" />
            </div>
          </div>

          <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium block mb-1">Regex Validated Emails</span>
              <span className="text-2xl font-bold text-indigo-400">
                {leads.filter((l) => l.businessEmail).length}
              </span>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <Mail className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Multi-Filter Bar & Search */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads, posts, or company..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter Indicators */}
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Filter className="h-4 w-4 text-blue-400" />
              <span>Active Filters:</span>
              <span className="font-semibold text-slate-200">
                {filteredLeads.length} of {leads.length} leads matching
              </span>
            </div>
          </div>

          {/* Filter Dropdown Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
            {/* Platform Filter */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Platform Source</label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {platforms.map((p) => (
                  <option key={p} value={p}>
                    {p === 'ALL' ? 'All Platforms' : p}
                  </option>
                ))}
              </select>
            </div>

            {/* Industry Filter */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Industry Vertical</label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind === 'ALL' ? 'All Industries' : ind}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Location / HQ</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc === 'ALL' ? 'All Locations' : loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Relevance Score Filter */}
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Relevance Score</label>
              <select
                value={selectedScore}
                onChange={(e) => setSelectedScore(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {scores.map((sc) => (
                  <option key={sc.value} value={sc.value}>
                    {sc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lead List / Cards Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
            <p className="text-xs">Loading social requirement leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 space-y-3">
            <Target className="h-10 w-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No matching leads found</p>
            <p className="text-xs text-slate-500">Try adjusting your multi-filter selections or run "Harvest Requirements".</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeads.map((lead) => {
              const scorePercent = Math.round((lead.relevanceScore || 0.85) * 100);
              let location = 'Remote / Unspecified';
              let techStack: string[] = [];
              try {
                const enriched = JSON.parse(lead.enrichedData || '{}');
                if (enriched.headquarters) location = enriched.headquarters;
                if (Array.isArray(enriched.techStack)) techStack = enriched.techStack;
              } catch (e) {}

              return (
                <div
                  key={lead.id}
                  className="p-5 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl shadow-lg transition space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div className="flex items-start space-x-3">
                      <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-blue-400">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-white text-sm">{lead.companyName}</h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-300">
                            {lead.industry}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                          <span>{lead.name}</span>
                          <span>•</span>
                          <span>{lead.companySize}</span>
                          <span>•</span>
                          <span>{location}</span>
                        </p>
                      </div>
                    </div>

                    {/* Platform & Intent Score Badges */}
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-purple-500/10 border border-purple-500/20 text-purple-300">
                        {lead.sourcePlatform}
                      </span>
                      <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{scorePercent}% Match</span>
                      </div>
                    </div>
                  </div>

                  {/* Requirement Post Text */}
                  {lead.postContent && (
                    <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs text-slate-300 leading-relaxed font-sans">
                      <span className="text-slate-500 font-mono text-[10px] block mb-1 uppercase tracking-wider">
                        Requirement Post Text
                      </span>
                      "{lead.postContent}"
                    </div>
                  )}

                  {/* Contact Availability & Metadata Footer */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1 text-xs">
                    <div className="flex flex-wrap items-center gap-4 text-slate-400">
                      <div className="flex items-center space-x-1.5 text-slate-300">
                        <Mail className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="font-mono text-[11px]">{lead.businessEmail}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center space-x-1.5 text-slate-300">
                          <Phone className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="font-mono text-[11px]">{lead.phone}</span>
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500">
                        Discovered: {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Original Post URL Link */}
                    {lead.originalPostUrl && (
                      <a
                        href={lead.originalPostUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 text-blue-400 hover:text-blue-300 text-xs font-medium transition"
                      >
                        <span>View Original Post</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Business Analysis Modal */}
      <BusinessAnalyzeModal
        isOpen={isAnalyzeOpen}
        onClose={() => setIsAnalyzeOpen(false)}
        onAnalysisSuccess={fetchLeads}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={fetchLeads}
      />
    </main>
  );
}
