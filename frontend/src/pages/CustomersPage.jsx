import { useState, useEffect } from 'react';
import { customersAPI } from '../api/client';
import { Card } from '../components/UI';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await customersAPI.list(0, 50);
        setCustomers(res.data.customers);
      } catch (err) {
        toast.error('Failed to load customers');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Customers</h1>
          <p className="text-zinc-400">View and manage your customer segments.</p>
        </div>
      </header>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="p-4 font-medium">Customer ID</th>
                  <th className="p-4 font-medium">RFM Score</th>
                  <th className="p-4 font-medium">Segment</th>
                  <th className="p-4 font-medium">LTV (₹)</th>
                  <th className="p-4 font-medium">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors text-sm">
                    <td className="p-4 text-zinc-300 font-mono text-xs">{c.customer_id}</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">R:{c.recency}</span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">F:{c.frequency}</span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">M:{c.monetary}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {c.segment}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-200">
                      {c.ltv ? `₹${c.ltv.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="p-4 text-zinc-400">{c.location || 'Unknown'}</td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500">
                      No customers found. Please ingest some e-commerce data.
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
