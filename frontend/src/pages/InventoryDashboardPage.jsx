import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryAPI, suppliersAPI, restockRequestsAPI } from '../api/client';
import { Card, StatCard } from '../components/UI';
import {
  HiOutlineCube,
  HiOutlineArchiveBox,
  HiOutlineExclamationTriangle,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineArrowPath,
  HiOutlineBuildingOffice2,
  HiOutlineCurrencyRupee,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
  HiOutlineSparkles,
  HiOutlineTruck,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineArrowTrendingUp,
  HiOutlineDocumentCheck,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function InventoryDashboardPage() {
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'restock_requests'
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [restockRequests, setRestockRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Form State
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [requestPoApproval, setRequestPoApproval] = useState(true);

  // Quick inline new vendor creation
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorContact, setNewVendorContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restock Request Modal State
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [restockQty, setRestockQty] = useState(20);
  const [restockSupplierId, setRestockSupplierId] = useState('');
  const [restockPriority, setRestockPriority] = useState('normal');
  const [restockNotes, setRestockNotes] = useState('');
  const [isSubmittingRestock, setIsSubmittingRestock] = useState(false);

  const fetchProducts = async (includeArchived = showArchived) => {
    try {
      setLoading(true);
      const res = await inventoryAPI.list(includeArchived);
      setProducts(res.data || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      toast.error('Failed to load inventory records');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await suppliersAPI.list();
      setSuppliers(res.data || []);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const fetchRestockRequests = async () => {
    try {
      setRequestsLoading(true);
      const res = await restockRequestsAPI.list();
      setRestockRequests(res.data || []);
    } catch (error) {
      console.error('Failed to fetch restock requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    fetchRestockRequests();
  }, []);

  const handleCancel = () => {
    setEditId(null);
    setName('');
    setSku('');
    setPrice('');
    setStock('');
    setSupplierId('');
    setNewVendorName('');
    setNewVendorContact('');
    setRequestPoApproval(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      toast.error('Please select or specify a purchasing vendor.');
      return;
    }

    try {
      setIsSubmitting(true);
      let finalSupplierId = null;

      if (supplierId === '__NEW__') {
        if (!newVendorName.trim()) {
          toast.error('Please enter a name for the new purchasing vendor.');
          setIsSubmitting(false);
          return;
        }
        const supRes = await suppliersAPI.create({
          name: newVendorName.trim(),
          contact_info: newVendorContact.trim(),
        });
        finalSupplierId = supRes.data.id;
        toast.success(`Registered new vendor: ${newVendorName.trim()}`);
        await fetchSuppliers();
      } else {
        finalSupplierId = parseInt(supplierId, 10);
      }

      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        supplier_id: finalSupplierId,
        request_approval: !editId && requestPoApproval,
      };

      if (editId) {
        await inventoryAPI.update(editId, payload);
        toast.success(`Updated SKU: ${sku}`);
      } else {
        await inventoryAPI.create(payload);
        toast.success(`Registered new item & placed into Approval Queue! It will appear in 'The Products We Have' once accepted by the Purchase Order Manager.`);
        setActiveTab('restock_requests');
      }

      handleCancel();
      await fetchProducts(showArchived);
      await fetchRestockRequests();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.detail || error.response?.data?.error || 'Failed to save inventory item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setName(p.name || '');
    setSku(p.sku || '');
    setPrice(p.price !== undefined ? String(p.price) : '');
    setStock(p.stock !== undefined ? String(p.stock) : '');
    setSupplierId(p.supplier_id ? String(p.supplier_id) : '');
    setNewVendorName('');
    setNewVendorContact('');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleDelete = async (id, skuCode) => {
    const confirmed = window.confirm(
      'Remove this product from active inventory? All past customer purchases and historical ledger records will be 100% preserved.'
    );
    if (!confirmed) return;

    try {
      await inventoryAPI.delete(id);
      toast.success(`Archived SKU: ${skuCode || id}`);
      fetchProducts(showArchived);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to archive inventory item');
    }
  };

  const handleRestore = async (id, skuCode) => {
    try {
      await inventoryAPI.restore(id);
      toast.success(`Restored SKU: ${skuCode || id} to active catalog`);
      fetchProducts(showArchived);
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore item');
    }
  };

  // Restock Request Modal Handlers
  const handleOpenRestockModal = (product) => {
    setSelectedProduct(product);
    setRestockQty(20);
    setRestockSupplierId(product.supplier_id ? String(product.supplier_id) : '');
    setRestockPriority(product.stock < 10 ? 'urgent' : 'normal');
    setRestockNotes(
      product.stock < 10
        ? `Low stock alert: Only ${product.stock} units left in inventory. High priority restock required.`
        : 'Routine inventory replenishment.'
    );
    setRestockModalOpen(true);
  };

  const handleSubmitRestockRequest = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setIsSubmittingRestock(true);
      const payload = {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        sku: selectedProduct.sku,
        requested_quantity: parseInt(restockQty, 10),
        supplier_id: restockSupplierId ? parseInt(restockSupplierId, 10) : selectedProduct.supplier_id,
        priority: restockPriority,
        notes: restockNotes.trim(),
        request_type: 'restock',
      };

      await restockRequestsAPI.create(payload);
      toast.success(`Restock request sent to Purchase Order Manager for ${selectedProduct.sku}!`);
      setRestockModalOpen(false);
      setSelectedProduct(null);
      await fetchRestockRequests();
      setActiveTab('restock_requests');
    } catch (error) {
      console.error('Restock request error:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit restock request');
    } finally {
      setIsSubmittingRestock(false);
    }
  };

  // Filtered & Paginated records
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const q = searchTerm.toLowerCase().trim();
    return products.filter((p) => {
      const pName = (p.name || '').toLowerCase();
      const pSku = (p.sku || '').toLowerCase();
      const pSupplier = (p.supplier_name || '').toLowerCase();
      const pPrice = String(p.price || '');
      const pStock = String(p.stock || '');
      return (
        pName.includes(q) ||
        pSku.includes(q) ||
        pSupplier.includes(q) ||
        pPrice.includes(q) ||
        pStock.includes(q)
      );
    });
  }, [products, searchTerm]);

  // Pagination computations
  const totalRecords = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const currentRecords = filteredProducts.slice(startIndex, startIndex + pageSize);
  const endIndex = Math.min(startIndex + pageSize, totalRecords);

  const getPageNumbers = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  // Summary Metrics
  const activeCount = useMemo(() => products.filter((p) => !p.is_deleted).length, [products]);
  const lowStockCount = useMemo(() => products.filter((p) => !p.is_deleted && p.stock < 10).length, [products]);
  const totalUnits = useMemo(() => products.filter((p) => !p.is_deleted).reduce((acc, p) => acc + (p.stock || 0), 0), [products]);
  const pendingRequestsCount = useMemo(
    () => restockRequests.filter((r) => r.status === 'pending_purchase_approval').length,
    [restockRequests]
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_purchase_approval':
        return {
          label: 'Pending PO Approval',
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
          label: 'Accepted by Manufacturer',
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
          label: 'Restocked into Inventory',
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
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="text-base">📦</span>
            <span>Inventory &amp; Supply Chain Management</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Inventory <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">Manager</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Real-time SKU catalog, restock requests to Purchase Order Manager, vendor tracking, and live inventory replenishment.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => {
              fetchProducts(showArchived);
              fetchSuppliers();
              fetchRestockRequests();
              toast.success('Inventory synced with database');
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 text-xs font-medium transition cursor-pointer"
          >
            <HiOutlineArrowPath className="w-4 h-4 text-orange-400" />
            <span>Sync Catalog</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active SKUs"
          value={activeCount.toLocaleString()}
          icon={<HiOutlineCube size={22} />}
        />
        <StatCard
          label="Total Units in Stock"
          value={totalUnits.toLocaleString()}
          icon={<HiOutlineArchiveBox size={22} />}
        />
        <StatCard
          label="Low Stock Alerts (< 10)"
          value={lowStockCount}
          icon={<HiOutlineExclamationTriangle size={22} className={lowStockCount > 0 ? 'text-amber-400' : 'text-zinc-400'} />}
        />
        <StatCard
          label="Restock Requests Awaiting PO"
          value={pendingRequestsCount}
          icon={<HiOutlineClock size={22} className={pendingRequestsCount > 0 ? 'text-orange-400' : 'text-zinc-400'} />}
        />
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'catalog'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <HiOutlineCube size={18} />
          <span>The Products We Have</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-black/20 text-current font-bold">
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('restock_requests');
            fetchRestockRequests();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer relative ${
            activeTab === 'restock_requests'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 shadow-md shadow-orange-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <HiOutlineClock size={18} />
          <span>Approval &amp; Restock Queue</span>
          {pendingRequestsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-400 text-zinc-950 font-bold animate-pulse">
              {pendingRequestsCount} Pending
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: THE PRODUCTS WE HAVE */}
      {activeTab === 'catalog' && (
        <div className="space-y-8">
          {/* Add / Edit Form Card */}
          <Card
            className={`p-6 transition-all duration-300 ${
              editId
                ? 'border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.2)]'
                : 'border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 text-sm">
                  {editId ? <HiOutlinePencilSquare size={16} /> : <HiOutlinePlus size={16} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {editId ? 'Modify Inventory Item' : 'Register New Inventory Item'}
                  </h3>
                  <p className="text-zinc-400 text-xs">
                    {editId
                      ? 'Update pricing, vendor allocation, and stock counts'
                      : 'Submits new product into the Approval Queue. Only admitted into "The Products We Have" once accepted by Purchase Order Manager.'}
                  </p>
                </div>
              </div>
              {editId && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Editing Item #{editId}
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Item Name */}
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Item Name <span className="text-orange-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Carbon Fiber Casing"
                    className="w-full h-10 px-3.5 text-sm bg-zinc-900/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* SKU Identifier */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    SKU Identifier <span className="text-orange-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    placeholder="e.g. SKU-9042-PRO"
                    className="w-full h-10 px-3.5 text-sm font-mono bg-zinc-900/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* Unit Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Unit Price (₹) <span className="text-orange-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full h-10 px-3.5 text-sm font-mono bg-zinc-900/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* Stock Level */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Initial Stock Level <span className="text-orange-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                    placeholder="0"
                    className="w-full h-10 px-3.5 text-sm font-mono bg-zinc-900/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              {/* Purchasing Vendor Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">
                  Purchasing Vendor / Manufacturer <span className="text-orange-400">*</span>
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                  className="w-full h-10 px-3 text-sm bg-zinc-900/90 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500 transition-colors"
                >
                  <option value="">Choose Purchasing Vendor *</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.contact_info ? `(${s.contact_info})` : ''}
                    </option>
                  ))}
                  <option value="__NEW__">+ Add New Vendor...</option>
                </select>
              </div>

              {/* Quick Inline Vendor Drawer */}
              <AnimatePresence>
                {supplierId === '__NEW__' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/25 space-y-3">
                      <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                        <HiOutlineBuildingOffice2 className="w-4 h-4" />
                        <span>Register New Vendor Partner</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-zinc-300 font-medium">Vendor Company Name *</label>
                          <input
                            type="text"
                            value={newVendorName}
                            onChange={(e) => setNewVendorName(e.target.value)}
                            placeholder="e.g. Apex Industrial Supplies"
                            required={supplierId === '__NEW__'}
                            className="w-full h-9 px-3 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-zinc-300 font-medium">Contact Email / Phone</label>
                          <input
                            type="text"
                            value={newVendorContact}
                            onChange={(e) => setNewVendorContact(e.target.value)}
                            placeholder="orders@apex.com / +91 98765 43210"
                            className="w-full h-9 px-3 text-sm bg-zinc-950/80 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* New Product Approval Protocol Notice */}
              {!editId && (
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-200">
                  <span className="text-lg leading-none mt-0.5">⏳</span>
                  <div className="flex-1">
                    <span className="font-semibold text-white block">Approval Protocol Active:</span>
                    <span className="text-zinc-300 text-[11px] block mt-0.5">
                      This product will be placed in the <strong>Approval Queue</strong>. It will <strong>only show in "The Products We Have"</strong> once the Purchase Order Manager accepts the request.
                    </span>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {editId ? <HiOutlinePencilSquare size={16} /> : <HiOutlinePlus size={16} />}
                  <span>{editId ? 'Update Record' : 'Register & Submit to Approval Queue'}</span>
                </button>
                {editId && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 text-sm font-medium transition cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </Card>

          {/* Active Products Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">The Products We Have</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Showing active, accepted products in warehouse stock ({activeCount} products). Products pending acceptance remain in the queue.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('restock_requests')}
              className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>View Approval Queue</span>
              {pendingRequestsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-zinc-950">
                  {pendingRequestsCount} Pending
                </span>
              )}
            </button>
          </div>

          {/* Controls & Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                <HiOutlineMagnifyingGlass className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search by product name, SKU, or vendor..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 pl-10 pr-9 text-sm bg-zinc-900/80 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  title="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 rounded transition cursor-pointer"
                >
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Tabs, Page Size & Counter */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Active vs Archived Toggle */}
              <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowArchived(false);
                    fetchProducts(false);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    !showArchived
                      ? 'bg-orange-500 text-zinc-950 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Active Inventory
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowArchived(true);
                    fetchProducts(true);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    showArchived
                      ? 'bg-orange-500 text-zinc-950 font-bold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All &amp; Archived
                </button>
              </div>

              {/* Page Size Toggle */}
              <div className="hidden sm:flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-white/10">
                {[10, 25, 50, 100].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setPageSize(size);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      pageSize === size
                        ? 'bg-white/15 text-white font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {/* Filter Counter Badge */}
              <div className="text-xs text-zinc-400 font-mono px-2">
                <span className="font-semibold text-white">{totalRecords.toLocaleString()}</span>{' '}
                {totalRecords === 1 ? 'item' : 'items'}
                {searchTerm && <span className="ml-1 text-orange-400">(filtered)</span>}
              </div>
            </div>
          </div>

          {/* Inventory Table Card */}
          <Card className="overflow-hidden border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Item Name</th>
                    <th className="py-3.5 px-4">SKU</th>
                    <th className="py-3.5 px-4">Purchasing Vendor</th>
                    <th className="py-3.5 px-4">Unit Price</th>
                    <th className="py-3.5 px-4">Available Units</th>
                    <th className="py-3.5 px-4 text-center">Restock Pipeline</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-8 h-8 rounded-full border-2 border-orange-500/20 border-t-orange-400 animate-spin" />
                          <span className="text-zinc-400 text-xs">Loading inventory catalog...</span>
                        </div>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="text-4xl">📦</span>
                          <span className="text-zinc-300 font-medium">No inventory records located.</span>
                          <span className="text-zinc-500 text-xs">Register your first SKU using the form above.</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <HiOutlineMagnifyingGlass className="w-8 h-8 text-zinc-500" />
                          <span className="text-zinc-300 font-medium">No products found matching "{searchTerm}"</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSearchTerm('');
                              setCurrentPage(1);
                            }}
                            className="text-xs text-orange-400 hover:underline mt-1 cursor-pointer"
                          >
                            Clear search filter
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((p) => (
                      <tr
                        key={p.id}
                        className={`transition-colors hover:bg-white/[0.02] ${
                          p.is_deleted ? 'opacity-60 bg-red-950/10' : ''
                        }`}
                      >
                        {/* Item Name */}
                        <td className="py-3.5 px-4 font-medium text-white">
                          <div className="flex items-center gap-2">
                            <span>{p.name}</span>
                            {p.is_deleted && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                                Archived
                              </span>
                            )}
                            {p.approval_status === 'pending_approval' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                Pending PO Approval
                              </span>
                            )}
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="py-3.5 px-4 font-mono text-xs text-zinc-400">
                          {p.sku}
                        </td>

                        {/* Purchasing Vendor */}
                        <td className="py-3.5 px-4">
                          {p.supplier_name ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-zinc-200">
                              <span className="text-orange-400">🏢</span>
                              <span className="font-medium">{p.supplier_name}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-500 italic">Unassigned</span>
                          )}
                        </td>

                        {/* Unit Price */}
                        <td className="py-3.5 px-4 font-mono font-medium text-amber-300">
                          ₹{parseFloat(p.price || 0).toFixed(2)}
                        </td>

                        {/* Stock Units */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              p.stock < 10
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                p.stock < 10 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                              }`}
                            />
                            <span>{p.stock} in stock</span>
                          </span>
                        </td>

                        {/* Quick Restock Request Trigger */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenRestockModal(p)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                              p.stock < 10
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 shadow-sm'
                                : 'bg-white/5 text-zinc-300 border border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                            title="Send Restock Request to Purchase Order Manager"
                          >
                            <HiOutlineTruck className="w-3.5 h-3.5 text-orange-400" />
                            <span>{p.stock < 10 ? '⚡ Request Restock' : 'Restock'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {p.is_deleted ? (
                              <button
                                type="button"
                                onClick={() => handleRestore(p.id, p.sku)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/40 text-orange-300 hover:bg-orange-500/25 text-xs font-semibold transition cursor-pointer"
                              >
                                <HiOutlineArrowPath className="w-3.5 h-3.5" />
                                <span>Restore</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEdit(p)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/15 text-zinc-200 text-xs font-medium transition cursor-pointer"
                                  title="Edit item"
                                >
                                  <HiOutlinePencilSquare className="w-3.5 h-3.5 text-zinc-400" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(p.id, p.sku)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition cursor-pointer"
                                  title="Archive SKU while preserving sales history"
                                >
                                  <HiOutlineTrash className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Integrated Pagination Footer */}
            {!loading && totalRecords > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-zinc-950/60 text-xs text-zinc-400">
                <div>
                  Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold text-white">{endIndex}</span> of{' '}
                  <span className="font-semibold text-white">{totalRecords.toLocaleString()}</span> entries
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    title="First Page"
                    className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <HiOutlineChevronDoubleLeft className="w-3.5 h-3.5 text-zinc-300" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <HiOutlineChevronLeft className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                      typeof p === 'number' ? (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`min-w-[32px] h-8 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            currentPage === p
                              ? 'bg-orange-500 text-zinc-950 font-bold shadow-sm'
                              : 'border border-white/10 text-zinc-300 hover:bg-white/10'
                          }`}
                        >
                          {p}
                        </button>
                      ) : (
                        <span key={idx} className="px-1 text-xs text-zinc-500">
                          {p}
                        </span>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <span>Next</span>
                    <HiOutlineChevronRight className="w-3.5 h-3.5 text-zinc-300" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Last Page"
                    className="p-2 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <HiOutlineChevronDoubleRight className="w-3.5 h-3.5 text-zinc-300" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: RESTOCK & PROCUREMENT REQUESTS TRACKER */}
      {activeTab === 'restock_requests' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HiOutlineClock className="text-orange-400" />
                <span>Approval &amp; Restock Queue</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Products stay in this queue until the Purchase Order Manager accepts the request. Once accepted, they are automatically admitted into <strong>"The Products We Have"</strong> catalog.
              </p>
            </div>
            <button
              onClick={fetchRestockRequests}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 hover:text-white transition cursor-pointer"
            >
              <HiOutlineArrowPath className="w-3.5 h-3.5 text-orange-400" />
              <span>Refresh Queue</span>
            </button>
          </div>

          <div className="space-y-4">
            {requestsLoading ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-orange-500/20 border-t-orange-400 animate-spin mx-auto mb-2" />
                <span className="text-zinc-400 text-xs">Loading queue items...</span>
              </div>
            ) : restockRequests.length === 0 ? (
              <Card className="p-12 text-center">
                <HiOutlineTruck className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h4 className="text-white font-bold text-base">Approval Queue is Clear</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  No products or restock requests currently pending Purchase Order Manager approval.
                </p>
              </Card>
            ) : (
              restockRequests.map((req) => {
                const badge = getStatusBadge(req.status);
                return (
                  <Card key={req.id} className="p-5 border-white/10 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs font-mono text-zinc-400">
                          #{req.id}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                            <span>{req.product_name}</span>
                            <span className="font-mono text-xs text-zinc-400">({req.sku})</span>
                            {req.request_type === 'new_product' ? (
                              req.status === 'pending_purchase_approval' ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                                  ⏳ In Queue: Awaiting Purchase Manager Acceptance (Not in Active Inventory Yet)
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  ✅ Accepted by PO Manager (Active in "The Products We Have")
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30">
                                Restock Order
                              </span>
                            )}
                          </h4>
                          <div className="text-xs text-zinc-400 mt-0.5 flex flex-wrap items-center gap-3">
                            <span>Vendor: <strong className="text-zinc-200">{req.supplier_name || 'Unassigned'}</strong></span>
                            <span>Requested: <strong className="text-orange-400 font-mono">+{req.requested_quantity} units</strong></span>
                            <span>Current Stock: <strong className="text-zinc-300 font-mono">{req.current_stock}</strong></span>
                            {req.po_number && (
                              <span>PO: <strong className="text-indigo-400 font-mono">{req.po_number}</strong></span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-auto">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{badge.label}</span>
                        </span>
                      </div>
                    </div>

                    {/* Progress Track Steps */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      {/* Step 1 */}
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                        <span className="text-[10px] text-zinc-500 font-semibold uppercase block">Step 1</span>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <HiOutlineCheckCircle className="text-emerald-400" />
                          <span>Inventory Requested</span>
                        </div>
                        <span className="text-[11px] text-zinc-400 block truncate">{req.notes || 'Initiated by Inventory'}</span>
                      </div>

                      {/* Step 2 */}
                      <div className={`p-2.5 rounded-xl border space-y-1 ${
                        req.status !== 'pending_purchase_approval'
                          ? 'bg-blue-500/5 border-blue-500/25 text-white'
                          : 'bg-white/[0.01] border-white/5 text-zinc-500'
                      }`}>
                        <span className="text-[10px] uppercase font-semibold block">Step 2</span>
                        <div className="font-semibold flex items-center gap-1.5">
                          {req.status !== 'pending_purchase_approval' ? (
                            <HiOutlineCheckCircle className="text-blue-400" />
                          ) : (
                            <HiOutlineClock className="text-amber-400 animate-pulse" />
                          )}
                          <span>PO Dispatched</span>
                        </div>
                        <span className="text-[11px] block truncate">
                          {req.po_number || 'Awaiting PO Approval'}
                        </span>
                      </div>

                      {/* Step 3 */}
                      <div className={`p-2.5 rounded-xl border space-y-1 ${
                        ['accepted_by_manufacturer', 'shipped_to_purchase', 'received_and_restocked'].includes(req.status)
                          ? 'bg-indigo-500/5 border-indigo-500/25 text-white'
                          : 'bg-white/[0.01] border-white/5 text-zinc-500'
                      }`}>
                        <span className="text-[10px] uppercase font-semibold block">Step 3</span>
                        <div className="font-semibold flex items-center gap-1.5">
                          {['accepted_by_manufacturer', 'shipped_to_purchase', 'received_and_restocked'].includes(req.status) ? (
                            <HiOutlineCheckCircle className="text-indigo-400" />
                          ) : (
                            <HiOutlineClock />
                          )}
                          <span>Manufacturer Fulfill</span>
                        </div>
                        <span className="text-[11px] block truncate">
                          {req.status === 'shipped_to_purchase' ? 'Shipped to PO Dept' : (req.status === 'accepted_by_manufacturer' ? 'In Production' : 'Pending')}
                        </span>
                      </div>

                      {/* Step 4 */}
                      <div className={`p-2.5 rounded-xl border space-y-1 ${
                        req.status === 'received_and_restocked'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                          : 'bg-white/[0.01] border-white/5 text-zinc-500'
                      }`}>
                        <span className="text-[10px] uppercase font-semibold block">Step 4</span>
                        <div className="font-semibold flex items-center gap-1.5">
                          {req.status === 'received_and_restocked' ? (
                            <HiOutlineCheckCircle className="text-emerald-400" />
                          ) : (
                            <HiOutlineClock />
                          )}
                          <span>Restocked in Warehouse</span>
                        </div>
                        <span className="text-[11px] block truncate">
                          {req.status === 'received_and_restocked' ? 'Stock Credited ✅' : 'Pending PO Handover'}
                        </span>
                      </div>
                    </div>

                    {/* Return Back Statement Display */}
                    {req.return_back_statement && (
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
                        <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px] block mb-1">
                          📋 PO Manager Return Back Statement &amp; Receiving Note:
                        </span>
                        <p className="text-zinc-200 leading-relaxed font-mono">
                          {req.return_back_statement}
                        </p>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* RESTOCK MODAL */}
      <AnimatePresence>
        {restockModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-950 border border-orange-500/30 rounded-2xl p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <HiOutlineTruck className="text-orange-400 w-5 h-5" />
                  <span>Initiate Restock Request</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRestockModalOpen(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>

              {/* Product Info Summary */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 mb-4 text-xs space-y-1">
                <div className="text-white font-semibold text-sm">{selectedProduct.name}</div>
                <div className="text-zinc-400 flex items-center gap-4">
                  <span>SKU: <strong className="text-zinc-200 font-mono">{selectedProduct.sku}</strong></span>
                  <span>Current Stock: <strong className="text-orange-400 font-mono">{selectedProduct.stock} units</strong></span>
                  <span>Price: <strong className="text-amber-300 font-mono">₹{parseFloat(selectedProduct.price || 0).toFixed(2)}</strong></span>
                </div>
              </div>

              <form onSubmit={handleSubmitRestockRequest} className="space-y-4">
                {/* Requested Quantity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Quantity to Restock <span className="text-orange-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    required
                    className="w-full h-10 px-3.5 text-sm font-mono bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Purchasing Vendor / Manufacturer */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 block">
                    Assigned Manufacturer / Supplier <span className="text-orange-400">*</span>
                  </label>
                  <select
                    value={restockSupplierId}
                    onChange={(e) => setRestockSupplierId(e.target.value)}
                    required
                    className="w-full h-10 px-3 text-sm bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Choose Supplier / Manufacturer *</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.contact_info ? `(${s.contact_info})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 block">Priority Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['normal', 'high', 'urgent'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setRestockPriority(p)}
                        className={`py-2 text-xs font-semibold rounded-xl uppercase transition cursor-pointer ${
                          restockPriority === p
                            ? p === 'urgent'
                              ? 'bg-rose-500 text-white font-bold shadow-sm'
                              : p === 'high'
                              ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                              : 'bg-orange-500 text-zinc-950 font-bold shadow-sm'
                            : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes / Procurement Reason */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 block">Procurement Notes for PO Manager</label>
                  <textarea
                    rows={3}
                    value={restockNotes}
                    onChange={(e) => setRestockNotes(e.target.value)}
                    placeholder="Provide context regarding low quantity, expected stock out date, or demand surge..."
                    className="w-full p-3 text-xs bg-zinc-900 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRestockModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 text-xs font-medium transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRestock}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-zinc-950 font-bold text-xs transition shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <HiOutlineTruck size={16} />
                    <span>Send Request to PO Manager</span>
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
