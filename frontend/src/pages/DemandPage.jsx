/**
 * Demand Page — Product Demand Analysis Dashboard
 * ==================================================
 * Displays product demand signals, rising/declining products,
 * demand distribution, seasonal patterns, and recommendations.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { analyticsAPI } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const DEMAND_COLORS = {
  'Severe Drop': '#ef4444',
  'Declining': '#f97316',
  'Steady': '#eab308',
  'Growing': '#22c55e',
  'Viral/Hype': '#8b5cf6',
};

export default function DemandPage() {
  const [demandData, setDemandData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDemandAnalysis();
  }, []);

  const fetchDemandAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsAPI.getDemandAnalysis();
      setDemandData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load demand analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">⚠️ {error}</p>
          <button
            onClick={fetchDemandAnalysis}
            className="px-4 py-2 bg-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const distribution = demandData?.demand_distribution || {};
  const rising = demandData?.top_rising_products || [];
  const declining = demandData?.top_declining_products || [];
  const recommendations = demandData?.recommendations || [];
  const seasonal = demandData?.seasonal_patterns || {};

  // Prepare pie chart data
  const pieData = Object.entries(distribution.bins || {}).map(([label, data]) => ({
    name: label,
    value: data.count,
    color: data.color || DEMAND_COLORS[label] || '#71717a',
  }));

  // Prepare seasonal bar chart data
  const seasonalData = Object.entries(seasonal.monthly_patterns || {}).map(
    ([month, data]) => ({
      month,
      revenue: data.avg_revenue,
      topCategory: data.top_category,
    })
  );

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'products', label: '📦 Products' },
    { id: 'seasonal', label: '📅 Seasonal' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">📊 Demand Analysis</h1>
        <p className="text-sm text-zinc-500 mt-1">
          AI-powered product demand intelligence and forecasting
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 rounded-lg p-1 border border-zinc-800 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recommendations Banner */}
      {recommendations.length > 0 && activeTab === 'overview' && (
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 rounded-xl border ${
                rec.type === 'opportunity'
                  ? 'bg-green-500/5 border-green-500/20'
                  : rec.type === 'warning'
                  ? 'bg-orange-500/5 border-orange-500/20'
                  : 'bg-blue-500/5 border-blue-500/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-zinc-200">{rec.title}</div>
                  <div className="text-xs text-zinc-400 mt-1">{rec.description}</div>
                </div>
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                  rec.priority === 'high'
                    ? 'bg-red-500/10 text-red-400'
                    : rec.priority === 'medium'
                    ? 'bg-yellow-500/10 text-yellow-400'
                    : 'bg-zinc-500/10 text-zinc-400'
                }`}>
                  {rec.priority}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Demand Distribution Pie */}
          <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">
              Demand Distribution
            </h3>
            <div className="flex items-center justify-center">
              <div className="w-full max-w-xs">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        stroke="#18181b"
                        strokeWidth={2}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-zinc-500 py-12">No data available</p>
                )}
              </div>
            </div>
            <div className="text-center mt-2 text-xs text-zinc-500">
              {distribution.total_products || 0} products analyzed
            </div>
          </div>

          {/* Summary Stats */}
          <div className="space-y-4">
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <StatBlock
                  label="Peak Season"
                  value={seasonal.peak_season || '—'}
                  icon="🔥"
                />
                <StatBlock
                  label="Low Season"
                  value={seasonal.low_season || '—'}
                  icon="❄️"
                />
                <StatBlock
                  label="Rising Products"
                  value={rising.length}
                  icon="📈"
                />
                <StatBlock
                  label="Declining Products"
                  value={declining.length}
                  icon="📉"
                />
              </div>
            </div>

            {/* Category Forecast Mini */}
            {demandData?.category_forecast_summary?.length > 0 && (
              <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-3">
                  Category Growth Outlook
                </h3>
                <div className="space-y-2">
                  {demandData.category_forecast_summary.slice(0, 5).map((cat, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 w-32 truncate">{cat.category}</span>
                      <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            cat.growth_trend_pct > 0 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.abs(cat.growth_trend_pct))}%`,
                          }}
                        />
                      </div>
                      <span className={`text-xs font-mono w-16 text-right ${
                        cat.growth_trend_pct > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {cat.growth_trend_pct > 0 ? '+' : ''}{cat.growth_trend_pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Rising */}
          <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-6">
            <h3 className="text-sm font-medium text-green-400 mb-4">
              📈 Top Rising Products
            </h3>
            <div className="space-y-2">
              {rising.length > 0 ? rising.map((prod, i) => (
                <ProductRow key={i} product={prod} rank={i + 1} type="rising" />
              )) : (
                <p className="text-zinc-500 text-sm py-4">No rising products found</p>
              )}
            </div>
          </div>

          {/* Top Declining */}
          <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-6">
            <h3 className="text-sm font-medium text-red-400 mb-4">
              📉 Top Declining Products
            </h3>
            <div className="space-y-2">
              {declining.length > 0 ? declining.map((prod, i) => (
                <ProductRow key={i} product={prod} rank={i + 1} type="declining" />
              )) : (
                <p className="text-zinc-500 text-sm py-4">No declining products found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Seasonal Tab */}
      {activeTab === 'seasonal' && (
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">
            Monthly Revenue Patterns
          </h3>
          {seasonalData.length > 0 ? (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={seasonalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                  />
                  <YAxis
                    tick={{ fill: '#71717a', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#27272a' }}
                    tickFormatter={(v) => {
                      if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
                      if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
                      return `₹${v}`;
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Avg Revenue']}
                  />
                  <Bar
                    dataKey="revenue"
                    radius={[4, 4, 0, 0]}
                    fill="#3b82f6"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-zinc-500 text-sm py-12 text-center">
              No seasonal data available
            </p>
          )}

          {/* Peak vs Low Season Cards */}
          {seasonal.peak_season && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
                <div className="text-xs text-orange-400 font-medium mb-1">🔥 Peak Season</div>
                <div className="text-lg font-bold text-zinc-100">{seasonal.peak_season}</div>
                <div className="text-xs text-zinc-500">
                  Avg Revenue: ₹{seasonal.peak_season_revenue?.toLocaleString() || 0}
                </div>
              </div>
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                <div className="text-xs text-blue-400 font-medium mb-1">❄️ Low Season</div>
                <div className="text-lg font-bold text-zinc-100">{seasonal.low_season}</div>
                <div className="text-xs text-zinc-500">
                  Avg Revenue: ₹{seasonal.low_season_revenue?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function StatBlock({ label, value, icon }) {
  return (
    <div className="bg-zinc-900/50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-lg font-bold text-zinc-100">{value}</div>
    </div>
  );
}

function ProductRow({ product, rank, type }) {
  const color = type === 'rising' ? 'text-green-400' : 'text-red-400';
  const bgColor = type === 'rising' ? 'bg-green-500/10' : 'bg-red-500/10';

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900/50 transition-colors">
      <span className="text-xs text-zinc-500 w-5 text-right font-mono">#{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-zinc-200 font-medium truncate">
          {product.stock_code}
        </div>
        <div className="text-[10px] text-zinc-500">
          {product.label}
        </div>
      </div>
      <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${bgColor} ${color}`}>
        {product.growth_pct > 0 ? '+' : ''}{product.growth_pct}%
      </span>
    </div>
  );
}
