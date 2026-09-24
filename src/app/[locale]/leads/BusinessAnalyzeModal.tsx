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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Business ICP & Intent Query Analyzer</h2>
              <p className="text-xs text-slate-400">Extract value props, target client ICP, and social search triggers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center space-x-3 text-xs">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center space-x-2">
                  <Building2 className="h-3.5 w-3.5 text-blue-400" />
                  <span>Company Name</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="CloudScale Consulting Group"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center space-x-2">
                  <Globe className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Company Website URL</span>
                </label>
                <input
                  type="url"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  placeholder="https://www.cloudscaleconsulting.example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Business Overview & Service Offerings Document
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter business description, core services, SharePoint / M365 consulting specialties..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 flex items-center space-x-2 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Analyzing with LLM...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Run AI Analysis Engine</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Analysis Results View */
            <div className="space-y-6">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-3 text-emerald-400 text-xs">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>
                  Business analysis complete! Core value propositions, ICP filters, and social search triggers have been extracted and synchronized with your Company Profile.
                </span>
              </div>

              {/* Core Value Props */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Extracted Core Value Propositions</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {result.valuePropositions?.map((vp: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                      <h4 className="font-semibold text-slate-100 text-xs">{vp.title}</h4>
                      <p className="text-[11px] text-slate-400 leading-snug">{vp.description}</p>
                      <div className="text-[10px] text-indigo-400 font-mono pt-1">Impact: {vp.impact}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Client ICP */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Target Client Ideal Customer Profile (ICP)</span>
                </h3>
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1 font-medium">Target Vertical Industries</span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.targetClientICP?.industries?.map((ind: string, i: number) => (
                        <span key={i} className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px]">
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1 font-medium">Target Decision Makers</span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.targetClientICP?.decisionMakers?.map((dm: string, i: number) => (
                        <span key={i} className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px]">
                          {dm}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-full">
                    <span className="text-slate-400 block mb-1 font-medium">Key Client Pain Points Resolved</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
                      {result.targetClientICP?.painPoints?.map((pp: string, i: number) => (
                        <li key={i}>{pp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Intent Search Triggers */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <span>Active Social Intent Search Query Triggers</span>
                </h3>
                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  {result.searchQueryTriggers?.map((st: string, i: number) => (
                    <div key={i} className="flex items-center space-x-2 text-xs text-purple-300 bg-purple-500/5 px-3 py-1.5 rounded-lg border border-purple-500/10 font-mono">
                      <span className="text-purple-400 font-bold">#</span>
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs transition"
                >
                  Re-Analyze
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
                >
                  Done & Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
