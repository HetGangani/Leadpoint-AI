'use client';

import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Loader2,
  Link2,
  FileText,
  Globe,
} from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

type ImportSourceTab = 'file' | 'url' | 'paste';

export default function CsvImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: CsvImportModalProps) {
  const [activeTab, setActiveTab] = useState<ImportSourceTab>('file');
  const [file, setFile] = useState<File | null>(null);
  const [remoteUrl, setRemoteUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResultSummary(null);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    setError(null);

    try {
      let res: Response;

      if (activeTab === 'file') {
        if (!file) {
          throw new Error('Please select a CSV or TSV file to import.');
        }
        const text = await file.text();
        res = await fetch('/api/leads/import', {
          method: 'POST',
          headers: { 'Content-Type': 'text/csv' },
          body: text,
        });
      } else if (activeTab === 'url') {
        const trimmedUrl = remoteUrl.trim();
        if (!trimmedUrl) {
          throw new Error('Please enter a remote CSV URL or Google Sheets link.');
        }
        res = await fetch('/api/leads/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmedUrl }),
        });
      } else {
        const trimmedText = pastedText.trim();
        if (!trimmedText) {
          throw new Error('Please paste your CSV data into the text field.');
        }
        res = await fetch('/api/leads/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvText: trimmedText, sourceName: 'CSV Import (Pasted Text)' }),
        });
      }

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to import CSV leads.');
      }

      setResultSummary(data.result);
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during CSV import.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSample = () => {
    const sampleHeaders = 'Name,Business Email,Phone,Company Name,Industry,Company Size,Source Platform,Original Post URL,Requirement Post Text,Relevance Score,Status,Location';
    const sampleRows = [
      '"Marcus Vance","marcus.vance@nexusfintech.example.com","+1 (415) 890-1243","Nexus Financial","Financial Services","250-500 employees","LinkedIn","https://linkedin.com/posts/marcusvance","Evaluating vendor to migrate 4TB SharePoint 2016 farm to SharePoint Online","0.96","QUALIFIED","San Francisco, CA"',
      '"Elena Rostova","e.rostova@aeroglobal.example.com","+1 (206) 555-9012","AeroDynamics Global","Aerospace & Defense","1,000-5,000 employees","LinkedIn","https://linkedin.com/posts/elena-rostova","M365 tenant-to-tenant migration for 1,200 users","0.94","INTERESTED","Seattle, WA"',
      '"Alex Mercer","alex.mercer@apexcloud.io","+1-555-0199","Apex Cloud Systems","Cloud Modernization","50-200","LinkedIn","https://linkedin.com/posts/123","Evaluating Microsoft 365 tenant migration partners for Q4 initiative.","0.92","NEW","Remote"',
    ].join('\n');

    const csvContent = `${sampleHeaders}\n${sampleRows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'leadpoint_sample_leads_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isSubmitDisabled = () => {
    if (loading) return true;
    if (activeTab === 'file') return !file;
    if (activeTab === 'url') return !remoteUrl.trim();
    if (activeTab === 'paste') return !pastedText.trim();
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F0F12]/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-modal rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#5C1D3A]/15 flex items-center justify-between bg-[#E6F0FA]/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#E6F0FA] text-[#0F0F12] rounded-xl border border-[#5C1D3A]/20">
              <FileSpreadsheet className="h-4 w-4 text-[#E5C158]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0F0F12] tracking-tight">Multi-Source Lead Import</h2>
              <p className="text-xs text-slate-600">Import leads from CSV files, Google Sheets, remote URLs, or pasted tables</p>
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
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {error && (
            <div className="p-3 bg-[#F87171]/15 border border-[#F87171]/40 text-rose-800 rounded-xl flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {!resultSummary ? (
            <>
              {/* Source Tabs */}
              <div className="flex border-b border-[#5C1D3A]/15 text-xs pb-1 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('file');
                    setError(null);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                    activeTab === 'file'
                      ? 'bg-white border border-[#5C1D3A]/20 text-[#0F0F12] shadow-xs'
                      : 'text-slate-500 hover:text-[#0F0F12]'
                  }`}
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Upload File</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('url');
                    setError(null);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                    activeTab === 'url'
                      ? 'bg-white border border-[#5C1D3A]/20 text-[#0F0F12] shadow-xs'
                      : 'text-slate-500 hover:text-[#0F0F12]'
                  }`}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Google Sheets / Remote URL</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('paste');
                    setError(null);
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                    activeTab === 'paste'
                      ? 'bg-white border border-[#5C1D3A]/20 text-[#0F0F12] shadow-xs'
                      : 'text-slate-500 hover:text-[#0F0F12]'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Paste Raw Text</span>
                </button>
              </div>

              {/* Tab 1: File Dropzone */}
              {activeTab === 'file' && (
                <div className="border-2 border-dashed border-[#5C1D3A]/25 rounded-2xl p-6 text-center hover:border-[#0F0F12] transition bg-white/50">
                  <input
                    type="file"
                    id="csvFile"
                    accept=".csv, .tsv, .txt, text/csv, text/tab-separated-values"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="csvFile" className="cursor-pointer flex flex-col items-center">
                    <UploadCloud className="h-8 w-8 text-[#0F0F12] mb-2" />
                    <span className="font-extrabold text-[#0F0F12] text-sm">
                      {file ? file.name : 'Click to select or drag CSV / TSV file'}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      Accepts .csv, .tsv, or .txt files up to 10MB
                    </span>
                  </label>
                </div>
              )}

              {/* Tab 2: URL / Google Sheets */}
              {activeTab === 'url' && (
                <div className="space-y-3 p-4 bg-white/70 border border-[#5C1D3A]/15 rounded-2xl">
                  <div className="flex items-center space-x-2 text-[#0F0F12] font-bold text-xs">
                    <Globe className="h-4 w-4 text-[#E5C158]" />
                    <span>Enter Remote CSV URL or Google Sheets Link</span>
                  </div>
                  <input
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/... or https://domain.com/leads.csv"
                    value={remoteUrl}
                    onChange={(e) => setRemoteUrl(e.target.value)}
                    className="w-full bg-white border border-[#5C1D3A]/25 rounded-xl px-3.5 py-2.5 text-xs text-[#0F0F12] placeholder-slate-400 focus:outline-none focus:border-[#0F0F12] transition"
                  />
                  <p className="text-[11px] text-slate-600">
                    💡 <strong>Google Sheets Tip:</strong> Make sure your sheet is set to <em>"Anyone with the link can view"</em>. LeadPoint will automatically extract and parse the live CSV export feed.
                  </p>
                </div>
              )}

              {/* Tab 3: Paste CSV */}
              {activeTab === 'paste' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#0F0F12]">
                    Paste CSV or Tab-Delimited Data (Including Header Row):
                  </label>
                  <textarea
                    rows={5}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Name,Business Email,Phone,Company Name,Industry&#10;John Doe,john@acme.com,+1234567890,Acme Corp,Tech"
                    className="w-full bg-white border border-[#5C1D3A]/25 rounded-xl p-3 text-xs font-mono text-[#0F0F12] placeholder-slate-400 focus:outline-none focus:border-[#0F0F12] transition"
                  />
                </div>
              )}

              {/* Sample Template Download */}
              <div className="flex items-center justify-between p-3.5 bg-white/70 border border-[#5C1D3A]/15 rounded-xl">
                <span className="text-slate-700 font-medium">Need the correct column structure?</span>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="btn-secondary-glass inline-flex items-center space-x-1.5 px-3 py-1.5 font-semibold text-xs"
                >
                  <Download className="h-3.5 w-3.5 text-[#0F0F12]" />
                  <span>Download Sample CSV</span>
                </button>
              </div>

              {/* Security & Validation Notice */}
              <div className="space-y-1.5 p-3.5 rounded-xl bg-[#E6F0FA]/80 border border-[#5C1D3A]/15 text-[11px] text-[#0F0F12] leading-normal shadow-xs">
                <div className="flex items-center space-x-1 font-bold text-[#0F0F12]">
                  <ShieldAlert className="h-3.5 w-3.5 text-[#E5C158]" />
                  <span>Validation Engine Guarantees:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                  <li>Validates business email address via RFC-compliant regex</li>
                  <li>Deduplicates rows by business email across your tenant database</li>
                  <li>Normalizes phone numbers to E.164 standard for telephony</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary-glass px-4 py-2 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isSubmitDisabled()}
                  className="btn-primary-black px-5 py-2 font-bold flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F6E27A]" />
                      <span>Fetching & Importing...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-3.5 w-3.5" />
                      <span>
                        {activeTab === 'url' ? 'Fetch & Import Leads' : 'Process & Import Leads'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Result Summary View */
            <div className="space-y-4">
              <div className="p-4 bg-[#34D399]/15 border border-[#34D399]/40 rounded-2xl flex items-center space-x-3 text-emerald-900">
                <CheckCircle className="h-5 w-5 text-emerald-700 shrink-0" />
                <div>
                  <div className="font-bold text-xs">CSV Import Processed Successfully</div>
                  <div className="text-[11px] text-emerald-800">All rows parsed, validated, and scoped to your organization.</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3.5 bg-white/70 border border-[#5C1D3A]/15 rounded-xl">
                  <div className="text-xl font-extrabold text-[#0F0F12]">{resultSummary.totalProcessed ?? resultSummary.importedCount + resultSummary.duplicatesSkipped + resultSummary.invalidEmailsCount}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Total Processed</div>
                </div>
                <div className="p-3.5 bg-[#34D399]/15 border border-[#34D399]/40 rounded-xl">
                  <div className="text-xl font-extrabold text-emerald-900">{resultSummary.importedCount}</div>
                  <div className="text-[10px] text-emerald-800 font-bold uppercase mt-0.5">Successfully Added</div>
                </div>
                <div className="p-3.5 bg-[#FBBF24]/15 border border-[#FBBF24]/40 rounded-xl">
                  <div className="text-xl font-extrabold text-amber-900">{resultSummary.duplicatesSkipped}</div>
                  <div className="text-[10px] text-amber-800 font-bold uppercase mt-0.5">Duplicates Skipped</div>
                </div>
              </div>

              {/* Skipped Details Log */}
              {resultSummary.skippedDetails && resultSummary.skippedDetails.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-700 text-xs">Skipped Lead Details Log</h4>
                  <div className="max-h-36 overflow-y-auto p-3 bg-white/80 border border-[#5C1D3A]/15 rounded-xl space-y-1 font-mono text-[11px]">
                    {resultSummary.skippedDetails.map((detail: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-slate-600 border-b border-slate-100 pb-1">
                        <span className="text-[#0F0F12] truncate max-w-[200px]">{detail.email}</span>
                        <span className="text-amber-700 text-[10px] font-medium">{detail.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setResultSummary(null);
                    setFile(null);
                    setRemoteUrl('');
                    setPastedText('');
                  }}
                  className="btn-secondary-glass px-4 py-2 font-semibold"
                >
                  Import Another Source
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary-black px-5 py-2 font-bold"
                >
                  View Discovered Leads
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
