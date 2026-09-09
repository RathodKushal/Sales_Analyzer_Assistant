import { useState, useEffect } from 'react';
import { ordersAPI, customersAPI, returnsAPI } from '../api/client';
import { Card, StatCard } from '../components/UI';
import { HiOutlineCurrencyRupee, HiOutlineShoppingCart, HiOutlineUsers, HiOutlineArrowUturnLeft } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    orders: null,
    customers: null,
    returns: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [ordersRes, customersRes, returnsRes] = await Promise.all([
          ordersAPI.getStats(),
          customersAPI.getSegments(),
          returnsAPI.getStats(),
        ]);
        
        setStats({
          orders: ordersRes.data,
          customers: customersRes.data,
          returns: returnsRes.data,
        });
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
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Overview</h1>
        <p className="text-zinc-400">Your ShopFlow business performance at a glance.</p>
      </header>

      {/* Main KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard 
          label="Total Revenue" 
          value={`₹${(stats.orders?.total_revenue || 0).toLocaleString()}`} 
          trend={12.5} 
          icon={<HiOutlineCurrencyRupee size={22} />} 
        />
        <StatCard 
          label="Total Orders" 
          value={(stats.orders?.total_orders || 0).toLocaleString()} 
          icon={<HiOutlineShoppingCart size={22} />} 
        />
        <StatCard 
          label="Avg Order Value" 
          value={`₹${(stats.orders?.average_order_value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`} 
          icon={<HiOutlineCurrencyRupee size={22} />} 
        />
        <StatCard 
          label="Return Rate" 
          value={`${(stats.returns?.return_rate_percentage || 0).toFixed(1)}%`} 
          trend={-2.1} 
          icon={<HiOutlineArrowUturnLeft size={22} />} 
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Segments */}
        <section className="lg:col-span-2">
          <Card className="p-6 h-full">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-100 mb-6">Customer Segments</h2>
            {stats.customers?.segments ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(stats.customers.segments).map(([segment, count]) => (
                  <div key={segment} className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800">
                    <div className="text-2xl font-semibold text-zinc-200 mb-1">{count}</div>
                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{segment}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-500 text-sm">No segment data available.</div>
            )}
          </Card>
        </section>

        {/* Quick Actions / Activity */}
        <section className="lg:col-span-1">
          <Card className="p-6 h-full flex flex-col">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-100 mb-6">Recent Insights</h2>
            <div className="space-y-4 flex-1">
              <div className="p-3 rounded bg-zinc-900 border border-zinc-800 text-sm">
                <span className="text-emerald-400 font-medium mr-2">↑ LTV Growth</span>
                High-value customers are ordering 15% more frequently this month.
              </div>
              <div className="p-3 rounded bg-zinc-900 border border-zinc-800 text-sm">
                <span className="text-rose-400 font-medium mr-2">! High Returns</span>
                Electronics category is seeing a spike in return rate.
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
