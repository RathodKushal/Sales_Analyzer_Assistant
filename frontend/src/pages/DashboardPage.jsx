import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, customersAPI, returnsAPI, ingestionAPI } from '../api/client';
import { Card, StatCard, MissingDataBadge } from '../components/UI';
import {
  HiOutlineCurrencyRupee,
  HiOutlineShoppingCart,
  HiOutlineUsers,
  HiOutlineArrowUturnLeft,
  HiOutlineCloudArrowUp,
  HiOutlineExclamationCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import ThreeSalesBanner from '../components/ThreeSalesBanner';

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [stats, setStats] = useState({
    orders: null,
    customers: null,
    returns: null,
  });
  const [datasetMeta, setDatasetMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLandingBanner, setShowLandingBanner] = useState(Boolean(location.state?.justLoggedIn));

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [ordersRes, customersRes, returnsRes, metaRes] = await Promise.all([
          ordersAPI.getStats().catch(() => ({ data: { total_orders: 0, total_revenue: 0, average_order_value: 0 } })),
          customersAPI.getSegments().catch(() => ({ data: [] })),
          returnsAPI.getStats().catch(() => ({ data: { total_returns: 0, return_rate_percentage: 0, has_data: false } })),
          ingestionAPI.getDatasetStatus().catch(() => ({ data: { has_dataset: false } })),
        ]);
        
        setStats({
          orders: ordersRes.data,
          customers: customersRes.data,
          returns: returnsRes.data,
        });
        setDatasetMeta(metaRes.data);
      } catch (err) {
        toast.error('Failed to load dashboard statistics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  // Auto-dismiss landing banner after 4 seconds
  useEffect(() => {
    if (showLandingBanner) {
      const timer = setTimeout(() => {
        setShowLandingBanner(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showLandingBanner]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasDataset = Boolean(datasetMeta?.has_dataset);
  const metrics = datasetMeta?.available_metrics || {};
  const missingTooltips = datasetMeta?.missing_tooltips || {};

  // Parse customer segments (supports array from /api/customers/stats or dict)
  const segmentsList = Array.isArray(stats.customers)
    ? stats.customers
    : stats.customers?.segments
    ? Object.entries(stats.customers.segments).map(([segment, count]) => ({ segment, count }))
    : [];

  const hasCustomerSegments = hasDataset && metrics.customers && segmentsList.length > 0;
  const isReturnsMissing = hasDataset && !metrics.returns;
  const isCustomersMissing = hasDataset && !metrics.customers;
  const isProfitMissing = hasDataset && !metrics.profit;

  // Staggered motion entrance variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } 
    },
  };

  return (
    <div className="relative">
      {/* 1. Landing HUD Notification Bar (Triggered on login landing) */}
      <AnimatePresence>
        {showLandingBanner && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            onClick={() => setShowLandingBanner(false)}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-zinc-950/85 backdrop-blur-2xl border border-cyan-500/35 shadow-[0_12px_45px_rgba(6,182,212,0.3)] text-xs text-zinc-200 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <HiOutlineSparkles className="animate-spin text-sm" style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <p className="font-bold text-white flex items-center gap-2">
                <span>WORKSPACE INITIALIZED</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </p>
              <p className="text-[11px] text-zinc-400">
                Welcome back, <span className="text-cyan-300 font-semibold">{user?.username || 'Operator'}</span> • 3D Neural Nodes Online • 60 FPS
              </p>
            </div>
            <span className="text-[11px] text-zinc-500 ml-2 group-hover:text-zinc-200 transition">✕</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Staggered Landing Content Motion Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Header */}
        <motion.header variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 drop-shadow-sm">Overview</h1>
            <p className="text-zinc-400">Your Sales Analyzer business performance at a glance.</p>
          </div>

          {hasDataset ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold self-start backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Dataset Active: {datasetMeta.file_name}</span>
            </div>
          ) : (
            <button
              onClick={() => navigate('/upload')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/20 self-start cursor-pointer active:scale-95"
            >
              <HiOutlineCloudArrowUp className="text-lg" />
              Upload Dataset
            </button>
          )}
        </motion.header>

        {/* 3D Real-time Sales Intelligence Core Banner */}
        <motion.div variants={itemVariants}>
          <ThreeSalesBanner 
            totalOrders={stats.orders?.total_orders || 0}
            totalRevenue={stats.orders?.total_revenue || 0}
          />
        </motion.div>

        {/* Zero State Notification Banner if no dataset */}
        {!hasDataset && (
          <motion.div variants={itemVariants} className="p-5 bg-zinc-950/65 backdrop-blur-2xl border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-gradient-to-tr from-cyan-500/15 to-violet-500/15 border border-white/10 text-cyan-400 rounded-xl shadow-inner">
                <HiOutlineExclamationCircle className="text-2xl" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">Zero-State Active</h4>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  No sales dataset uploaded yet. Upload your CSV/Excel dataset to activate full 3D CRM intelligence and telemetry.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition cursor-pointer active:scale-95 flex-shrink-0"
            >
              Upload CSV/Excel
            </button>
          </motion.div>
        )}

        {/* Main KPI Grid */}
        <motion.section variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Total Revenue" 
            value={`₹${(hasDataset ? (stats.orders?.total_revenue || 0) : 0).toLocaleString()}`} 
            icon={<HiOutlineCurrencyRupee size={22} />} 
          />
          <StatCard 
            label="Total Orders" 
            value={(hasDataset ? (stats.orders?.total_orders || 0) : 0).toLocaleString()} 
            icon={<HiOutlineShoppingCart size={22} />} 
          />
          <StatCard 
            label="Avg Order Value" 
            value={`₹${(hasDataset ? (stats.orders?.average_order_value || 0) : 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} 
            icon={<HiOutlineCurrencyRupee size={22} />} 
          />
          <StatCard 
            label="Return Rate" 
            value={hasDataset && metrics.returns ? `${(stats.returns?.return_rate_percentage || 0).toFixed(1)}%` : '0.0%'} 
            icon={<HiOutlineArrowUturnLeft size={22} />} 
            isMissing={isReturnsMissing}
            missingTooltip={missingTooltips.returns || "This data not mentioned in the dataset"}
          />
        </motion.section>

        {/* Two Column Layout: Customer Segments & Insights */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Customer Segments */}
          <section className="lg:col-span-2">
            <Card
              className="p-7 h-full"
              isMissing={isCustomersMissing}
              missingTooltip={missingTooltips.customer_segments || "This data not mentioned in the dataset"}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Customer Segments</h2>
                  <p className="text-xs text-zinc-400 mt-1">Algorithmic RFM behavioral cohorts</p>
                </div>
                {isCustomersMissing && (
                  <span className="text-xs text-amber-400/90 font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    Missing from dataset
                  </span>
                )}
              </div>

              {hasCustomerSegments ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {segmentsList.map((item) => (
                    <div key={item.segment} className="p-4 rounded-2xl bg-zinc-950/60 backdrop-blur-xl border border-white/10 hover:border-white/20 transition shadow-inner">
                      <div className="text-2xl font-extrabold text-white mb-1 drop-shadow-sm">{item.count}</div>
                      <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">{item.segment}</div>
                    </div>
                  ))}
                </div>
              ) : isCustomersMissing ? (
                <div className="p-8 rounded-2xl bg-zinc-950/50 backdrop-blur-xl border border-white/10 text-center">
                  <p className="text-zinc-300 text-sm font-medium">Customer data not mentioned in the dataset.</p>
                  <p className="text-zinc-500 text-xs mt-1.5">Customer ID column was not present in the uploaded file.</p>
                </div>
              ) : (
                <div className="text-zinc-400 text-sm py-8 text-center bg-zinc-950/40 rounded-2xl border border-white/5">
                  No customer data available. Upload a dataset with Customer IDs to view segments.
                </div>
              )}
            </Card>
          </section>

          {/* Recent Insights */}
          <section className="lg:col-span-1">
            <Card className="p-7 h-full flex flex-col">
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight text-white">Dataset Telemetry</h2>
                <p className="text-xs text-zinc-400 mt-1">Live database ingestion health</p>
              </div>
              {hasDataset ? (
                <div className="space-y-3.5 flex-1">
                  <div className="p-3.5 rounded-xl bg-zinc-950/60 backdrop-blur-xl border border-white/10 text-sm flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 font-semibold text-xs uppercase tracking-wide">Processed:</span>
                    <span className="text-zinc-200 text-xs">{datasetMeta?.total_rows?.toLocaleString()} transaction rows</span>
                  </div>

                  {isReturnsMissing ? (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 text-sm flex items-start gap-2.5 relative">
                      <span className="text-amber-400 font-bold text-xs">!</span>
                      <span className="text-amber-200/90 text-xs">Return records not in dataset.</span>
                      <MissingDataBadge tooltip={missingTooltips.returns || "This data not mentioned in the dataset"} className="ml-auto" />
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-zinc-950/60 backdrop-blur-xl border border-white/10 text-sm flex items-center justify-between">
                      <span className="text-zinc-300 font-medium text-xs">Returns Detected:</span>
                      <span className="text-white font-bold text-xs">{stats.returns?.total_returns || 0} orders</span>
                    </div>
                  )}

                  {isProfitMissing ? (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 text-sm flex items-start gap-2.5 relative">
                      <span className="text-amber-400 font-bold text-xs">!</span>
                      <span className="text-amber-200/90 text-xs">Profit metric not in dataset.</span>
                      <MissingDataBadge tooltip={missingTooltips.profit || "This data not mentioned in the dataset"} className="ml-auto" />
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-zinc-950/60 backdrop-blur-xl border border-white/10 text-sm flex items-center justify-between">
                      <span className="text-zinc-300 font-medium text-xs">Profit Metric:</span>
                      <span className="text-emerald-400 font-bold text-xs">Available</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-zinc-400 text-xs py-10 text-center bg-zinc-950/40 rounded-2xl border border-white/5 flex-1 flex items-center justify-center">
                  Upload a file to stream live telemetry insights.
                </div>
              )}
            </Card>
          </section>
        </motion.div>
      </motion.div>
    </div>
  );
}
