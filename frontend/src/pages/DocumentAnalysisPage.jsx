/**
 * DocumentAnalysisPage — Enterprise CRM Document Ingestion
 * =========================================================
 * Allows users to upload a PDF. It sends it to the backend
 * where Gemini extracts insights, which are then rendered below.
 */

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { ingestionAPI } from '../api/client';
import toast, { Toaster } from 'react-hot-toast';
import {
  HiOutlineDocumentArrowUp,
  HiOutlineSparkles,
  HiOutlineChartBar,
  HiOutlineArrowDownTray,
} from 'react-icons/hi2';

export default function DocumentAnalysisPage() {
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const fetchHistory = async () => {
    try {
      const response = await ingestionAPI.getHistory();
      setHistory(response.data);
      if (response.data.length > 0 && !selectedDoc) {
        setSelectedDoc(response.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading('Uploading and analyzing document with Gemini AI...');

    try {
      const response = await ingestionAPI.uploadDocument(file);
      toast.success('Analysis complete!', { id: toastId });
      setSelectedDoc(response.data);
      fetchHistory();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Analysis failed', {
        id: toastId,
      });
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
  });

  return (
    <div className="page-container fade-in">
      <Toaster position="top-right" toastOptions={{ style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' } }} />

      <header className="page-header">
        <h1>Enterprise Data Ingestion</h1>
        <p>Upload unstructured documents (PDFs) or structured data (CSV, Excel) to automatically extract insights and power the dynamic dashboard.</p>
      </header>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Upload & History Sidebar */}
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div 
            {...getRootProps()} 
            className={`dropzone ${isDragActive ? 'dropzone--active' : ''}`}
            style={{ 
              pointerEvents: uploading ? 'none' : 'auto', 
              opacity: uploading ? 0.6 : 1,
              borderColor: isDragActive ? '#10b981' : '#27272a',
              background: isDragActive ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
              minHeight: '200px'
            }}
          >
            <input {...getInputProps()} />
            <div className="dropzone__icon" style={{ color: '#10b981' }}>
              <HiOutlineDocumentArrowUp />
            </div>
            <div className="dropzone__text">
              {isDragActive ? 'Drop file here...' : 'Drag & drop a document (PDF, CSV, Excel) to analyze'}
            </div>
            {uploading && <div className="spinner spinner--sm mt-16" style={{ margin: '0 auto', borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#10b981' }} />}
          </div>

          <div className="glass-card" style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Document History</h3>
            {history.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No documents analyzed yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {history.map(doc => (
                  <li 
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    style={{ 
                      padding: '12px', 
                      borderRadius: '8px', 
                      cursor: 'pointer',
                      background: selectedDoc?.id === doc.id ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${selectedDoc?.id === doc.id ? '#10b981' : 'transparent'}`,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{doc.filename}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(doc.created_at).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Analysis Viewer */}
        <div className="glass-card" style={{ flex: '2 1 600px', minHeight: '600px' }}>
          {selectedDoc ? (
            <div className="slide-up">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <HiOutlineSparkles size={28} color="#10b981" />
                  <div>
                    <h2 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>AI Analysis Results</h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>{selectedDoc.filename}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedDoc.structured_insights, null, 2));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href", dataStr);
                    downloadAnchorNode.setAttribute("download", selectedDoc.filename + "_analysis.json");
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                  }}
                  className="button"
                  style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                >
                  <HiOutlineArrowDownTray /> Download JSON
                </button>
              </div>

              {selectedDoc.structured_insights ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  
                  <div>
                    <h4 style={{ color: '#10b981', marginBottom: '8px', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Executive Summary</h4>
                    <p style={{ color: '#fafafa', fontSize: '1.1rem', lineHeight: 1.6 }}>
                      {selectedDoc.structured_insights.summary}
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>Overall Sentiment</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 600, color: selectedDoc.structured_insights.sentiment === 'Positive' ? '#10b981' : '#f59e0b' }}>
                        {selectedDoc.structured_insights.sentiment || 'Neutral'}
                      </div>
                    </div>
                    
                    {selectedDoc.structured_insights.key_metrics && Object.entries(selectedDoc.structured_insights.key_metrics).map(([key, value]) => (
                      <div key={key} style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>{key}</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#fff' }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {selectedDoc.structured_insights.entities && selectedDoc.structured_insights.entities.length > 0 && (
                    <div>
                      <h4 style={{ color: '#10b981', marginBottom: '12px', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Key Entities Extracted</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {selectedDoc.structured_insights.entities.map((entity, i) => (
                          <span key={i} style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '20px', fontSize: '0.85rem' }}>
                            {entity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px dashed rgba(59, 130, 246, 0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <HiOutlineChartBar size={24} color="#3b82f6" />
                    <div>
                      <strong style={{ color: '#3b82f6' }}>Power BI Ready</strong>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>This dataset is now available on the <code>/api/powerbi/dataset</code> endpoint.</div>
                    </div>
                  </div>

                </div>
              ) : (
                <p>No structured insights available for this document.</p>
              )}
            </div>
          ) : (
            <div className="empty-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="empty-state__icon"><HiOutlineSparkles /></div>
              <div className="empty-state__title">No Document Selected</div>
              <div className="empty-state__desc">Upload a PDF, CSV, or Excel file or select one from your history to view its AI analysis.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
