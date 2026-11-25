/**
 * Forecast Page — Sales Revenue Forecasting Dashboard
 * =====================================================
 * Displays historical vs. predicted monthly revenue with
 * confidence bands, KPI cards, and category filtering.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, Legend, ComposedChart, Bar,
} from 'recharts';
import { analyticsAPI } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';

const HORIZON_OPTIONS = [
  { value: 3, label: '3 Months' },
  { value: 6, label: '6 Months' },
  { value: 12, label: '12 Months' },
];

export default function ForecastPage() {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [horizon, setHorizon] = useState(6);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchForecast();
  }, [horizon]);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await analyticsAPI.getForecast(horizon);
      setForecastData(res.data);

      // Extract category names
      const cats = Object.keys(res.data.forecasts || {});
      setCategories(cats);
      if (!cats.includes(selectedCategory)) {
        setSelectedCategory(cats[0] || 'All Categories');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!forecastData || !forecastData.forecasts) return [];

    const catData = forecastData.forecasts[selectedCategory];
    if (!catData) return [];

    const data = [];

    // Historical points
    const histDates = catData.historical?.dates || [];
    const histValues = catData.historical?.values || [];
    histDates.forEach((date, i) => {
      data.push({
        date,
        actual: histValues[i],
        forecast: null,
        lower: null,
        upper: null,
      });
    });

    // Forecast points — connect to last historical point
    const fDates = catData.forecast?.dates || [];
    const fValues = catData.forecast?.values || [];
    const fLower = catData.forecast?.lower_bound || [];
    const fUpper = catData.forecast?.upper_bound || [];

    // Bridge point: last historical + first forecast overlap
    if (data.length > 0 && fValues.length > 0) {
      data[data.length - 1].forecast = data[data.length - 1].actual;
      data[data.length - 1].lower = data[data.length - 1].actual;
      data[data.length - 1].upper = data[data.length - 1].actual;
    }

    fDates.forEach((date, i) => {
      data.push({
        date,
        actual: null,
        forecast: fValues[i],
        lower: fLower[i],
        upper: fUpper[i],
      });
    });

    return data;
  };

  const formatCurrency = (value) => {
    if (value == null) return '—';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
    return `₹${value.toFixed(0)}`;
  };

  const summary = forecastData?.summary || {};

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">⚠️ {error}</p>
          <button
            onClick={fetchForecast}
            className="px-4 py-2 bg-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const chartData = getChartData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">📈 Sales Forecast</h1>
          <p className="text-sm text-zinc-500 mt-1">
            AI-powered revenue predictions reading from live billing and orders data
          </p>
        </div>

        <div className="flex gap-3">
          {/* Horizon selector */}
          <div className="flex bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
            {HORIZON_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setHorizon(opt.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  horizon === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Informative Notice Banner */}
      {forecastData?.notice && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-200">
          <div className="flex items-center gap-2.5">
            <span className="text-base">📊</span>
            <span>{forecastData.notice}</span>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 whitespace-nowrap">
            {forecastData.model_used || 'Active Model'}
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Forecasted Revenue"
          value={formatCurrency(summary.total_forecasted_revenue)}
          subtitle={`Next ${horizon} months`}
          icon="💰"
          color="blue"
        />
        <KPICard
          title="Avg Monthly"
          value={formatCurrency(summary.avg_monthly_forecast)}
          subtitle="Predicted average"
          icon="📊"
          color="violet"
        />
        <KPICard
          title="Growth Rate"
          value={`${summary.estimated_growth_pct > 0 ? '+' : ''}${summary.estimated_growth_pct?.toFixed(1) || 0}%`}
          subtitle="vs. last month"
          icon={summary.estimated_growth_pct > 0 ? '📈' : '📉'}
          color={summary.estimated_growth_pct > 0 ? 'green' : 'red'}
        />
        <KPICard
          title="Peak Month"
          value={summary.peak_month || '—'}
          subtitle={formatCurrency(summary.peak_month_value)}
          icon="🏔️"
          color="orange"
        />
      </div>

      {/* Category Selector */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Chart or Zero State */}
      {chartData.length > 0 ? (
        <motion.div
          key={selectedCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-6"
        >
          <h3 className="text-sm font-medium text-zinc-400 mb-4">
            Revenue Forecast — {selectedCategory}
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  tickFormatter={formatCurrency}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#a1a1aa' }}
                  formatter={(value, name) => [formatCurrency(value), name]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }}
                />
                <Area
                  type="monotone"
                  dataKey="upper"
                  stroke="none"
                  fill="url(#confidenceBand)"
                  name="Upper Bound"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  stroke="none"
                  fill="#050505"
                  name="Lower Bound"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#22c55e' }}
                  name="Actual Revenue"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#3b82f6' }}
                  name="Forecast"
                  connectNulls={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      ) : (
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-12 text-center space-y-2">
          <p className="text-zinc-300 font-semibold text-base">No Sales or Billing Records Found</p>
          <p className="text-zinc-500 text-xs max-w-md mx-auto">
            {forecastData?.notice || 'Generate customer bills in the Billing section to automatically view revenue predictions.'}
          </p>
        </div>
      )}


      {/* Category Highlights Table */}
      {summary.category_highlights?.length > 0 && (
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">
            Category Revenue Forecast Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-3 px-4 text-zinc-500 font-medium">Category</th>
                  <th className="text-right py-3 px-4 text-zinc-500 font-medium">Predicted Total</th>
                  <th className="text-right py-3 px-4 text-zinc-500 font-medium">Avg Monthly</th>
                  <th className="text-right py-3 px-4 text-zinc-500 font-medium">Peak Month</th>
                  <th className="text-right py-3 px-4 text-zinc-500 font-medium">Peak Revenue</th>
                </tr>
              </thead>
              <tbody>
                {summary.category_highlights.map((cat, i) => (
                  <tr
                    key={i}
                    className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-zinc-200 font-medium">{cat.category}</td>
                    <td className="py-3 px-4 text-right text-zinc-300">{formatCurrency(cat.predicted_total)}</td>
                    <td className="py-3 px-4 text-right text-zinc-400">{formatCurrency(cat.avg_monthly)}</td>
                    <td className="py-3 px-4 text-right text-zinc-400">{cat.peak_month}</td>
                    <td className="py-3 px-4 text-right text-zinc-300">{formatCurrency(cat.peak_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function KPICard({ title, value, subtitle, icon, color }) {
  const colorMap = {
    blue: 'from-blue-500/10 to-blue-500/0 border-blue-500/20',
    violet: 'from-violet-500/10 to-violet-500/0 border-violet-500/20',
    green: 'from-green-500/10 to-green-500/0 border-green-500/20',
    red: 'from-red-500/10 to-red-500/0 border-red-500/20',
    orange: 'from-orange-500/10 to-orange-500/0 border-orange-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-b ${colorMap[color] || colorMap.blue} border rounded-xl p-4`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="text-2xl font-bold text-zinc-100">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{subtitle}</div>
    </motion.div>
  );
}
