import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, customersAPI, returnsAPI, ingestionAPI } from '../api/client';
import { Card, StatCard, MissingDataBadge } from '../components/UI';
import {
  HiOutlineCurrencyRupee,
  HiOutlineShoppingCart,
  HiOutlineUsers,
  HiOutlineArrowUturnLeft,
  HiOutlineCloudArrowUp,
  HiOutlineExclamationCircle,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    orders: null,
    customers: null,
    returns: null,
  });
  const [datasetMeta, setDatasetMeta] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin"></div>
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

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Overview</h1>
          <p className="text-zinc-400">Your Sales Analyzer business performance at a glance.</p>
        </div>

        {hasDataset ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium self-start">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Dataset Active: {datasetMeta.file_name}</span>
          </div>
        ) : (
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-indigo-600/20 self-start cursor-pointer"
          >
            <HiOutlineCloudArrowUp className="text-lg" />
            Upload Dataset
          </button>
        )}
      </header>

      {/* Zero State Notification Banner if no dataset */}
      {!hasDataset && (
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <HiOutlineExclamationCircle className="text-xl" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-200">Zero-State Active</h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                No sales dataset uploaded yet. All metrics show 0 or null until you upload a dataset.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/upload')}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md text-xs font-medium border border-zinc-700 transition"
          >
            Upload CSV/Excel
          </button>
        </div>
      )}

      {/* Main KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </section>

      {/* Two Column Layout: Customer Segments & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Segments */}
        <section className="lg:col-span-2">
          <Card
            className="p-6 h-full"
            isMissing={isCustomersMissing}
            missingTooltip={missingTooltips.customer_segments || "This data not mentioned in the dataset"}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Customer Segments</h2>
              {isCustomersMissing && (
                <span className="text-xs text-amber-400/90 font-medium">Missing from dataset</span>
              )}
            </div>

            {hasCustomerSegments ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {segmentsList.map((item) => (
                  <div key={item.segment} className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                    <div className="text-2xl font-semibold text-zinc-200 mb-1">{item.count}</div>
                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{item.segment}</div>
                  </div>
                ))}
              </div>
            ) : isCustomersMissing ? (
              <div className="p-6 rounded-lg bg-zinc-950/40 border border-zinc-800/80 text-center">
                <p className="text-zinc-400 text-sm">Customer data not mentioned in the dataset.</p>
                <p className="text-zinc-500 text-xs mt-1">Customer ID column was not present in the uploaded file.</p>
              </div>
            ) : (
              <div className="text-zinc-500 text-sm py-6 text-center">
                No customer data available. Upload a dataset with Customer IDs to view segments.
              </div>
            )}
          </Card>
        </section>

        {/* Recent Insights */}
        <section className="lg:col-span-1">
          <Card className="p-6 h-full flex flex-col">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-100 mb-6">Dataset Insights</h2>
            {hasDataset ? (
              <div className="space-y-4 flex-1">
                <div className="p-3 rounded bg-zinc-900 border border-zinc-800 text-sm">
                  <span className="text-emerald-400 font-medium mr-2">✓ Processed Records</span>
                  {datasetMeta?.total_rows?.toLocaleString()} transaction lines loaded.
                </div>

                {isReturnsMissing ? (
                  <div className="p-3 rounded bg-amber-500/5 border border-amber-500/20 text-sm flex items-start gap-2 relative">
                    <span className="text-amber-400 font-bold">!</span>
                    <span className="text-amber-200/90 text-xs">Return records not mentioned in the dataset.</span>
                    <MissingDataBadge tooltip={missingTooltips.returns || "This data not mentioned in the dataset"} className="ml-auto" />
                  </div>
                ) : (
                  <div className="p-3 rounded bg-zinc-900 border border-zinc-800 text-sm">
                    <span className="text-zinc-300 font-medium mr-2">Returns</span>
                    {stats.returns?.total_returns || 0} returned orders detected.
                  </div>
                )}

                {isProfitMissing ? (
                  <div className="p-3 rounded bg-amber-500/5 border border-amber-500/20 text-sm flex items-start gap-2 relative">
                    <span className="text-amber-400 font-bold">!</span>
                    <span className="text-amber-200/90 text-xs">Profit data not mentioned in the dataset.</span>
                    <MissingDataBadge tooltip={missingTooltips.profit || "This data not mentioned in the dataset"} className="ml-auto" />
                  </div>
                ) : (
                  <div className="p-3 rounded bg-zinc-900 border border-zinc-800 text-sm">
                    <span className="text-emerald-400 font-medium mr-2">Profit Tracking</span>
                    Profit margins available in uploaded dataset.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <p className="text-zinc-400 text-sm">No automated insights available.</p>
                <p className="text-zinc-500 text-xs mt-1">Upload a dataset to generate real-time business insights.</p>
              </div>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
