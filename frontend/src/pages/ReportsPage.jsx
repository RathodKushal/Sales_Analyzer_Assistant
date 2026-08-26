/**
 * ReportsPage — PDF Generation
 * ================================
 * Interface for generating and downloading PDF reports.
 */

import { useState } from 'react';
import { reportsAPI } from '../api/client';
import toast, { Toaster } from 'react-hot-toast';
import {
  HiOutlineDocumentChartBar,
  HiOutlineArrowDownTray,
  HiOutlineCalendar,
} from 'react-icons/hi2';

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('executive_summary');
  const [dateRange, setDateRange] = useState('last_30_days');

  const handleGenerate = async () => {
    setGenerating(true);
    const toastId = toast.loading('Compiling report data & generating PDF...');

    try {
      const response = await reportsAPI.generate({
        report_type: reportType,
        filters: { timeframe: dateRange },
      });

      const { report } = response.data;
      const filename = report.filename;
      toast.success('Report generated successfully!', { id: toastId });
      
      // Trigger PDF download
      const pdfResponse = await reportsAPI.download(filename);
      const pdfBlob = new Blob([pdfResponse.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate report', {
        id: toastId,
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <Toaster position="top-right" toastOptions={{
        style: { background: 'var(--bg-secondary)', color: '#fff', border: '1px solid var(--border-color)' }
      }} />

      <header className="page-header">
        <h1>Reports</h1>
        <p>Generate downloadable PDF reports containing automated insights and charts.</p>
      </header>

      <div className="glass-card" style={{ maxWidth: 600 }}>
        <h2 className="mb-24" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <HiOutlineDocumentChartBar style={{ color: 'var(--accent-blue)' }} />
          Report Builder
        </h2>

        <div className="form-group">
          <label className="form-label">Report Template</label>
          <select 
            className="form-select"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="executive_summary">Executive Summary</option>
            <option value="discount_analysis">Discount Impact Analysis</option>
            <option value="category_performance">Category Performance Report</option>
          </select>
        </div>

        <div className="form-group mb-24">
          <label className="form-label">Timeframe</label>
          <select 
            className="form-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="this_quarter">This Quarter</option>
            <option value="year_to_date">Year to Date</option>
          </select>
        </div>

        <button 
          className="btn btn--primary" 
          onClick={handleGenerate}
          disabled={generating}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {generating ? (
            <span className="spinner spinner--sm" />
          ) : (
            <>
              <HiOutlineArrowDownTray /> Generate & Download PDF
            </>
          )}
        </button>
      </div>

      <div className="mt-24">
        <h3 className="form-label mb-16">Available Templates</h3>
        <div className="report-cards-grid">
          <div className="report-card" onClick={() => setReportType('executive_summary')}>
            <div className="report-card__icon" style={{ background: 'rgba(67, 97, 238, 0.15)', color: 'var(--accent-blue)' }}>
              <HiOutlineDocumentChartBar />
            </div>
            <div className="report-card__title">Executive Summary</div>
            <div className="report-card__desc">High-level overview of revenue, orders, and overall business health metrics.</div>
          </div>
          
          <div className="report-card" onClick={() => setReportType('discount_analysis')}>
            <div className="report-card__icon" style={{ background: 'rgba(6, 214, 160, 0.15)', color: 'var(--accent-green)' }}>
              <HiOutlineChartBarSquare />
            </div>
            <div className="report-card__title">Discount Analysis</div>
            <div className="report-card__desc">Deep dive into the DQN agent's pricing strategy and conversion improvements.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Need to import the icon used in the card
import { HiOutlineChartBarSquare } from 'react-icons/hi2';
