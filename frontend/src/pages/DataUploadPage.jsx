/**
 * DataUploadPage — Single CSV/Excel Upload & Auto-Analysis Page
 * ============================================================
 * Upload a single CSV or Excel sales dataset.
 * Automatically maps columns, detects available vs missing fields,
 * fills missing columns with '-' without crashing, updates DB,
 * and retrains AI models strictly on the uploaded dataset.
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
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineFolderPlus,
} from 'react-icons/hi2';

export default function DataUploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [datasetStatus, setDatasetStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // ── Chrome Browser-Style Multi-Dataset Workspace State ──
  const [workspaces, setWorkspaces] = useState([
    {
      id: 'ws-1',
      title: 'Active Dataset Workspace',
      file: null,
      uploadResult: null,
      uploadError: null,
    },
  ]);
  const [activeWsId, setActiveWsId] = useState('ws-1');

  useEffect(() => {
    fetchDatasetStatus();
  }, []);

  const fetchDatasetStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await ingestionAPI.getDatasetStatus();
      setDatasetStatus(res.data);
      if (res.data?.file_name) {
        setWorkspaces((prev) =>
          prev.map((w, idx) => (idx === 0 ? { ...w, title: res.data.file_name } : w))
        );
      }
    } catch (err) {
      console.error('Failed to load dataset status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const updateActiveWorkspace = (updatedProps) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === activeWsId ? { ...w, ...updatedProps } : w))
    );
  };

  const handleAddNewWorkspace = () => {
    const newId = `ws-${Date.now()}`;
    const newWs = {
      id: newId,
      title: `Dataset Workspace ${workspaces.length + 1}`,
      file: null,
      uploadResult: null,
      uploadError: null,
    };
    setWorkspaces((prev) => [...prev, newWs]);
    setActiveWsId(newId);
    setFile(null);
    setUploadResult(null);
    setUploadError(null);
    toast.success('Opened new dataset workspace tab!');
  };

  const handleSwitchWorkspace = (wsId) => {
    setActiveWsId(wsId);
    const target = workspaces.find((w) => w.id === wsId);
    if (target) {
      setFile(target.file || null);
      setUploadResult(target.uploadResult || null);
      setUploadError(target.uploadError || null);
    }
  };

  const handleCloseWorkspace = (e, wsId) => {
    e.stopPropagation();
    if (workspaces.length <= 1) {
      toast.error('Cannot close the only workspace tab.');
      return;
    }
    const filtered = workspaces.filter((w) => w.id !== wsId);
    setWorkspaces(filtered);
    if (activeWsId === wsId) {
      const last = filtered[filtered.length - 1];
      setActiveWsId(last.id);
      setFile(last.file || null);
      setUploadResult(last.uploadResult || null);
      setUploadError(last.uploadError || null);
    }
    toast.success('Closed workspace tab');
  };

  const parseErrorDetail = (detail) => {
    if (!detail) return null;
    if (typeof detail === 'object') return detail;
    if (typeof detail === 'string') {
      try {
        const parsed = JSON.parse(detail);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      } catch (e) {
        // Plain string
      }
    }
    return {
      title: "⚠️ This File Doesn't Look Like a Sales Dataset",
      message: String(detail),
      missing_requirements: [String(detail)],
      simple_solution: 'Please ensure your file has columns for Product Name/SKU, Sales Price/Amount, and Date, or download our ready-to-use sample CSV template below.',
    };
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
      setUploadError(null);
      updateActiveWorkspace({ file: selected, uploadResult: null, uploadError: null, title: selected.name });
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
      setUploadError(null);
      updateActiveWorkspace({ file: selected, uploadResult: null, uploadError: null, title: selected.name });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadStep('Uploading file & normalizing columns...');
    const toastId = toast.loading('Processing sales dataset...');

    try {
      setUploadStep('Extracting metrics & updating database strictly for file...');
      const res = await ingestionAPI.uploadSalesDataset(file);
      const data = res.data;

      setUploadStep('Retraining Sales Forecaster & Demand Models on dataset...');
      setUploadResult(data);
      setUploadError(null);
      updateActiveWorkspace({
        file,
        uploadResult: data,
        uploadError: null,
        title: data.file_name || file.name,
      });

      toast.success('Dataset uploaded & AI models retrained successfully!', { id: toastId });
      
      fetchDatasetStatus();
    } catch (err) {
      setUploadResult(null);
      const errDetail = err.response?.data?.detail;
      const parsedErr = parseErrorDetail(errDetail) || {
        title: "⚠️ This File Doesn't Look Like a Sales Dataset",
        message: typeof errDetail === 'string' ? errDetail : 'Failed to process dataset',
        file_name: file?.name,
        missing_requirements: [
          'Product Information (missing column names like Product, SKU, Item Name, or Description)',
          'Sales & Revenue Numbers (missing column names like Total Amount, Sales, Price, or Quantity)'
        ],
        simple_solution: 'Please ensure your file has columns for Product Name/SKU, Sales Price/Amount, and Date, or download our ready-to-use sample CSV template below.'
      };

      if (parsedErr.file_name) {
        parsedErr.file_name = parsedErr.file_name.replace(/^temp_upload_/, '');
      }
      if (parsedErr.message) {
        parsedErr.message = parsedErr.message.replace(/temp_upload_/g, '');
      }

      setUploadError(parsedErr);
      updateActiveWorkspace({
        file,
        uploadResult: null,
        uploadError: parsedErr,
        title: file.name,
      });

      toast.error(parsedErr.title || 'Inappropriate Dataset Uploaded', { id: toastId });
    } finally {
      setUploading(false);
      setUploadStep('');
    }
  };

  const handleResetDataset = async () => {
    if (!window.confirm('Are you sure you want to reset and clear the dataset? All dashboards, orders, customers, and AI tabs will immediately return to 0 / null.')) {
      return;
    }

    const toastId = toast.loading('Resetting dataset to zero/null state...');
    try {
      await ingestionAPI.resetDataset();
      setFile(null);
      setUploadResult(null);
      setUploadError(null);
      updateActiveWorkspace({ file: null, uploadResult: null, uploadError: null, title: 'Dataset Workspace' });
      await fetchDatasetStatus();
      toast.success('Dataset cleared! All dashboards and tabs are now at 0 / null.', { id: toastId });
    } catch (err) {
      toast.error('Failed to reset dataset.', { id: toastId });
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

  const metrics = datasetStatus?.available_metrics || {};

  return (
    <div className="page-container fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--bg-secondary)', color: '#fff', border: '1px solid var(--border-color)' }
      }} />

      {/* ── Chrome Browser-Style Multi-Dataset Workspaces Tab Bar ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 border-b border-zinc-800 scrollbar-thin">
        {workspaces.map((ws) => {
          const isActive = ws.id === activeWsId;
          const displayTitle = ws.uploadResult?.file_name || ws.file?.name || (isActive && datasetStatus?.file_name) || ws.title;
          return (
            <div
              key={ws.id}
              onClick={() => handleSwitchWorkspace(ws.id)}
              className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-medium transition cursor-pointer select-none max-w-[240px] ${
                isActive
                  ? 'bg-zinc-900 text-indigo-300 border-t-2 border-x border-indigo-500/80 border-x-zinc-800 shadow-lg'
                  : 'bg-zinc-950/70 hover:bg-zinc-900/80 text-zinc-400 border border-transparent'
              }`}
            >
              <HiOutlineTableCells className={`text-sm flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
              <span className="truncate">{displayTitle}</span>

              {workspaces.length > 1 && (
                <button
                  onClick={(e) => handleCloseWorkspace(e, ws.id)}
                  className="p-0.5 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition opacity-60 group-hover:opacity-100 ml-1 flex-shrink-0"
                  title="Close Tab"
                >
                  <HiOutlineXMark className="text-sm" />
                </button>
              )}
            </div>
          );
        })}

        {/* Plus Button to Open New Dataset Workspace Tab */}
        <button
          onClick={handleAddNewWorkspace}
          className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900/80 hover:bg-indigo-600/20 text-zinc-400 hover:text-indigo-300 border border-zinc-800 hover:border-indigo-500/40 rounded-xl text-xs font-medium transition cursor-pointer ml-1 flex-shrink-0 shadow-sm"
          title="Open New Dataset Workspace Tab (+)"
        >
          <HiOutlinePlus className="text-base text-indigo-400" />
          <span>New Workspace</span>
        </button>
      </div>

      {/* Header */}
      <header className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <HiOutlineCloudArrowUp className="text-indigo-400 text-3xl" />
            Dataset Upload & Auto-Analysis
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Upload your CSV or Excel sales file. Metrics not found in the dataset will show an <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded font-bold text-xs">!</span> badge with a hover tooltip on the dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {datasetStatus?.has_dataset && (
            <button
              onClick={handleResetDataset}
              className="flex items-center gap-2 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-medium rounded-lg border border-rose-500/30 transition cursor-pointer"
              title="Reset all tables and dashboard metrics back to 0 / null"
            >
              <HiOutlineTrash className="text-base" />
              Reset to Zero (0)
            </button>
          )}

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg border border-zinc-700 transition"
          >
            <HiOutlineArrowDownTray className="text-indigo-400 text-base" />
            Download Sample CSV
          </button>
        </div>
      </header>

      {/* Features Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex items-start gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400">
            <HiOutlineDocumentText className="text-xl" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">Strict Dataset Analytics</h4>
            <p className="text-xs text-zinc-400 mt-0.5">All 7 tabs calculate predictions and graphs strictly on your uploaded data.</p>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
            <span className="font-bold text-lg leading-none">!</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">Missing Metrics Warning</h4>
            <p className="text-xs text-zinc-400 mt-0.5">Missing metrics show an exclamation mark on hover: "This data not mentioned in dataset".</p>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex items-start gap-3">
          <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400">
            <HiOutlineSparkles className="text-xl" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">Instant AI Calibration</h4>
            <p className="text-xs text-zinc-400 mt-0.5">Automatically fits Prophet Forecaster & Hype Demand Analyzer on your file.</p>
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
                    Drag and drop your <span className="text-indigo-400 font-semibold">CSV or Excel</span> file here
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Supports .csv, .xlsx, and .xls formats</p>
                </div>
              )}
            </div>

            {/* Missing Column Policy Notice */}
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5">
              <HiOutlineExclamationTriangle className="text-amber-400 text-lg flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90 leading-relaxed">
                <span className="font-semibold text-amber-300">Missing Data Policy:</span> If columns like Returns, CustomerID, or Profit are not in your file, corresponding cards will display an <code className="px-1.5 py-0.5 bg-amber-950/80 text-amber-300 rounded font-bold text-[11px]">!</code> badge indicating they are not mentioned in the dataset.
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

          {/* Inappropriate Dataset Error Alert Card */}
          {uploadError && (
            <div className="bg-rose-950/40 border-2 border-rose-500/60 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-rose-500/30">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-rose-500/20 rounded-xl text-rose-400 border border-rose-500/40 flex-shrink-0">
                    <HiOutlineExclamationTriangle className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-rose-200">
                      {uploadError.title || 'Inappropriate Dataset Uploaded'}
                    </h3>
                    <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
                      {uploadError.message || 'The uploaded file does not contain valid sales transaction data.'}
                    </p>
                  </div>
                </div>

                {uploadError.file_name && (
                  <span className="px-3 py-1 bg-rose-900/60 text-rose-300 text-xs font-mono rounded-lg border border-rose-500/40 font-medium truncate max-w-[180px]">
                    {uploadError.file_name}
                  </span>
                )}
              </div>

              {/* Missing Requirements List */}
              {uploadError.missing_requirements?.length > 0 && (
                <div className="p-4 bg-zinc-950/80 rounded-xl border border-rose-500/30 space-y-2">
                  <h4 className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span>❌ Missing Essential Sales Requirements</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {uploadError.missing_requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-rose-200 font-medium">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Headers Detected in File */}
              {uploadError.uploaded_headers?.length > 0 && (
                <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-xs text-zinc-400 font-medium block">
                    Column Headers Found in Your File ({uploadError.uploaded_headers.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                    {uploadError.uploaded_headers.map((h, i) => (
                      <span key={i} className="px-2.5 py-1 bg-zinc-900 text-zinc-300 border border-zinc-700/80 rounded font-mono text-[11px]">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Simple Solution & Guidance Bar */}
              <div className="p-4 bg-indigo-950/40 border border-indigo-500/40 rounded-xl space-y-3">
                {uploadError.simple_solution && (
                  <p className="text-xs text-indigo-200 font-medium leading-relaxed flex items-start gap-2">
                    <span className="text-indigo-400 font-bold flex-shrink-0">💡 How to Fix:</span>
                    <span>{uploadError.simple_solution}</span>
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-zinc-300 pt-1">
                  <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800 flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span> <span>Product / SKU Name</span>
                  </div>
                  <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800 flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span> <span>Sales Amount or Price</span>
                  </div>
                  <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800 flex items-center gap-1.5">
                    <span className="text-emerald-400 font-bold">✓</span> <span>Transaction Date</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/20"
                >
                  <HiOutlineArrowDownTray className="text-sm" />
                  Download Valid Sample CSV Template
                </button>
                <button
                  onClick={() => { setFile(null); setUploadError(null); }}
                  className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  Select Another File
                </button>
              </div>
            </div>
          )}

          {/* Upload Results Details Card */}
          {uploadResult && (
            <div className="bg-zinc-900/80 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-4">
                <HiOutlineCheckCircle className="text-lg" />
                Latest Upload Results & Metric Detection
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
                  <span className="text-zinc-400">Processed File:</span>
                  <p className="text-zinc-100 font-medium text-sm mt-0.5 truncate">{uploadResult.file_name}</p>
                </div>
                <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
                  <span className="text-zinc-400">Total Transaction Lines:</span>
                  <p className="text-zinc-100 font-medium text-sm mt-0.5">{uploadResult.total_rows?.toLocaleString()}</p>
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition"
                >
                  <HiOutlineTableCells className="text-sm" />
                  View Dashboard
                </button>
                <button
                  onClick={() => navigate('/forecast')}
                  className="flex-1 py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition"
                >
                  <HiOutlineArrowTrendingUp className="text-sm" />
                  View Forecast
                </button>
                <button
                  onClick={() => navigate('/demand')}
                  className="flex-1 py-2 px-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition"
                >
                  <HiOutlinePresentationChartBar className="text-sm" />
                  View Demand AI
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
              Active Dataset Status
            </h2>

            {loadingStatus ? (
              <div className="py-8 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                <span className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                Checking dataset state...
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
                    <span className="text-zinc-400 block mb-0.5">Total Orders</span>
                    <span className="text-zinc-100 font-bold text-base">{datasetStatus.total_orders?.toLocaleString() || datasetStatus.total_rows?.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 block mb-0.5">Total Revenue</span>
                    <span className="text-emerald-400 font-bold text-base">₹{(datasetStatus.total_revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>

                {/* Metrics presence breakdown */}
                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 space-y-2">
                  <span className="text-zinc-400 font-medium block">Dataset Metrics Availability:</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <span className="text-emerald-400 font-bold">✓</span> Revenue / Sales
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <span className="text-emerald-400 font-bold">✓</span> Orders & Dates
                    </div>
                    <div className={`flex items-center gap-1.5 ${metrics.categories ? 'text-zinc-300' : 'text-amber-400'}`}>
                      <span>{metrics.categories ? '✓' : '!'}</span> Product Categories
                    </div>
                    <div className={`flex items-center gap-1.5 ${metrics.customers ? 'text-zinc-300' : 'text-amber-400'}`}>
                      <span>{metrics.customers ? '✓' : '!'}</span> Customer IDs
                    </div>
                    <div className={`flex items-center gap-1.5 ${metrics.returns ? 'text-zinc-300' : 'text-amber-400'}`}>
                      <span>{metrics.returns ? '✓' : '!'}</span> Returns / Refunds
                    </div>
                    <div className={`flex items-center gap-1.5 ${metrics.profit ? 'text-zinc-300' : 'text-amber-400'}`}>
                      <span>{metrics.profit ? '✓' : '!'}</span> Profit Margins
                    </div>
                  </div>
                </div>

                {datasetStatus?.categories_found?.length > 0 && (
                  <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 block mb-1.5">Categories Detected ({datasetStatus.categories_found.length})</span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {datasetStatus.categories_found.map((cat) => (
                        <span key={cat} className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-zinc-950/60 rounded-xl border border-zinc-800 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-zinc-800/80 text-zinc-400 flex items-center justify-center mx-auto text-lg font-bold">
                  0
                </div>
                <h4 className="text-sm font-semibold text-zinc-200">Zero-State Active</h4>
                <p className="text-zinc-400 text-xs">All metrics, charts, and predictions are currently 0 or null.</p>
                <p className="text-zinc-500 text-[11px]">Upload a CSV or Excel file on the left to activate dataset analytics.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Dynamic Column Keyword Inspection & Automated Sales Analysis Section ── */}
      {datasetStatus?.has_dataset && (
        <div className="mt-8 space-y-8">
          {/* 1. Column Keyword Inspection & Data Validation Card */}
          {datasetStatus.column_inspection && (
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                    <HiOutlineTableCells className="text-indigo-400 text-lg" />
                    Dataset Column Keyword Inspection & Validation
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Analyzed {datasetStatus.column_inspection.total_columns_uploaded} uploaded header columns against standard domain keywords.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                    datasetStatus.column_inspection.validation_status === 'VALID'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : datasetStatus.column_inspection.validation_status === 'PARTIAL_WARNING'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    {datasetStatus.column_inspection.validation_status === 'VALID' ? '✓ Valid Sales Dataset' : datasetStatus.column_inspection.validation_status}
                  </span>
                </div>
              </div>

              {/* Validation Status Banner */}
              <div className="mb-5 p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl flex items-start gap-3 text-xs text-zinc-300">
                <HiOutlineCheckCircle className="text-indigo-400 text-lg flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">{datasetStatus.column_inspection.validation_message}</p>
              </div>

              {/* Column Inspection Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Canonical Field</th>
                      <th className="py-2.5 px-3">Field Description</th>
                      <th className="py-2.5 px-3">Uploaded Column Header</th>
                      <th className="py-2.5 px-3">Matched Keyword</th>
                      <th className="py-2.5 px-3 text-right">Detection Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {datasetStatus.column_inspection.column_inspections?.map((col) => (
                      <tr key={col.field} className="hover:bg-zinc-800/30 transition">
                        <td className="py-2.5 px-3 font-semibold text-zinc-200 flex items-center gap-1.5">
                          {col.is_essential && <span className="text-indigo-400 text-[10px] font-bold" title="Essential Field">*</span>}
                          {col.field}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400">{col.description}</td>
                        <td className="py-2.5 px-3">
                          {col.detected ? (
                            <code className="px-2 py-0.5 bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 rounded font-mono text-[11px]">
                              {col.column_name}
                            </code>
                          ) : (
                            <span className="text-zinc-600 font-mono text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">
                          {col.detected ? col.keyword_matched : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {col.detected ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] rounded font-medium border border-emerald-500/20">
                              <HiOutlineCheckCircle className="text-xs" /> Detected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] rounded font-medium border border-amber-500/20" title="Missing in file — filled with '-' default value">
                              Defaulted ('-')
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Automated Sales & Business Analysis Panel */}
          {datasetStatus.sales_analysis && (
            <div className="bg-zinc-900/80 border border-indigo-500/30 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                    <HiOutlineSparkles className="text-indigo-400 text-xl" />
                    Automated Sales & Business Analysis Report
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Automated insights calculated directly from the uploaded transaction dataset.
                  </p>
                </div>

                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30">
                  Calculated Live
                </span>
              </div>

              {/* Key Highlights Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                  <span className="text-zinc-400 text-xs block mb-1">Total Revenue</span>
                  <span className="text-emerald-400 font-extrabold text-lg">
                    ₹{(datasetStatus.sales_analysis.summary?.total_revenue || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                  <span className="text-zinc-400 text-xs block mb-1">Total Volume Sold</span>
                  <span className="text-zinc-100 font-extrabold text-lg">
                    {(datasetStatus.sales_analysis.summary?.total_units_sold || 0).toLocaleString()} units
                  </span>
                </div>
                <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                  <span className="text-zinc-400 text-xs block mb-1">Avg Order Value (AOV)</span>
                  <span className="text-indigo-300 font-extrabold text-lg">
                    ₹{(datasetStatus.sales_analysis.summary?.avg_order_value || 0).toLocaleString()}
                  </span>
                </div>
                <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl">
                  <span className="text-zinc-400 text-xs block mb-1">Sales Velocity</span>
                  <span className="text-purple-300 font-extrabold text-lg">
                    ₹{(datasetStatus.sales_analysis.summary?.daily_sales_velocity || 0).toLocaleString()}/day
                  </span>
                </div>
              </div>

              {/* AI Executive Takeaways */}
              {datasetStatus.sales_analysis.executive_takeaways?.length > 0 && (
                <div className="mb-6 p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl">
                  <h3 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <HiOutlineSparkles className="text-sm" /> Executive Key Takeaways & Findings
                  </h3>
                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {datasetStatus.sales_analysis.executive_takeaways.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Two Column Breakdown: Top Products & Category Shares */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Products */}
                {datasetStatus.sales_analysis.top_products?.length > 0 && (
                  <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-3">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Top 5 Products by Revenue
                    </h3>
                    <div className="space-y-2">
                      {datasetStatus.sales_analysis.top_products.map((prod) => (
                        <div key={prod.stock_code} className="flex items-center justify-between p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800 text-xs">
                          <div>
                            <p className="font-semibold text-zinc-200 truncate max-w-[200px]">{prod.product_name}</p>
                            <span className="text-[10px] text-zinc-400 font-mono">{prod.stock_code} • {prod.units_sold} sold</span>
                          </div>
                          <span className="font-bold text-emerald-400">₹{prod.revenue.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Revenue Breakdown */}
                {datasetStatus.sales_analysis.category_breakdown?.length > 0 && (
                  <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-xl space-y-3">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Department Revenue Share
                    </h3>
                    <div className="space-y-3 text-xs">
                      {datasetStatus.sales_analysis.category_breakdown.map((cat) => (
                        <div key={cat.category} className="space-y-1">
                          <div className="flex justify-between items-center text-zinc-300">
                            <span className="font-medium">{cat.category}</span>
                            <span className="font-semibold text-zinc-200">₹{cat.revenue.toLocaleString()} ({cat.share_percentage}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${Math.min(100, cat.share_percentage)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
