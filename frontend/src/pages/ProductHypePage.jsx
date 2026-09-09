import { useState } from 'react';
import { motion } from 'framer-motion';
import { analyticsAPI } from '../api/client';
import { Card, StatCard } from '../components/UI';
import { HiOutlineFire, HiOutlineMagnifyingGlass, HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown, HiOutlineChartBar } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const HYPE_LABELS = {
  0: { label: 'Severe Drop', emoji: '🧊', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', ring: 'text-rose-500' },
  1: { label: 'Dropping', emoji: '📉', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', ring: 'text-orange-500' },
  2: { label: 'Steady', emoji: '📊', color: 'text-zinc-300', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', ring: 'text-zinc-400' },
  3: { label: 'Growing', emoji: '📈', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', ring: 'text-emerald-500' },
  4: { label: 'Viral Hype', emoji: '🔥', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', ring: 'text-blue-500' },
};

export default function ProductHypePage() {
  const [stockCode, setStockCode] = useState('');
  const [hypeData, setHypeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHype = async (e) => {
    e.preventDefault();
    if (!stockCode.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsAPI.getHypePrediction(stockCode.trim());
      setHypeData(response.data);
      toast.success(`Hype analysis complete for ${stockCode.trim()}`);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to fetch hype data.';
      setError(msg);
      setHypeData(null);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const hypeInfo = hypeData ? HYPE_LABELS[hypeData.predicted_bin] || HYPE_LABELS[2] : null;

  // Build chart data
  const chartData = hypeData
    ? [
        { name: 'Month T-3', sales: hypeData.historical_sales[0], type: 'historical' },
        { name: 'Month T-2', sales: hypeData.historical_sales[1], type: 'historical' },
        { name: 'Month T-1', sales: hypeData.historical_sales[2], type: 'historical' },
        { name: 'Predicted', sales: hypeData.historical_sales[3], type: 'predicted' },
      ]
    : [];

  // SVG ring calculation
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = hypeData
    ? circumference - (circumference * hypeData.hype_score) / 100
    : circumference;

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          Hype AI <HiOutlineFire className="text-orange-500" />
        </h1>
        <p className="text-zinc-400">
          Predict next month's product demand trends using our Deep Q-Network RL agent.
        </p>
      </header>

      {/* Search Bar */}
      <Card className="p-6 mb-8">
        <form onSubmit={fetchHype} className="flex gap-4">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              value={stockCode}
              onChange={(e) => setStockCode(e.target.value)}
              placeholder="Enter Product Stock Code (e.g. 85123A)"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-10 pr-4 py-2.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 bg-zinc-100 hover:bg-white text-zinc-900 font-medium py-2.5 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Hype'
            )}
          </button>
        </form>
        {error && <p className="text-rose-400 mt-3 text-sm">{error}</p>}
      </Card>

      {/* Empty State */}
      {!hypeData && !loading && (
        <Card className="p-6 h-[220px] flex flex-col items-center justify-center text-zinc-500 border-dashed">
          <HiOutlineFire size={32} className="mb-3 opacity-50" />
          <p>Enter a stock code to see AI-powered hype predictions</p>
          <p className="text-xs mt-2 text-zinc-600">Try: 85123A, 22423, 21212, 23166</p>
        </Card>
      )}

      {/* Results */}
      {hypeData && hypeInfo && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {/* Top KPI Row */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              label="Hype Score"
              value={`${hypeData.hype_score}/100`}
              icon={<HiOutlineFire size={22} />}
              trend={hypeData.actual_growth_percentage > 0 ? hypeData.actual_growth_percentage : undefined}
            />
            <StatCard
              label="Predicted Trend"
              value={`${hypeInfo.label} ${hypeInfo.emoji}`}
              icon={hypeData.predicted_bin >= 2 ? <HiOutlineArrowTrendingUp size={22} /> : <HiOutlineArrowTrendingDown size={22} />}
            />
            <StatCard
              label="Growth Rate"
              value={`${hypeData.actual_growth_percentage > 0 ? '+' : ''}${hypeData.actual_growth_percentage}%`}
              icon={<HiOutlineChartBar size={22} />}
              trend={hypeData.actual_growth_percentage}
            />
          </section>

          {/* Main Content: Ring + Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Hype Ring */}
            <section className="lg:col-span-4">
              <Card className="p-6 h-full flex flex-col items-center justify-center">
                <h3 className="text-sm font-semibold tracking-wide text-zinc-400 uppercase mb-6 self-start">RL Prediction</h3>
                <div className="relative mb-6">
                  <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 140 140">
                    <circle
                      cx="70" cy="70" r={radius}
                      stroke="currentColor" strokeWidth="10" fill="transparent"
                      className="text-zinc-800"
                    />
                    <circle
                      cx="70" cy="70" r={radius}
                      stroke="currentColor" strokeWidth="10" fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className={`${hypeInfo.ring} transition-all duration-1000 ease-out`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-4xl font-bold text-zinc-100">{hypeData.hype_score}</span>
                    <span className="text-xs text-zinc-500 mt-1">/ 100</span>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${hypeInfo.bg} ${hypeInfo.border} border ${hypeInfo.color}`}>
                  {hypeInfo.emoji} {hypeInfo.label}
                </div>
                <p className="text-zinc-500 text-xs mt-4">
                  Target: {hypeData.target_month}
                </p>
              </Card>
            </section>

            {/* Sales Volume Chart */}
            <section className="lg:col-span-8">
              <Card className="p-6 h-full">
                <h3 className="text-sm font-semibold tracking-wide text-zinc-400 uppercase mb-6">
                  Sales Volume Trend — Last 3 Months + Prediction
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                      <defs>
                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#52525b"
                        tick={{ fill: '#71717a', fontSize: 12 }}
                        axisLine={{ stroke: '#3f3f46' }}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#52525b"
                        tick={{ fill: '#71717a', fontSize: 12 }}
                        axisLine={{ stroke: '#3f3f46' }}
                        tickLine={false}
                        tickFormatter={(v) => v.toLocaleString()}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#3f3f46',
                          borderRadius: '8px',
                          padding: '8px 12px',
                        }}
                        itemStyle={{ color: '#e4e4e7' }}
                        labelStyle={{ color: '#a1a1aa', fontWeight: 600, marginBottom: 4 }}
                        formatter={(value) => [value.toLocaleString(), 'Units Sold']}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        fill="url(#salesGradient)"
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5, stroke: '#18181b' }}
                        activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 2, fill: '#18181b' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-6 mt-4 text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    Historical + Predicted Volume
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-0.5 bg-zinc-600" />
                    Product: {hypeData.stock_code}
                  </div>
                </div>
              </Card>
            </section>
          </div>
        </motion.div>
      )}
    </div>
  );
}
