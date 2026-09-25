'use client';

import React, { useState } from 'react';
import { X, Sparkles, Building2, Globe, CheckCircle2, Target, Search, AlertCircle, Loader2 } from 'lucide-react';

interface BusinessAnalyzeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisSuccess?: (data: any) => void;
}

export default function BusinessAnalyzeModal({
  isOpen,
  onClose,
  onAnalysisSuccess,
}: BusinessAnalyzeModalProps) {
  const [companyName, setCompanyName] = useState('CloudScale Consulting Group');
  const [companyUrl, setCompanyUrl] = useState('https://www.cloudscaleconsulting.example.com');
  const [description, setDescription] = useState(
    'Enterprise IT consulting firm specializing in SharePoint Server 2016/2019 to SharePoint Online modernizations, Microsoft 365 tenant-to-tenant migrations, Azure identity governance, and Zero Trust security architectures.'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/business/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          companyUrl,
          description,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze business details.');
      }

      setResult(data.data);
      if (onAnalysisSuccess) {
        onAnalysisSuccess(data.data);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing business details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0F12]/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-modal rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#5C1D3A]/15 flex items-center justify-between bg-[#E6F0FA]/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#E6F0FA] text-[#0F0F12] rounded-xl border border-[#5C1D3A]/20">
              <Sparkles className="h-4 w-4 text-[#E5C158]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0F0F12] tracking-tight">Business ICP & Intent Query Analyzer</h2>
              <p className="text-xs text-slate-600">Extract value props, target client ICP, and social search triggers</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-[#0F0F12] rounded-xl hover:bg-white/60 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700">
          {error && (
            <div className="p-3 bg-[#F87171]/15 border border-[#F87171]/40 text-rose-800 rounded-xl flex items-center space-x-2 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                  <Building2 className="h-3.5 w-3.5 text-[#0F0F12]" />
                  <span>Company Name</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="CloudScale Consulting Group"
                  className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-3.5 py-2 text-[#0F0F12] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F0F12] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                  <Globe className="h-3.5 w-3.5 text-[#0F0F12]" />
                  <span>Company Website URL</span>
                </label>
                <input
                  type="url"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  placeholder="https://www.cloudscaleconsulting.example.com"
                  className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-3.5 py-2 text-[#0F0F12] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F0F12] text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Business Description & Value Propositions
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter details about your services, specialized offerings, target market, etc."
                  className="w-full bg-white/80 border border-[#5C1D3A]/20 rounded-xl px-3.5 py-2 text-[#0F0F12] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F0F12] text-xs leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary-glass px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-black px-5 py-2 text-xs font-bold flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F6E27A]" />
                      <span>Analyzing Profile...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-[#E5C158]" />
                      <span>Run AI Analysis</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="p-3.5 bg-[#34D399]/15 border border-[#34D399]/40 rounded-2xl flex items-center space-x-2.5 text-xs text-emerald-900 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>Business ICP profile analyzed and registered for autonomous matching!</span>
              </div>

              {/* Value propositions */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center space-x-1.5">
                  <Target className="h-3.5 w-3.5 text-[#0F0F12]" />
                  <span>Identified Value Propositions</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {result.valuePropositions?.map((vp: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-white/70 border border-[#5C1D3A]/15 rounded-xl space-y-1">
                      <div className="font-bold text-[#0F0F12] text-xs">{vp.title}</div>
                      <div className="text-[11px] text-slate-600 leading-normal">{vp.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search Triggers */}
              {result.searchQueryTriggers && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center space-x-1.5">
                    <Search className="h-3.5 w-3.5 text-[#0F0F12]" />
                    <span>Social Intent Search Triggers</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {result.searchQueryTriggers.map((q: string, i: number) => (
                      <span key={i} className="text-xs bg-[#E6F0FA] border border-[#5C1D3A]/20 text-[#0F0F12] px-2.5 py-1 rounded-lg font-medium">
                        "{q}"
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-[#5C1D3A]/15 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="btn-secondary-glass px-4 py-2 text-xs font-semibold"
                >
                  Analyze Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary-black px-5 py-2 text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
