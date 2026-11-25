import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersAPI } from '../api/client';
import { Card, StatCard } from '../components/UI';
import {
  HiOutlineUsers,
  HiOutlineShoppingCart,
  HiOutlineCurrencyRupee,
  HiOutlineCalendar,
  HiOutlineMagnifyingGlass,
  HiOutlineSparkles,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineArrowPath,
  HiOutlineReceiptPercent,
  HiOutlineBuildingStorefront,
  HiOutlineXMark,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await customersAPI.list(0, 200);
      const custList = res.data?.customers || [];
      setCustomers(custList);
      setTotalCustomers(res.data?.total || custList.length);
    } catch (err) {
      toast.error('Failed to load customer directory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filter customers by live search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const city = (c.city || '').toLowerCase();
      const state = (c.state || '').toLowerCase();
      const id = String(c.customer_id || '');
      return (
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        city.includes(q) ||
        state.includes(q) ||
        id.includes(q)
      );
    });
  }, [customers, searchQuery]);

  // Aggregate stats
  const totalSpentAll = useMemo(() => {
    return customers.reduce((acc, c) => acc + (parseFloat(c.total_spent) || 0), 0);
  }, [customers]);

  const totalOrdersAll = useMemo(() => {
    return customers.reduce((acc, c) => acc + (parseInt(c.total_orders, 10) || 0), 0);
  }, [customers]);

  const avgSpentPerCustomer = useMemo(() => {
    return customers.length > 0 ? totalSpentAll / customers.length : 0;
  }, [customers, totalSpentAll]);

  return (
    <div className="animate-in fade-in duration-500 space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-white/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2 backdrop-blur-md">
            <HiOutlineSparkles className="text-sm animate-spin" style={{ animationDuration: '6s' }} />
            <span>Verified Customer Directory</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Customer Registry
          </h1>
          <p className="text-zinc-400 mt-1">
            Built exclusively from customers who have made purchases through the POS & Billing system.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCustomers}
            title="Refresh customer list"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white text-xs font-semibold transition cursor-pointer"
          >
            <HiOutlineArrowPath className={loading ? 'animate-spin' : ''} size={16} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => navigate('/billing')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-600/20 active:scale-95 cursor-pointer"
          >
            <HiOutlineReceiptPercent size={18} />
            <span>New Sale / Bill</span>
          </button>
        </div>
      </header>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Billed Customers"
          value={totalCustomers.toLocaleString()}
          icon={<HiOutlineUsers size={20} />}
        />
        <StatCard
          label="Total Orders"
          value={totalOrdersAll.toLocaleString()}
          icon={<HiOutlineShoppingCart size={20} />}
        />
        <StatCard
          label="Total Revenue"
          value={`₹${totalSpentAll.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
          icon={<HiOutlineCurrencyRupee size={20} />}
        />
        <StatCard
          label="Avg Customer Spend"
          value={`₹${avgSpentPerCustomer.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
          icon={<HiOutlineSparkles size={20} />}
        />
      </div>

      {/* Main Customers Table Card */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HiOutlineUsers className="text-cyan-400" size={18} />
              <span>Purchasing Customers</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Showing {filteredCustomers.length} of {totalCustomers} registered buyers
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-96">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, email, or customer ID..."
              className="w-full pl-9 pr-9 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 rounded transition cursor-pointer"
              >
                <HiOutlineXMark size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Table / Empty State */}
        {loading ? (
          <div className="py-20 text-center text-zinc-400">
            <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-sm">Loading verified customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center text-zinc-500">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <HiOutlineUsers size={26} />
            </div>
            <h3 className="text-base font-bold text-zinc-200">No Billed Customers Recorded Yet</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Customer profiles are recorded automatically when purchases are completed through the POS / Billing system.
            </p>
            <button
              onClick={() => navigate('/billing')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer shadow-md shadow-cyan-600/20"
            >
              <HiOutlineReceiptPercent size={16} />
              <span>Open POS & Generate First Bill</span>
            </button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center text-zinc-500">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900/80 border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <HiOutlineMagnifyingGlass size={26} />
            </div>
            <h3 className="text-base font-bold text-zinc-200">No Matching Customers Found</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              No verified purchasing customers match <span className="text-cyan-400 font-semibold font-mono">"{searchQuery}"</span>. Try searching by name, phone number, email address, or customer ID.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold border border-white/10 transition cursor-pointer"
            >
              <HiOutlineXMark size={14} />
              <span>Clear Search Query</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-wider text-[11px] border-b border-white/10">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer Name</th>
                  <th className="py-3 px-4 font-semibold">Contact Info</th>
                  <th className="py-3 px-4 font-semibold text-center">Number of Orders</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Spent (₹)</th>
                  <th className="py-3 px-4 font-semibold">Last Purchase Date</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {filteredCustomers.map((c) => {
                  const initials = (c.name || 'C')
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  const lastPurchase = c.last_purchase_date
                    ? new Date(c.last_purchase_date).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '—';

                  const totalSpent = parseFloat(c.total_spent || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });

                  return (
                    <tr
                      key={c.id || c.customer_id}
                      className="hover:bg-zinc-900/50 transition"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-100 text-xs hover:text-cyan-400 transition">
                              {c.name || `Customer #${c.customer_id}`}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ID: #{c.customer_id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {c.phone ? (
                            <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-[11px]">
                              <HiOutlinePhone className="text-zinc-500" size={13} />
                              <span>{c.phone}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-600 text-[11px]">No phone</span>
                          )}

                          {c.email ? (
                            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                              <HiOutlineEnvelope className="text-zinc-500" size={13} />
                              <span className="truncate max-w-[180px]">{c.email}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-600 text-[11px]">No email</span>
                          )}
                        </div>
                      </td>

                      {/* Number of Orders */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 font-mono">
                          {c.total_orders || 1} {c.total_orders === 1 ? 'order' : 'orders'}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-extrabold text-sm text-white">
                          ₹{totalSpent}
                        </div>
                        {c.avg_order_value > 0 && (
                          <div className="text-[10px] text-zinc-400 font-mono">
                            avg: ₹{parseFloat(c.avg_order_value).toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Last Purchase Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                          <HiOutlineCalendar className="text-cyan-400" size={14} />
                          <span>{lastPurchase}</span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4">
                        <div className="text-zinc-300">
                          {c.city || 'Store Counter'}
                        </div>
                        {c.state && c.state !== c.city && (
                          <div className="text-[10px] text-zinc-500">{c.state}</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
