import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryAPI, suppliersAPI, restockRequestsAPI } from '../api/client';
import { Card, StatCard } from '../components/UI';
import {
  HiOutlineDocumentCheck,
  HiOutlineCurrencyRupee,
  HiOutlineTruck,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineArrowTrendingUp,
  HiOutlineBuildingOffice2,
  HiOutlineCube,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineDocumentText,
  HiOutlineClipboardDocumentCheck,
  HiOutlineReceiptPercent,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function PurchaseOrderItemsDashboardPage() {
  const [activeTab, setActiveTab] = useState('incoming_requests'); // 'incoming_requests' | 'orders_pipeline' | 'catalog'
  const [restockRequests, setRestockRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals State
  const [selectedRequestForOrder, setSelectedRequestForOrder] = useState(null);
  const [orderSupplierId, setOrderSupplierId] = useState('');
  const [orderPoNumber, setOrderPoNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Return Back / Restock Modal
  const [selectedRequestForRestock, setSelectedRequestForRestock] = useState(null);
  const [returnBackStatement, setReturnBackStatement] = useState('');
  const [isSubmittingRestock, setIsSubmittingRestock] = useState(false);

  // Direct PO Creation Modal
  const [showCreatePoModal, setShowCreatePoModal] = useState(false);
  const [directPoForm, setDirectPoForm] = useState({
    productId: '',
    supplierId: '',
    quantity: 20,
    priority: 'normal',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, prodRes, supRes] = await Promise.all([
        restockRequestsAPI.list().catch(() => ({ data: [] })),
        inventoryAPI.list(false).catch(() => ({ data: [] })),
        suppliersAPI.list().catch(() => ({ data: [] })),
      ]);
      setRestockRequests(requestsRes.data || []);
      setProducts(prodRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (error) {
      console.error('Failed to load purchase portal data:', error);
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Accept Request & Dispatch Order to Manufacturer
  const handleOpenOrderModal = (req) => {
    setSelectedRequestForOrder(req);
    setOrderSupplierId(req.supplier_id ? String(req.supplier_id) : (suppliers[0]?.id ? String(suppliers[0].id) : ''));
    setOrderPoNumber(req.po_number || `PO-2026-RESTOCK-${String(req.id).padStart(4, '0')}`);
    setOrderNotes(req.notes ? `Approved by PO Manager. ${req.notes}` : 'Approved by PO Manager for manufacturing replenishment.');
  };

  const handleDispatchOrderToManufacturer = async (e) => {
    e.preventDefault();
    if (!selectedRequestForOrder) return;

    try {
      setIsSubmittingOrder(true);
      await restockRequestsAPI.updateStatus(selectedRequestForOrder.id, {
        status: 'ordered_to_manufacturer',
        po_number: orderPoNumber.trim(),
        notes: orderNotes.trim(),
      });
      toast.success(`Request accepted! Dispatched PO ${orderPoNumber} to Manufacturer.`);
      setSelectedRequestForOrder(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to dispatch order:', error);
      toast.error('Failed to dispatch order to manufacturer');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // 2. Inspect Shipped Goods, Issue Return Back Statement & Restock into Inventory
  const handleOpenRestockModal = (req) => {
    setSelectedRequestForRestock(req);
    const supName = req.supplier_name || 'Assigned Manufacturer';
    setReturnBackStatement(
      `Goods Receipt Note & Stock Transfer Voucher: Received ${req.requested_quantity} units of ${req.product_name} (${req.sku}) from ${supName}. Quality inspection verified 100% compliant. Handed over and credited directly to warehouse inventory stock.`
    );
  };

  const handleConfirmRestockIntoInventory = async (e) => {
    e.preventDefault();
    if (!selectedRequestForRestock) return;

    try {
      setIsSubmittingRestock(true);
      await restockRequestsAPI.updateStatus(selectedRequestForRestock.id, {
        status: 'received_and_restocked',
        return_back_statement: returnBackStatement.trim(),
      });
      toast.success(`Items verified & restocked! Product stock successfully credited to Inventory.`);
      setSelectedRequestForRestock(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to restock into inventory:', error);
      toast.error('Failed to restock product');
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  // 3. Create Direct PO
  const handleCreateDirectPo = async (e) => {
    e.preventDefault();
    const prod = products.find((p) => String(p.id) === String(directPoForm.productId));
    if (!prod) {
      toast.error('Please select a valid product from the master catalog');
      return;
    }

    try {
      await restockRequestsAPI.create({
        product_id: prod.id,
        product_name: prod.name,
        sku: prod.sku,
        requested_quantity: parseInt(directPoForm.quantity, 10),
        supplier_id: directPoForm.supplierId ? parseInt(directPoForm.supplierId, 10) : prod.supplier_id,
        priority: directPoForm.priority,
        notes: directPoForm.notes.trim() || 'Direct Purchase Order issued by Purchase Order Manager.',
        request_type: 'restock',
      });
      toast.success(`Direct PO request generated for ${prod.sku}!`);
      setShowCreatePoModal(false);
      setDirectPoForm({ productId: '', supplierId: '', quantity: 20, priority: 'normal', notes: '' });
      await fetchData();
    } catch (error) {
      console.error('Failed to create direct PO:', error);
      toast.error('Failed to create direct PO');
    }
  };

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return restockRequests.filter((r) => {
      const matchesSearch =
        !searchTerm.trim() ||
        (r.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.supplier_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.po_number || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'pending_purchase_approval' &&
          ['pending_purchase_approval', 'pending'].includes(r.status)) ||
        (statusFilter === 'ordered_to_manufacturer' &&
          ['ordered_to_manufacturer', 'accepted_by_manufacturer', 'in_production'].includes(r.status)) ||
        (statusFilter === 'shipped_to_purchase' &&
          ['shipped_to_purchase', 'ready_to_restock', 'shipped'].includes(r.status)) ||
        (statusFilter === 'received_and_restocked' &&
          ['received_and_restocked', 'restocked', 'completed'].includes(r.status)) ||
        r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [restockRequests, searchTerm, statusFilter]);

  // Incoming pending requests from Inventory Manager
  const pendingRequests = useMemo(
    () => restockRequests.filter((r) => r.status === 'pending_purchase_approval'),
    [restockRequests]
  );

  // In production or dispatched
  const activeProductionCount = useMemo(
    () => restockRequests.filter((r) => ['ordered_to_manufacturer', 'accepted_by_manufacturer'].includes(r.status)).length,
    [restockRequests]
  );

  // Shipped back from manufacturer awaiting inventory handover
  const readyToRestockCount = useMemo(
    () => restockRequests.filter((r) => r.status === 'shipped_to_purchase').length,
    [restockRequests]
  );

  const completedRestockCount = useMemo(
    () => restockRequests.filter((r) => r.status === 'received_and_restocked').length,
    [restockRequests]
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_purchase_approval':
        return {
          label: 'Awaiting PO Approval',
          color: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'ordered_to_manufacturer':
        return {
          label: 'Ordered to Manufacturer',
          color: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
          dot: 'bg-blue-400',
        };
      case 'accepted_by_manufacturer':
        return {
          label: 'Accepted / In Production',
          color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
          dot: 'bg-indigo-400',
        };
      case 'shipped_to_purchase':
        return {
          label: 'Shipped from Manufacturer',
          color: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
          dot: 'bg-purple-400 animate-pulse',
        };
      case 'received_and_restocked':
        return {
          label: 'Restocked in Inventory',
          color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-400',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          color: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-400',
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <HiOutlineDocumentCheck size={16} />
            <span>Procurement &amp; Purchase Order Manager</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Purchase Orders &amp; <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Fulfillment</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Review incoming requests from Inventory Manager, issue orders to Manufacturers, and execute goods return back statements to restock inventory.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Link
            to="/billing"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/25 transition active:scale-95 cursor-pointer"
          >
            <HiOutlineReceiptPercent size={16} />
            <span>POS Billing</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowCreatePoModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition active:scale-95 cursor-pointer"
          >
            <HiOutlinePlus size={16} />
            <span>Issue Direct PO</span>
          </button>
          <button
            type="button"
            onClick={fetchData}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 text-xs font-medium transition cursor-pointer"
          >
            <HiOutlineArrowPath className="w-4 h-4 text-indigo-400" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Pending Inventory Requests"
          value={pendingRequests.length}
          icon={<HiOutlineClock size={22} className={pendingRequests.length > 0 ? 'text-amber-400 animate-pulse' : 'text-zinc-400'} />}
        />
        <StatCard
          label="Orders with Manufacturers"
          value={activeProductionCount}
          icon={<HiOutlineTruck size={22} className="text-blue-400" />}
        />
        <StatCard
          label="Ready to Return Back &amp; Restock"
          value={readyToRestockCount}
          icon={<HiOutlineClipboardDocumentCheck size={22} className={readyToRestockCount > 0 ? 'text-purple-400 animate-pulse' : 'text-zinc-400'} />}
        />
        <StatCard
          label="Restocked &amp; Completed"
          value={completedRestockCount}
          icon={<HiOutlineCheckCircle size={22} className="text-emerald-400" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('incoming_requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'incoming_requests'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <HiOutlineClock size={18} />
          <span>Incoming Requests from Inventory</span>
          {pendingRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-400 text-zinc-950 font-bold">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders_pipeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'orders_pipeline'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <HiOutlineTruck size={18} />
          <span>All PO Procurement Pipeline</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-black/20 text-current font-bold">
            {restockRequests.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <HiOutlineCube size={18} />
          <span>Master Unified Catalog ({products.length})</span>
        </button>
      </div>

      {/* TAB 1: INCOMING REQUESTS FROM INVENTORY */}
      {activeTab === 'incoming_requests' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-transparent border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-amber-400 text-lg">⏳</span>
                <span>Restock &amp; New Product Approval Queue</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Requests submitted by Inventory Manager. Review details and click "Accept &amp; Order to Manufacturer" to issue an official purchase order.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {pendingRequests.length} Pending Actions
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 animate-spin mx-auto mb-2" />
              <span className="text-zinc-400 text-xs">Loading requests...</span>
            </div>
          ) : pendingRequests.length === 0 ? (
            <Card className="p-12 text-center">
              <HiOutlineCheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-white font-bold text-base">All Caught Up!</h4>
              <p className="text-xs text-zinc-400 mt-1">
                No pending requests from the Inventory Manager at this time.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingRequests.map((req) => (
                <Card key={req.id} className="p-5 border-amber-500/30 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                        #{req.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">{req.product_name}</h4>
                          <span className="font-mono text-xs text-zinc-400">({req.sku})</span>
                          {req.request_type === 'new_product' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                              New Product Approval
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            req.priority === 'urgent'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            {req.priority}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-4">
                          <span>Target Vendor: <strong className="text-white">{req.supplier_name || 'Unassigned'}</strong></span>
                          <span>Requested Quantity: <strong className="text-orange-400 font-mono">+{req.requested_quantity} units</strong></span>
                          <span>Current Warehouse Stock: <strong className="text-zinc-200 font-mono">{req.current_stock} units</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {req.request_type === 'new_product' ? (
                        <>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await restockRequestsAPI.updateStatus(req.id, {
                                  status: 'ordered_to_manufacturer',
                                  po_number: req.po_number || `PO-2026-SKU-${String(req.id).padStart(4, '0')}`,
                                  notes: 'Approved & accepted into active inventory catalog by Purchase Order Manager.',
                                });
                                toast.success(`Accepted ${req.product_name}! Product is now visible in 'The Products We Have' in Inventory.`);
                                await fetchData();
                              } catch (err) {
                                toast.error('Failed to accept request');
                              }
                            }}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
                          >
                            <HiOutlineCheckCircle size={16} />
                            <span>Accept &amp; Add to Inventory</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenOrderModal(req)}
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
                          >
                            <HiOutlineTruck size={16} />
                            <span>Accept &amp; Order to Manufacturer</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenOrderModal(req)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
                        >
                          <HiOutlineCheckCircle size={16} />
                          <span>Accept &amp; Order to Manufacturer</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {req.notes && (
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-zinc-300">
                      <span className="font-semibold text-zinc-400 text-[10px] uppercase block mb-0.5">
                        Inventory Manager Notes:
                      </span>
                      {req.notes}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL PO PROCUREMENT PIPELINE */}
      {activeTab === 'orders_pipeline' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                <HiOutlineMagnifyingGlass className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search by product, SKU, PO #, or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-9 text-sm bg-zinc-900/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
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

            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'All Orders', count: restockRequests.length },
                { id: 'pending_purchase_approval', label: 'Awaiting PO', count: pendingRequests.length },
                { id: 'ordered_to_manufacturer', label: 'With Manufacturer', count: activeProductionCount },
                { id: 'shipped_to_purchase', label: 'Ready to Restock', count: readyToRestockCount },
                { id: 'received_and_restocked', label: 'Restocked', count: completedRestockCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      statusFilter === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Requests Pipeline Table */}
          <Card className="overflow-hidden border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">PO / Req #</th>
                    <th className="py-3.5 px-4">Product &amp; SKU</th>
                    <th className="py-3.5 px-4">Target Manufacturer</th>
                    <th className="py-3.5 px-4">Restock Qty</th>
                    <th className="py-3.5 px-4">Current Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400 text-xs">
                        No purchase orders matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => {
                      const badge = getStatusBadge(req.status);
                      return (
                        <tr key={req.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3.5 px-4 font-mono text-xs font-semibold text-indigo-300">
                            {req.po_number || `#REQ-${req.id}`}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-white">{req.product_name}</div>
                            <div className="font-mono text-xs text-zinc-400">{req.sku}</div>
                          </td>

                          <td className="py-3.5 px-4 text-zinc-300">
                            {req.supplier_name || 'Unassigned'}
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-orange-400">
                            +{req.requested_quantity} units
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              <span>{badge.label}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {req.status === 'pending_purchase_approval' && (
                              <button
                                type="button"
                                onClick={() => handleOpenOrderModal(req)}
                                className="px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 text-xs font-semibold transition cursor-pointer"
                              >
                                Accept &amp; Order
                              </button>
                            )}

                            {req.status === 'shipped_to_purchase' && (
                              <button
                                type="button"
                                onClick={() => handleOpenRestockModal(req)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-semibold transition cursor-pointer animate-pulse"
                                title="Inspect and Handover to Inventory"
                              >
                                Restock into Inventory
                              </button>
                            )}

                            {req.status === 'received_and_restocked' && (
                              <span className="text-xs text-emerald-400 font-semibold inline-flex items-center gap-1">
                                <HiOutlineCheckCircle size={14} />
                                <span>Restocked</span>
                              </span>
                            )}

                            {['ordered_to_manufacturer', 'accepted_by_manufacturer'].includes(req.status) && (
                              <span className="text-xs text-zinc-400 italic">
                                With Manufacturer...
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: MASTER UNIFIED CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between text-xs">
            <span className="text-zinc-300">
              This master product catalog is unified in real-time across Inventory, Purchase Orders, Manufacturers, and Sales.
            </span>
            <span className="font-mono text-zinc-400 font-semibold">{products.length} Products Loaded</span>
          </div>

          <Card className="overflow-hidden border-white/10">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-zinc-950 border-b border-white/10">
                  <tr className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Assigned Vendor</th>
                    <th className="py-3 px-4">Unit Price</th>
                    <th className="py-3 px-4">Stock on Hand</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.slice(0, 50).map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 font-medium text-white">{p.name}</td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-400">{p.sku}</td>
                      <td className="py-3 px-4 text-xs text-zinc-300">{p.supplier_name || 'Unassigned'}</td>
                      <td className="py-3 px-4 font-mono text-amber-300">₹{parseFloat(p.price || 0).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.stock < 10 ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'
                        }`}>
                          {p.stock} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setDirectPoForm({
                              productId: String(p.id),
                              supplierId: p.supplier_id ? String(p.supplier_id) : '',
                              quantity: 20,
                              priority: 'normal',
                              notes: 'Direct PO replenishment.',
                            });
                            setShowCreatePoModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs hover:bg-indigo-600/30 transition cursor-pointer"
                        >
                          Order Restock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 1: ACCEPT & DISPATCH ORDER TO MANUFACTURER */}
      <AnimatePresence>
        {selectedRequestForOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-950 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <HiOutlineDocumentCheck className="text-indigo-400 w-5 h-5" />
                  <span>Accept &amp; Dispatch PO to Manufacturer</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRequestForOrder(null)}
                  className="text-zinc-400 hover:text-white p-1 cursor-pointer"
                >
                  <HiOutlineXMark size={20} />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1">
                <div className="font-semibold text-white">{selectedRequestForOrder.product_name}</div>
                <div className="text-zinc-300 flex items-center gap-4">
                  <span>SKU: <strong className="font-mono text-zinc-100">{selectedRequestForOrder.sku}</strong></span>
                  <span>Quantity: <strong className="font-mono text-orange-400">+{selectedRequestForOrder.requested_quantity} units</strong></span>
                </div>
              </div>

              <form onSubmit={handleDispatchOrderToManufacturer} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Generated Purchase Order #</label>
                  <input
                    type="text"
                    value={orderPoNumber}
                    onChange={(e) => setOrderPoNumber(e.target.value)}
                    required
                    className="w-full h-10 px-3 text-sm font-mono bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Target Manufacturer Partner</label>
                  <select
                    value={orderSupplierId}
                    onChange={(e) => setOrderSupplierId(e.target.value)}
                    required
                    className="w-full h-10 px-3 text-sm bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.contact_info ? `(${s.contact_info})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Production &amp; Dispatch Instructions</label>
                  <textarea
                    rows={3}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full p-3 text-xs bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRequestForOrder(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    Confirm &amp; Order to Manufacturer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ISSUE RETURN BACK STATEMENT & RESTOCK INTO INVENTORY */}
      <AnimatePresence>
        {selectedRequestForRestock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-950 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <HiOutlineClipboardDocumentCheck className="text-emerald-400 w-5 h-5" />
                  <span>Return Back Statement &amp; Warehouse Restock</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRequestForRestock(null)}
                  className="text-zinc-400 hover:text-white p-1 cursor-pointer"
                >
                  <HiOutlineXMark size={20} />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                <div className="font-semibold text-white">
                  Incoming Shipment from Manufacturer: {selectedRequestForRestock.supplier_name || 'Manufacturer'}
                </div>
                <div className="text-zinc-300 flex items-center gap-4">
                  <span>Product: <strong className="text-white">{selectedRequestForRestock.product_name}</strong></span>
                  <span>Units to Credit: <strong className="font-mono text-emerald-400">+{selectedRequestForRestock.requested_quantity}</strong></span>
                </div>
              </div>

              <form onSubmit={handleConfirmRestockIntoInventory} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Official Return Back &amp; Receiving Statement <span className="text-emerald-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={returnBackStatement}
                    onChange={(e) => setReturnBackStatement(e.target.value)}
                    required
                    placeholder="Enter formal receipt and transfer confirmation voucher statement..."
                    className="w-full p-3 text-xs font-mono bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-zinc-400">
                    Once submitted, the system will immediately increment the active product inventory stock in the central database.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRequestForRestock(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRestock}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    Issue Statement &amp; Credit Inventory
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: DIRECT PURCHASE ORDER CREATION */}
      <AnimatePresence>
        {showCreatePoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-950 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <HiOutlineDocumentCheck className="text-indigo-400 w-5 h-5" />
                  <span>Issue Direct Purchase Order</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreatePoModal(false)}
                  className="text-zinc-400 hover:text-white p-1 cursor-pointer"
                >
                  <HiOutlineXMark size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateDirectPo} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Select Master Product SKU *</label>
                  <select
                    value={directPoForm.productId}
                    onChange={(e) => {
                      const prod = products.find((p) => String(p.id) === e.target.value);
                      setDirectPoForm((prev) => ({
                        ...prev,
                        productId: e.target.value,
                        supplierId: prod?.supplier_id ? String(prod.supplier_id) : prev.supplierId,
                      }));
                    }}
                    required
                    className="w-full h-10 px-3 text-sm bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Choose Catalog Product *</option>
                    {products.slice(0, 100).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — Stock: {p.stock}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Target Manufacturer Partner *</label>
                  <select
                    value={directPoForm.supplierId}
                    onChange={(e) => setDirectPoForm((prev) => ({ ...prev, supplierId: e.target.value }))}
                    required
                    className="w-full h-10 px-3 text-sm bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Choose Manufacturer *</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Quantity to Procure *</label>
                    <input
                      type="number"
                      min="1"
                      value={directPoForm.quantity}
                      onChange={(e) => setDirectPoForm((prev) => ({ ...prev, quantity: e.target.value }))}
                      required
                      className="w-full h-10 px-3 text-sm font-mono bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-300">Priority</label>
                    <select
                      value={directPoForm.priority}
                      onChange={(e) => setDirectPoForm((prev) => ({ ...prev, priority: e.target.value }))}
                      className="w-full h-10 px-3 text-sm bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">Procurement Notes</label>
                  <textarea
                    rows={2}
                    value={directPoForm.notes}
                    onChange={(e) => setDirectPoForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-2.5 text-xs bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreatePoModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer"
                  >
                    Create &amp; Dispatch Order
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
