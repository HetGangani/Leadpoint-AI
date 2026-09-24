'use client';

import React, { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, Download, AlertTriangle, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export default function CsvImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: CsvImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
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

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file to import.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();

      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: text,
      });

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

  const downloadSampleCSV = () => {
    const sampleHeaders = 'Name,Business Email,Phone,Company Name,Industry,Company Size,Source Platform,Original Post URL,Requirement Post Text,Relevance Score,Status,Location';
    const sampleRows = [
      '"Marcus Vance","marcus.vance@nexusfintech.example.com","+1 (415) 890-1243","Nexus Financial","Financial Services","250-500 employees","LinkedIn","https://linkedin.com/posts/marcusvance","Evaluating vendor to migrate 4TB SharePoint 2016 farm to SharePoint Online","0.96","QUALIFIED","San Francisco, CA"',
      '"Elena Rostova","e.rostova@aeroglobal.example.com","+1 (206) 555-9012","AeroDynamics Global","Aerospace & Defense","1,000-5,000 employees","LinkedIn","https://linkedin.com/posts/elena-rostova","M365 tenant-to-tenant migration for 1,200 users","0.94","INTERESTED","Seattle, WA"',
      '"Invalid Lead Example","invalid-email-no-at-sign","+1 (555) 000-0000","Bad Data Corp","Software","50 employees","CSV Import","","This will fail regex validation","0.50","NEW","Remote"',
    ].join('\n');

    const csvContent = `${sampleHeaders}\n${sampleRows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'leadpoint_sample_import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Lead CSV / Excel Import</h2>
              <p className="text-xs text-slate-400">Import leads with automatic email regex validation and duplicate detection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-slate-300">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center space-x-3 text-xs">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!resultSummary ? (
            <div className="space-y-5">
              {/* Regex & Rules banner */}
              <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-indigo-300 font-medium">
                  <span className="flex items-center space-x-2">
                    <ShieldAlert className="h-4 w-4 text-indigo-400" />
                    <span>Engine Rules & Validation Rules</span>
                  </span>
                  <button
                    onClick={downloadSampleCSV}
                    className="text-blue-400 hover:underline flex items-center space-x-1 text-[11px]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Sample CSV</span>
                  </button>
                </div>
                <ul className="text-slate-400 space-y-1 pl-5 list-disc text-[11px] leading-relaxed">
                  <li>
                    <strong className="text-slate-300">Email Regex:</strong> Validates against strict business email pattern (<code className="text-blue-300 font-mono">{'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'}</code>).
                  </li>
                  <li>
                    <strong className="text-slate-300">Duplicate Check:</strong> Checks database by business email and original post URL to skip duplicates automatically.
                  </li>
                </ul>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/50 rounded-2xl p-8 text-center flex flex-col items-center justify-center transition">
                <UploadCloud className="h-10 w-10 text-indigo-400 mb-3" />
                <p className="text-sm font-semibold text-slate-200 mb-1">
                  {file ? file.name : 'Select or drag your CSV file'}
                </p>
                <p className="text-xs text-slate-500 mb-4">CSV or TXT files supported up to 10MB</p>
                <input
                  type="file"
                  accept=".csv, text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-file-input"
                />
                <label
                  htmlFor="csv-file-input"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition"
                >
                  {file ? 'Change File' : 'Browse File'}
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 flex items-center space-x-2 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing File...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" />
                      <span>Process & Import CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Results View */
            <div className="space-y-5 text-xs">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-3 text-emerald-400">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span className="font-medium">CSV Import Complete! See verification summary below.</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="block text-slate-400 text-[11px]">Successfully Imported</span>
                  <span className="text-xl font-bold text-emerald-400">{resultSummary.importedCount}</span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="block text-slate-400 text-[11px]">Duplicates Skipped</span>
                  <span className="text-xl font-bold text-amber-400">{resultSummary.duplicatesSkipped}</span>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="block text-slate-400 text-[11px]">Regex Rejected Emails</span>
                  <span className="text-xl font-bold text-red-400">{resultSummary.invalidEmailsCount}</span>
                </div>
              </div>

              {/* Skipped Details Log */}
              {resultSummary.skippedDetails && resultSummary.skippedDetails.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-300 text-xs">Skipped Lead Details Log</h4>
                  <div className="max-h-40 overflow-y-auto p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 font-mono text-[11px]">
                    {resultSummary.skippedDetails.map((detail: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-slate-400 border-b border-slate-900 pb-1">
                        <span className="text-slate-300 truncate max-w-[200px]">{detail.email}</span>
                        <span className="text-amber-400 text-[10px]">{detail.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResultSummary(null);
                    setFile(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs transition"
                >
                  Import Another File
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
                >
                  Close & View Leads
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
