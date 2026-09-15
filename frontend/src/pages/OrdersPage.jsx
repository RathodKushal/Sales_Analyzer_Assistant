import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, ingestionAPI } from '../api/client';
import { Card, StatCard } from '../components/UI';
import { 
  HiOutlineCloudArrowUp, 
  HiOutlineShoppingCart, 
  HiOutlineCurrencyRupee, 
  HiOutlineCalendar, 
  HiOutlineMagnifyingGlass,
  HiOutlineSparkles,
  HiOutlineReceiptPercent
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [datasetStatus, setDatasetStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const [ordersRes, metaRes] = await Promise.all([
          ordersAPI.list(0, 100).catch(() => ({ data: { orders: [], total: 0 } })),
          ingestionAPI.getDatasetStatus().catch(() => ({ data: { has_dataset: false } })),
        ]);
        setOrders(ordersRes.data.orders || []);
        setTotalOrders(ordersRes.data.total || 0);
        setDatasetStatus(metaRes.data);
      } catch (err) {
        toast.error('Failed to load orders');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const hasDataset = Boolean(datasetStatus?.has_dataset);

  // Compute summary stats
  const totalVolume = useMemo(() => {
    return orders.reduce((acc, o) => acc + (o.total_amount || 0), 0);
  }, [orders]);

  const avgOrderValue = useMemo(() => {
    return orders.length > 0 ? totalVolume / orders.length : 0;
  }, [orders, totalVolume]);

  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        (o.order_id && String(o.order_id).toLowerCase().includes(q)) ||
        (o.customer_id && String(o.customer_id).toLowerCase().includes(q)) ||
        (o.status && o.status.toLowerCase().includes(q))
    );
  }, [orders, searchQuery]);

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-white/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2 backdrop-blur-md">
            <HiOutlineSparkles className="text-sm animate-spin" style={{ animationDuration: '6s' }} />
            <span>Transaction Ledger & Invoicing</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">Orders Ledger</h1>
          <p className="text-zinc-400 mt-1">
            {hasDataset
              ? `Displaying ${filteredOrders.length} of ${totalOrders.toLocaleString()} transactional records from active dataset.`
              : 'Recent transactions, payment verification, and order settlement.'}
          </p>
        </div>

        {!hasDataset && (
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/25 self-start cursor-pointer active:scale-95"
          >
            <HiOutlineCloudArrowUp className="text-lg" />
            Upload Dataset
          </button>
        )}
      </header>

      {/* Summary KPI Cards in Frosted Glass */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          label="Total Orders"
          value={totalOrders.toLocaleString()}
          icon={<HiOutlineShoppingCart size={22} />}
        />
        <StatCard
          label="Processed Volume"
          value={`₹${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          icon={<HiOutlineCurrencyRupee size={22} />}
        />
        <StatCard
          label="Average Order Value"
          value={`₹${avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          icon={<HiOutlineReceiptPercent size={22} />}
        />
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input
            type="text"
            placeholder="Search by Order ID, Customer ID, status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-zinc-950/60 backdrop-blur-xl border border-white/10 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 transition shadow-inner"
          />
        </div>

        <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
          Showing {filteredOrders.length} records
        </span>
      </div>

      {/* Glassmorphic Orders Table */}
      <Card className="overflow-hidden border border-white/10 shadow-[0_12px_44px_rgba(0,0,0,0.6)]">
        {loading ? (
          <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
            <span>Loading transaction records...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-zinc-950/80 backdrop-blur-2xl text-xs uppercase tracking-wider text-zinc-400">
                  <th className="p-4 font-semibold">Order ID</th>
                  <th className="p-4 font-semibold">Customer ID</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((o) => (
                  <tr key={o.id || o.order_id} className="hover:bg-white/[0.04] transition-colors text-sm group">
                    <td className="p-4 text-cyan-300 font-mono text-xs font-semibold">
                      {o.order_id}
                    </td>
                    <td className="p-4 text-zinc-300 font-mono text-xs">
                      {o.customer_id ? o.customer_id : '—'}
                    </td>
                    <td className="p-4 text-zinc-400 text-xs">
                      {o.order_date ? new Date(o.order_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {o.status || 'Completed'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-400">
                      ₹{(o.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-zinc-500">
                          <HiOutlineShoppingCart className="text-3xl" />
                        </div>
                        <p className="text-zinc-200 font-semibold text-base">
                          {searchQuery ? 'No matching orders found' : 'Zero-State Active: No orders found'}
                        </p>
                        <p className="text-zinc-500 text-xs max-w-sm">
                          {hasDataset
                            ? 'Try adjusting your search criteria or clear the filter.'
                            : 'Upload a sales dataset to populate transactions, customer IDs, and settlement history.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
