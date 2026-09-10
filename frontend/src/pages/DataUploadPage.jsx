/**
 * DataUploadPage — Single CSV/Excel Upload & Auto-Analysis Page
 * ============================================================
 * Upload a single CSV or Excel sales dataset.
 * Automatically maps columns, fills missing fields with '-',
 * updates database records, and retrains AI models.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ingestionAPI } from '../api/client';
import toast, { Toaster } from 'react-hot-toast';
import {
  HiOutlineCloudArrowUp,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineArrowDownTray,
  HiOutlineArrowTrendingUp,
  HiOutlinePresentationChartBar,
  HiOutlineTableCells,
  HiOutlineSparkles,
} from 'react-icons/hi2';

export default function DataUploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [datasetStatus, setDatasetStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    fetchDatasetStatus();
  }, []);

  const fetchDatasetStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await ingestionAPI.getDatasetStatus();
      setDatasetStatus(res.data);
    } catch (err) {
      console.error('Failed to load dataset status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const ext = selected.name.toLowerCase();
      if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
        toast.error('Please select a valid .csv or .xlsx / .xls file');
        return;
      }
      setFile(selected);
      setUploadResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      const ext = selected.name.toLowerCase();
      if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
        toast.error('Please select a valid .csv or .xlsx / .xls file');
        return;
      }
      setFile(selected);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadStep('Uploading file & normalizing columns...');
    const toastId = toast.loading('Processing sales dataset...');

    try {
      setUploadStep('Fills missing columns with "-" & updating database...');
      const res = await ingestionAPI.uploadSalesDataset(file);
      const data = res.data;

      setUploadStep('Retraining Sales Forecaster & Demand Models...');
      setUploadResult(data);
      toast.success('Dataset uploaded & AI models retrained successfully!', { id: toastId });
      
      fetchDatasetStatus();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to process dataset';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setUploading(false);
      setUploadStep('');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await ingestionAPI.downloadTemplate();
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sales_dataset_sample.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Sample template downloaded');
    } catch (err) {
      toast.error('Failed to download sample template');
    }
  };

  return (
    <div className="page-container fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--bg-secondary)', color: '#fff', border: '1px solid var(--border-color)' }
      }} />

      {/* Header */}
      <header className="page-header flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <HiOutlineCloudArrowUp className="text-indigo-400 text-3xl" />
            Dataset Upload & Auto-Analysis
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Upload your single CSV or Excel sales file. Missing columns will be automatically replaced with <code className="px-1.5 py-0.5 bg-zinc-800 text-indigo-300 rounded font-mono text-xs">'-'</code> without breaking models.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg border border-zinc-700 transition"
        >
          <HiOutlineArrowDownTray className="text-indigo-400 text-base" />
          Download Sample CSV
        </button>
      </header>

      {/* Features Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex items-start gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400">
            <HiOutlineDocumentText className="text-xl" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">Single File Dataset</h4>
            <p className="text-xs text-zinc-400 mt-0.5">Upload 1 CSV or Excel file containing all orders, products & sales lines.</p>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex items-start gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400">
            <HiOutlineCheckCircle className="text-xl" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">Smart Header Mapping</h4>
            <p className="text-xs text-zinc-400 mt-0.5">Fuzzy matches column names like Date, Product, Price, Qty, Category.</p>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex items-start gap-3">
          <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400">
            <HiOutlineSparkles className="text-xl" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">Instant AI Retraining</h4>
            <p className="text-xs text-zinc-400 mt-0.5">Automatically fits Prophet Forecaster & Demand Analyzer on new data.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Dropzone & Upload Action */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
              <HiOutlineCloudArrowUp className="text-indigo-400" />
              Upload Sales File
            </h2>

            {/* Drop Area */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
                file
                  ? 'border-indigo-500/70 bg-indigo-500/5'
                  : 'border-zinc-700/70 hover:border-indigo-500/50 bg-zinc-950/40 hover:bg-zinc-800/20'
              }`}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <input
                id="fileInput"
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="mx-auto w-14 h-14 bg-zinc-800/80 text-indigo-400 rounded-full flex items-center justify-center mb-3">
                <HiOutlineCloudArrowUp className="text-2xl" />
              </div>

              {file ? (
                <div>
                  <p className="text-sm font-semibold text-indigo-300">{file.name}</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {(file.size / 1024).toFixed(1)} KB • Click or drop to change file
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    Drag and drop your single <span className="text-indigo-400">CSV or Excel</span> file here
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Supports .csv, .xlsx, and .xls formats</p>
                </div>
              )}
            </div>

            {/* Missing Column Fallback Notice */}
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5">
              <HiOutlineExclamationTriangle className="text-amber-400 text-lg flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90 leading-relaxed">
                <span className="font-semibold text-amber-300">Missing Columns Policy:</span> Optional columns like Category, CustomerID, or Country will be assigned <code className="px-1 py-0.5 bg-amber-950/80 text-amber-300 rounded font-mono text-[11px]">'-'</code> if not present in your file.
              </p>
            </div>

            {/* Upload Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`px-6 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition ${
                  !file || uploading
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 cursor-pointer'
                }`}
              >
                {uploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{uploadStep || 'Processing...'}</span>
                  </>
                ) : (
                  <>
                    <HiOutlineSparkles className="text-base" />
                    Upload & Run AI Analysis
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Upload Results Details Card */}
          {uploadResult && (
            <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-4">
                <HiOutlineCheckCircle className="text-lg" />
                Latest Upload Results & Schema Details
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
                  <span className="text-zinc-400">Processed File:</span>
                  <p className="text-zinc-100 font-medium text-sm mt-0.5 truncate">{uploadResult.file_name}</p>
                </div>
                <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
                  <span className="text-zinc-400">Total Orders/Lines:</span>
                  <p className="text-zinc-100 font-medium text-sm mt-0.5">{uploadResult.total_rows?.toLocaleString()}</p>
                </div>
              </div>

              {/* Missing Columns List */}
              {uploadResult.missing_columns_filled_with_dash && (
                <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800 mb-4">
                  <span className="text-zinc-400 text-xs">Missing Headers Auto-Filled with <code className="text-amber-300 font-mono">'-'</code>:</span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {uploadResult.missing_columns_filled_with_dash.length > 0 ? (
                      uploadResult.missing_columns_filled_with_dash.map((col) => (
                        <span key={col} className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded font-mono text-[11px]">
                          {col} → '-'
                        </span>
                      ))
                    ) : (
                      <span className="text-emerald-400 text-xs">All standard headers were present in file!</span>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => navigate('/forecast')}
                  className="flex-1 py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition"
                >
                  <HiOutlineArrowTrendingUp className="text-sm" />
                  View Sales Forecast
                </button>
                <button
                  onClick={() => navigate('/demand')}
                  className="flex-1 py-2 px-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition"
                >
                  <HiOutlinePresentationChartBar className="text-sm" />
                  View Demand Analysis
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Currently Active Dataset Status */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
              <HiOutlineTableCells className="text-indigo-400" />
              Active Dataset Summary
            </h2>

            {loadingStatus ? (
              <div className="py-8 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                <span className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                Checking active dataset...
              </div>
            ) : datasetStatus?.has_dataset ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-zinc-400">Dataset File</span>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded border border-emerald-500/20 font-medium">Active</span>
                  </div>
                  <p className="text-zinc-200 font-semibold text-sm">{datasetStatus.file_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 block mb-0.5">Total Records</span>
                    <span className="text-zinc-100 font-bold text-base">{datasetStatus.total_rows?.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 block mb-0.5">Total Revenue</span>
                    <span className="text-emerald-400 font-bold text-base">₹{datasetStatus.total_revenue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400 block mb-1.5">Categories Detected ({datasetStatus.categories?.length || 0})</span>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {datasetStatus.categories?.map((cat) => (
                      <span
                        key={cat}
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          cat === '-'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800 text-center">
                <p className="text-zinc-400 text-xs">Using default pre-loaded sales dataset.</p>
                <p className="text-zinc-500 text-[11px] mt-1">Upload a custom CSV/Excel file above to replace the active dataset.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
