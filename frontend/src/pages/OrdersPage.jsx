import { useState, useEffect } from 'react';
import { ordersAPI } from '../api/client';
import { Card } from '../components/UI';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await ordersAPI.list(0, 50);
        setOrders(res.data.orders);
      } catch (err) {
        toast.error('Failed to load orders');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Orders</h1>
        <p className="text-zinc-400">Recent transactions and their values.</p>
      </header>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading...</div>
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
                  <tr key={o.id} className="hover:bg-zinc-800/30 transition-colors text-sm">
                    <td className="p-4 text-zinc-300 font-mono text-xs">{o.order_id}</td>
                    <td className="p-4 text-zinc-400 font-mono text-xs">{o.customer_id}</td>
                    <td className="p-4 text-zinc-400">
                      {new Date(o.order_date).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {o.status || 'Completed'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-emerald-400">
                      ₹{o.total_amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                      No orders found.
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
