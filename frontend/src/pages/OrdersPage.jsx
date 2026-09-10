import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, ingestionAPI } from '../api/client';
import { Card } from '../components/UI';
import { HiOutlineCloudArrowUp, HiOutlineShoppingCart } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [datasetStatus, setDatasetStatus] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Orders</h1>
          <p className="text-zinc-400">
            {hasDataset
              ? `Displaying ${orders.length} of ${totalOrders.toLocaleString()} orders from active dataset.`
              : 'Recent transactions and their values.'}
          </p>
        </div>

        {!hasDataset && (
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition self-start"
          >
            <HiOutlineCloudArrowUp className="text-lg" />
            Upload Dataset
          </button>
        )}
      </header>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading transactions...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="p-4 font-medium">Order ID</th>
                  <th className="p-4 font-medium">Customer ID</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {orders.map((o) => (
                  <tr key={o.id || o.order_id} className="hover:bg-zinc-800/30 transition-colors text-sm">
                    <td className="p-4 text-zinc-300 font-mono text-xs">{o.order_id}</td>
                    <td className="p-4 text-zinc-400 font-mono text-xs">{o.customer_id ? o.customer_id : '—'}</td>
                    <td className="p-4 text-zinc-400">
                      {o.order_date ? new Date(o.order_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {o.status || 'Completed'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-emerald-400">
                      ₹{(o.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <HiOutlineShoppingCart className="text-3xl text-zinc-600 mb-1" />
                        <p className="text-zinc-300 font-medium text-base">Zero-State Active: No orders found.</p>
                        <p className="text-zinc-500 text-xs">
                          {hasDataset
                            ? 'No orders were extracted from the uploaded file.'
                            : 'Upload a sales dataset to view order transactions and line totals.'}
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
