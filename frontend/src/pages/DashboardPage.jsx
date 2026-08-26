/**
 * DashboardPage — Dynamic Visualization Engine
 * ==========================================
 * Automatically renders metrics and charts based on AI insights
 * extracted from the user's uploaded dataset.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ingestionAPI } from '../api/client';
import StatsCard from '../components/StatsCard';
import ChartCard from '../components/ChartCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  HiOutlineDocumentArrowUp,
  HiOutlineArrowPath,
  HiOutlineChartBarSquare,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Chart Theme Configuration matching our design system
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { color: 'rgba(255, 255, 255, 0.7)', font: { family: 'Inter' } }
    },
    tooltip: {
      backgroundColor: 'rgba(15, 15, 46, 0.9)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
    }
  },
  scales: {
    y: {
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
      ticks: { color: 'rgba(255, 255, 255, 0.4)' }
    },
    x: {
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
      ticks: { color: 'rgba(255, 255, 255, 0.4)' }
    }
  }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [documentAnalysis, setDocumentAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const historyRes = await ingestionAPI.getHistory();
      if (historyRes.data && historyRes.data.length > 0) {
        setDocumentAnalysis(historyRes.data[0]);
      } else {
        setDocumentAnalysis(null);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="analyzing-container fade-in">
        <div className="analyzing-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
        </div>
        <h2 className="analyzing-text shimmer-text">Analyzing your data...</h2>
        <p className="analyzing-subtext">Our AI is crunching the numbers, detecting patterns, and building your custom dashboard.</p>
      </div>
    );
  }

  // Safely parse JSON if it's stored as a string, otherwise use it directly
  let insights = null;
  if (documentAnalysis?.structured_insights) {
    if (typeof documentAnalysis.structured_insights === 'string') {
      try {
        insights = JSON.parse(documentAnalysis.structured_insights);
      } catch (e) {
        console.error("Failed to parse insights JSON", e);
      }
    } else {
      insights = documentAnalysis.structured_insights;
    }
  }

  // Show empty state if no data is present or parsing failed
  if (!insights || insights.error) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', textAlign: 'center' }}>
        <div className="glass-card fade-in" style={{ padding: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '600px' }}>
          <div style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '50%', marginBottom: '24px' }}>
            <HiOutlineDocumentArrowUp size={64} color="#3b82f6" />
          </div>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '16px', color: '#fff' }}>No Data Available</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '32px', lineHeight: '1.6' }}>
            {insights?.error 
              ? `Error: ${insights.error} Please upload your file again.` 
              : "Your dynamic dashboard is currently empty. To get started with AI insights, upload your dataset."}
          </p>
          <button 
            onClick={() => window.location.href = '/document-analysis'}
            className="button"
            style={{ padding: '14px 28px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
          >
            <HiOutlineDocumentArrowUp size={22} /> Go to Data Ingestion
          </button>
        </div>
      </div>
    );
  }

  const chartColors = [
    'rgba(59, 130, 246, 0.8)', // blue
    'rgba(139, 92, 246, 0.8)', // violet
    'rgba(16, 185, 129, 0.8)', // green
    'rgba(245, 158, 11, 0.8)', // orange
    'rgba(236, 72, 153, 0.8)', // pink
    'rgba(14, 165, 233, 0.8)', // sky
  ];

  return (
    <div className="page-container">
      <header className="page-header slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '3rem', letterSpacing: '-0.04em', background: 'linear-gradient(90deg, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            Dashboard Overview
          </h1>
          <p style={{ color: 'var(--accent-blue)', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.9rem' }}>
            Analyzing Data Model: <span style={{ color: '#fff' }}>{documentAnalysis.filename}</span>
          </p>
          <div style={{ marginTop: '24px', padding: '20px', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--accent-violet)', maxWidth: '900px' }}>
            <p className="shimmer-text" style={{ fontSize: '1.1rem', lineHeight: '1.6', margin: 0 }}>
              {insights.summary}
            </p>
          </div>
        </div>
        <button 
          onClick={fetchData}
          className="button stat-card"
          style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.03)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', backdropFilter: 'blur(20px)', fontWeight: '600' }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <HiOutlineArrowPath size={20} className={loading ? "spin" : ""} /> Refresh Dashboard
        </button>
      </header>

      {/* Dynamic Metric Cards */}
      <div className="stats-grid slide-up" style={{ marginTop: '32px' }}>
        {insights.key_metrics && Object.entries(insights.key_metrics).map(([key, value], idx) => (
          <StatsCard
            key={idx}
            icon={<HiOutlineCheckCircle />}
            label={key}
            value={value}
            variant={['blue', 'violet', 'warm', 'green'][idx % 4]}
          />
        ))}
      </div>

      {/* Dynamic Charts */}
      {insights.dashboard_charts && insights.dashboard_charts.length > 0 && (
        <div className="charts-grid slide-up" style={{ marginTop: '32px' }}>
          {insights.dashboard_charts.map((chart, idx) => {
            const isPieOrDoughnut = chart.type === 'pie' || chart.type === 'doughnut';
            
            const data = {
              labels: chart.labels || [],
              datasets: [
                {
                  label: chart.title,
                  data: chart.values || [],
                  backgroundColor: isPieOrDoughnut ? chartColors : chartColors[idx % chartColors.length],
                  borderColor: isPieOrDoughnut ? 'transparent' : chartColors[idx % chartColors.length],
                  borderWidth: 1,
                  fill: chart.type === 'line',
                  tension: 0.4,
                  pointBackgroundColor: '#fff',
                }
              ]
            };

            // Remove grid lines for pie/doughnut charts
            const customOptions = { ...chartOptions };
            if (isPieOrDoughnut) {
              customOptions.scales = {
                x: { display: false },
                y: { display: false }
              };
            } else {
              customOptions.scales = chartOptions.scales; // restore normal scales
            }

            return (
              <ChartCard key={idx} title={chart.title} icon={<HiOutlineChartBarSquare />}>
                {chart.type === 'bar' && <Bar data={data} options={customOptions} />}
                {chart.type === 'line' && <Line data={data} options={customOptions} />}
                {chart.type === 'pie' && <Pie data={data} options={customOptions} />}
                {chart.type === 'doughnut' && <Doughnut data={data} options={customOptions} />}
              </ChartCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
