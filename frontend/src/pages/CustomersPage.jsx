import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersAPI, ingestionAPI } from '../api/client';
import { Card, MissingDataBadge } from '../components/UI';
import { HiOutlineCloudArrowUp, HiOutlineUsers } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [datasetStatus, setDatasetStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [custRes, metaRes] = await Promise.all([
          customersAPI.list(0, 100).catch(() => ({ data: { customers: [] } })),
          ingestionAPI.getDatasetStatus().catch(() => ({ data: { has_dataset: false } })),
        ]);
        setCustomers(custRes.data.customers || []);
        setDatasetStatus(metaRes.data);
      } catch (err) {
        toast.error('Failed to load customers');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const hasDataset = Boolean(datasetStatus?.has_dataset);
  const hasCustomerData = hasDataset && Boolean(datasetStatus?.available_metrics?.customers);
  const isCustomerMissing = hasDataset && !hasCustomerData;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            Customers
            {isCustomerMissing && (
              <MissingDataBadge tooltip="Customer data not mentioned in the dataset" />
            )}
          </h1>
          <p className="text-zinc-400">
            {hasCustomerData
              ? `Displaying ${customers.length} customer profiles derived strictly from the active dataset.`
              : 'View and manage your customer segments.'}
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
          <div className="p-12 text-center text-zinc-500">Loading customers...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="p-4 font-medium">Customer ID</th>
                  <th className="p-4 font-medium">Orders Count</th>
                  <th className="p-4 font-medium">Segment</th>
                  <th className="p-4 font-medium">LTV / Total Spent (₹)</th>
                  <th className="p-4 font-medium">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {customers.map((c) => (
                  <tr key={c.id || c.customer_id} className="hover:bg-zinc-800/30 transition-colors text-sm">
                    <td className="p-4 text-zinc-300 font-mono text-xs">{c.customer_id}</td>
                    <td className="p-4 text-zinc-400">{c.total_orders || 1}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {c.segment || 'Customer'}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-200 font-medium">
                      ₹{(c.lifetime_value || c.total_spent || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-zinc-400">{c.state || c.city || '—'}</td>
                  </tr>
                ))}

                {customers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      {isCustomerMissing ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <MissingDataBadge tooltip="This data not mentioned in the dataset" className="mb-1" />
                          <p className="text-zinc-300 font-medium text-base">
                            Customer data is not mentioned in the uploaded dataset.
                          </p>
                          <p className="text-zinc-500 text-xs max-w-md">
                            No CustomerID column was detected in the active file. All customer-level segmentation is marked unavailable.
                          </p>
                        </div>
                      ) : !hasDataset ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <HiOutlineUsers className="text-3xl text-zinc-600 mb-1" />
                          <p className="text-zinc-300 font-medium text-base">Zero-State Active: No customers found.</p>
                          <p className="text-zinc-500 text-xs">Upload an e-commerce dataset to populate customer analytics.</p>
                        </div>
                      ) : (
                        <p className="text-zinc-500 text-sm">No customers found in current dataset.</p>
                      )}
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
