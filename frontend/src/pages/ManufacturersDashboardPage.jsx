import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryAPI, suppliersAPI, restockRequestsAPI } from '../api/client';
import { Card, StatCard } from '../components/UI';
import {
  HiOutlineCube,
  HiOutlineArrowPath,
  HiOutlineTruck,
  HiOutlineMagnifyingGlass,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineBuildingStorefront,
  HiOutlineCurrencyRupee,
  HiOutlineWrenchScrewdriver,
  HiOutlineClipboardDocumentCheck,
  HiOutlineXMark,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function ManufacturersDashboardPage() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'vmi'
  const [restockRequests, setRestockRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, prodRes, supRes] = await Promise.all([
        restockRequestsAPI.list().catch(() => ({ data: [] })),
        inventoryAPI.list(false).catch(() => ({ data: [] })),
        suppliersAPI.list().catch(() => ({ data: [] })),
      ]);
      setRestockRequests(reqRes.data || []);
      setProducts(prodRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (error) {
      console.error('Failed to load manufacturer dashboard:', error);
      toast.error('Failed to load manufacturer portal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Manufacturer accepts PO order
  const handleAcceptOrder = async (id, poNumber) => {
    try {
      await restockRequestsAPI.updateStatus(id, {
        status: 'accepted_by_manufacturer',
        notes: 'Order accepted by Manufacturer production facility. Batch scheduled for assembly.',
      });
      toast.success(`Production order ${poNumber || `#${id}`} accepted! Started manufacturing.`);
      await fetchData();
    } catch (error) {
      console.error('Failed to accept order:', error);
      toast.error('Failed to accept order');
    }
  };

  // 2. Manufacturer marks as shipped back to Purchase Order Manager
  const handleShipToPurchase = async (id, poNumber, qty) => {
    try {
      await restockRequestsAPI.updateStatus(id, {
        status: 'shipped_to_purchase',
        notes: `Production completed for ${qty} units. Shipment dispatched and returned to Purchase Order Department for inspection & restocking.`,
      });
      toast.success(`Batch shipped! Dispatched ${qty} units back to Purchase Order Manager.`);
      await fetchData();
    } catch (error) {
      console.error('Failed to ship order:', error);
      toast.error('Failed to dispatch shipment');
    }
  };

  // Filtered requests for Manufacturer
  const manufacturerOrders = useMemo(() => {
    return restockRequests.filter((r) => {
      // Show orders in production or active workflow
      const matchesSupplier =
        selectedSupplierFilter === 'all' ||
        String(r.supplier_id) === String(selectedSupplierFilter);

      const matchesSearch =
        !searchTerm.trim() ||
        (r.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.po_number || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSupplier && matchesSearch;
    });
  }, [restockRequests, selectedSupplierFilter, searchTerm]);

  // Orders awaiting manufacturer acceptance
  const awaitingAcceptance = useMemo(
    () => manufacturerOrders.filter((r) => r.status === 'ordered_to_manufacturer'),
    [manufacturerOrders]
  );

  // In production
  const inProduction = useMemo(
    () => manufacturerOrders.filter((r) => r.status === 'accepted_by_manufacturer'),
    [manufacturerOrders]
  );

  // Shipped
  const shippedCount = useMemo(
    () => manufacturerOrders.filter((r) => ['shipped_to_purchase', 'received_and_restocked'].includes(r.status)),
    [manufacturerOrders]
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ordered_to_manufacturer':
        return {
          label: 'Incoming PO Order',
          color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'accepted_by_manufacturer':
        return {
          label: 'In Production / Assembly',
          color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
          dot: 'bg-indigo-400',
        };
      case 'shipped_to_purchase':
        return {
          label: 'Shipped to PO Dept',
          color: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          dot: 'bg-purple-400',
        };
      case 'received_and_restocked':
        return {
          label: 'Delivered & Restocked',
          color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      default:
        return {
          label: status,
          color: 'bg-zinc-800 text-zinc-300 border-zinc-700',
          dot: 'bg-zinc-400',
        };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 max-w-7xl mx-auto pb-12"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <HiOutlineBuildingStorefront size={16} />
            <span>OEM &amp; Vendor Production Hub</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Manufacturer <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Portal</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Accept replenishment orders from Purchase Order Manager, produce inventory items, and ship finished batches back for warehouse restocking.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 text-xs font-medium transition self-start md:self-auto cursor-pointer"
        >
          <HiOutlineArrowPath className="w-4 h-4 text-emerald-400" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="New PO Orders Awaiting Acceptance"
          value={awaitingAcceptance.length}
          icon={<HiOutlineClock size={22} className={awaitingAcceptance.length > 0 ? 'text-amber-400 animate-pulse' : 'text-zinc-400'} />}
        />
        <StatCard
          label="Batches In Production"
          value={inProduction.length}
          icon={<HiOutlineWrenchScrewdriver size={22} className="text-indigo-400" />}
        />
        <StatCard
          label="Total Dispatched &amp; Completed"
          value={shippedCount.length}
          icon={<HiOutlineCheckCircle size={22} className="text-emerald-400" />}
        />
        <StatCard
          label="Unified Catalog SKUs"
          value={products.length.toLocaleString()}
          icon={<HiOutlineCube size={22} className="text-cyan-400" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <HiOutlineTruck size={18} />
          <span>Production &amp; Replenishment Orders</span>
          {awaitingAcceptance.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-400 text-zinc-950 font-bold animate-pulse">
              {awaitingAcceptance.length} New
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vmi')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'vmi'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <HiOutlineCube size={18} />
          <span>Live Vendor-Managed Inventory (VMI)</span>
        </button>
      </div>

      {/* TAB 1: PRODUCTION & REPLENISHMENT ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                <HiOutlineMagnifyingGlass className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search orders by product, SKU, PO #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-9 text-sm bg-zinc-900/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 cursor-pointer"
                >
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              value={selectedSupplierFilter}
              onChange={(e) => setSelectedSupplierFilter(e.target.value)}
              className="h-10 px-3 text-xs bg-zinc-900/90 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Manufacturer Partners</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin mx-auto mb-2" />
              <span className="text-zinc-400 text-xs">Loading production orders...</span>
            </div>
          ) : manufacturerOrders.length === 0 ? (
            <Card className="p-12 text-center">
              <HiOutlineTruck className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
              <h4 className="text-white font-bold text-base">No Production Orders Found</h4>
              <p className="text-xs text-zinc-400 mt-1">
                When the Purchase Order Manager accepts an inventory restock request, it will appear here for manufacturing fulfillment.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {manufacturerOrders.map((order) => {
                const badge = getStatusBadge(order.status);
                return (
                  <Card key={order.id} className="p-5 border-white/10 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                          {order.po_number ? order.po_number.slice(-3) : `#${order.id}`}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white">{order.product_name}</h4>
                            <span className="font-mono text-xs text-zinc-400">({order.sku})</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                              {order.po_number || `#REQ-${order.id}`}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-4">
                            <span>Assigned Facility: <strong className="text-white">{order.supplier_name || 'Manufacturer'}</strong></span>
                            <span>Quantity to Produce: <strong className="text-emerald-400 font-mono font-bold">+{order.requested_quantity} units</strong></span>
                            <span>Priority: <strong className="uppercase text-amber-300">{order.priority}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 self-start md:self-auto">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{badge.label}</span>
                        </span>

                        {order.status === 'ordered_to_manufacturer' && (
                          <button
                            type="button"
                            onClick={() => handleAcceptOrder(order.id, order.po_number)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
                          >
                            <HiOutlineCheckCircle size={15} />
                            <span>Accept Production Order</span>
                          </button>
                        )}

                        {order.status === 'accepted_by_manufacturer' && (
                          <button
                            type="button"
                            onClick={() => handleShipToPurchase(order.id, order.po_number, order.requested_quantity)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-purple-600/20 transition active:scale-95 cursor-pointer"
                          >
                            <HiOutlineTruck size={15} />
                            <span>Ship &amp; Return to PO Manager</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-300 flex items-start gap-2">
                        <span className="text-emerald-400 font-semibold uppercase text-[10px]">Workflow Note:</span>
                        <span>{order.notes}</span>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE VMI MONITOR */}
      {activeTab === 'vmi' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between text-xs">
            <span className="text-zinc-300">
              Live Vendor-Managed Inventory: Monitors actual warehouse stock for all master catalog items in real-time.
            </span>
            <span className="font-mono text-zinc-400 font-semibold">{products.length} Products Tracked</span>
          </div>

          <Card className="overflow-hidden border-white/10">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-zinc-950 border-b border-white/10">
                  <tr className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Manufacturer</th>
                    <th className="py-3 px-4">Unit Cost</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Health Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.slice(0, 50).map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-medium text-white">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-400">{p.sku}</td>
                      <td className="py-3 px-4 text-xs text-zinc-300">{p.supplier_name || 'Unassigned'}</td>
                      <td className="py-3 px-4 font-mono text-amber-300">₹{parseFloat(p.price || 0).toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-white">{p.stock} units</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          p.stock < 10
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {p.stock < 10 ? 'Low Stock — Replenish Needed' : 'Stock Healthy'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </motion.div>
  );
}
