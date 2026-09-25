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

  const handleDownloadSample = () => {
    const csvContent =
      'Name,Business Email,Phone,Company,Industry,Company Size,Platform,Original Post URL,Post Content,Relevance Score\n' +
      '"Alex Mercer","alex.mercer@apexcloud.io","+1-555-0199","Apex Cloud Systems","Cloud Modernization","50-200","LinkedIn","https://linkedin.com/posts/123","Evaluating Microsoft 365 tenant migration partners for Q4 initiative.","92"\n' +
      '"Samantha Wu","samantha.wu@fintechglobal.com","+1-555-0188","Fintech Global","Financial Services","500+","LinkedIn","https://linkedin.com/posts/456","Looking for SharePoint 2016 to SharePoint Online modernization firm.","88"\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'leadpoint_sample_leads_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <h2 className="text-base font-extrabold text-[#0F0F12] tracking-tight">Import Leads via CSV</h2>
              <p className="text-xs text-slate-600">Automated email regex validation & duplicate detection</p>
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
              {/* Drag & Drop Zone */}
              <div className="border-2 border-dashed border-[#5C1D3A]/25 rounded-2xl p-6 text-center hover:border-[#0F0F12] transition bg-white/50">
                <input
                  type="file"
                  id="csvFile"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="csvFile" className="cursor-pointer flex flex-col items-center">
                  <UploadCloud className="h-8 w-8 text-[#0F0F12] mb-2" />
                  <span className="font-extrabold text-[#0F0F12] text-sm">
                    {file ? file.name : 'Click to select or drag CSV file'}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    Accepts comma-delimited .csv files up to 5MB
                  </span>
                </label>
              </div>

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
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="btn-primary-black px-5 py-2 font-bold flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F6E27A]" />
                      <span>Processing Leads...</span>
                    </>
                  ) : (
                    <span>Process & Import</span>
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
                  <div className="text-xl font-extrabold text-[#0F0F12]">{resultSummary.totalProcessed}</div>
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

              <div className="pt-2 flex justify-end">
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
