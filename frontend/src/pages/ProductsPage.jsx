import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productsAPI, ingestionAPI } from '../api/client';
import { Card, StatCard } from '../components/UI';
import { 
  HiOutlineCloudArrowUp, 
  HiOutlineTag, 
  HiOutlineCube, 
  HiOutlineCurrencyRupee, 
  HiOutlineMagnifyingGlass,
  HiOutlineShoppingBag,
  HiOutlineSparkles
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [datasetStatus, setDatasetStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchProducts() {
      try {
        const [prodRes, metaRes] = await Promise.all([
          productsAPI.list(0, 100).catch(() => ({ data: { products: [], total: 0 } })),
          ingestionAPI.getDatasetStatus().catch(() => ({ data: { has_dataset: false } })),
        ]);
        setProducts(prodRes.data.products || []);
        setTotalProducts(prodRes.data.total || 0);
        setDatasetStatus(metaRes.data);
      } catch (err) {
        toast.error('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const hasDataset = Boolean(datasetStatus?.has_dataset);

  // Compute summary stats
  const totalRevenue = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.total_revenue || 0), 0);
  }, [products]);

  const totalUnits = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.total_quantity_sold || 0), 0);
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.stock_code && p.stock_code.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-white/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2 backdrop-blur-md">
            <HiOutlineSparkles className="text-sm animate-spin" style={{ animationDuration: '6s' }} />
            <span>Product Inventory Intelligence</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">Products Catalog</h1>
          <p className="text-zinc-400 mt-1">
            {hasDataset
              ? `Displaying ${filteredProducts.length} of ${totalProducts.toLocaleString()} catalog SKUs from active dataset.`
              : 'Product catalog, unit pricing, and inventory performance.'}
          </p>
        </div>

        {!hasDataset && isAdmin && (
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/25 self-start cursor-pointer active:scale-95"
          >
            <HiOutlineCloudArrowUp className="text-lg" />
            Upload Dataset
          </button>
        )}
      </header>

      {/* Summary KPI Grid with Frosted Glassmorphism */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          label="Catalog SKUs"
          value={totalProducts.toLocaleString()}
          icon={<HiOutlineCube size={22} />}
        />
        <StatCard
          label="Catalog Revenue"
          value={`₹${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          icon={<HiOutlineCurrencyRupee size={22} />}
        />
        <StatCard
          label="Units Sold"
          value={totalUnits.toLocaleString()}
          icon={<HiOutlineShoppingBag size={22} />}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-lg" />
          <input
            type="text"
            placeholder="Search by SKU code, description, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-zinc-950/60 backdrop-blur-xl border border-white/10 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 transition shadow-inner"
          />
        </div>

        <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
          Showing {filteredProducts.length} items
        </span>
      </div>

      {/* Glassmorphic Products Table */}
      <Card className="overflow-hidden border border-white/10 shadow-[0_12px_44px_rgba(0,0,0,0.6)]">
        {loading ? (
          <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin" />
            <span>Loading product catalog...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-zinc-950/80 backdrop-blur-2xl text-xs uppercase tracking-wider text-zinc-400">
                  <th className="p-4 font-semibold">Stock Code</th>
                  <th className="p-4 font-semibold">Description</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold text-right">Avg Unit Price</th>
                  <th className="p-4 font-semibold text-right">Total Units Sold</th>
                  <th className="p-4 font-semibold text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((p) => (
                  <tr key={p.id || p.stock_code} className="hover:bg-white/[0.04] transition-colors text-sm group">
                    <td className="p-4 text-cyan-300 font-mono text-xs font-semibold">
                      {p.stock_code}
                    </td>
                    <td className="p-4 text-zinc-200 font-medium">
                      {p.description || p.stock_code}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900/80 text-violet-300 border border-violet-500/25 shadow-sm">
                        {p.category || 'Standard SKU'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-zinc-200">
                      ₹{(p.avg_price || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-zinc-400 font-medium">
                      {(p.total_quantity_sold || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-semibold text-emerald-400">
                      ₹{(p.total_revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 text-zinc-500">
                          <HiOutlineTag className="text-3xl" />
                        </div>
                        <p className="text-zinc-200 font-semibold text-base">
                          {searchQuery ? 'No matching products found' : 'Zero-State Active: No products found'}
                        </p>
                        <p className="text-zinc-500 text-xs max-w-sm">
                          {hasDataset
                            ? 'Try adjusting your search query or clear the filter.'
                            : 'Upload a sales dataset to populate catalog SKUs, quantities, and pricing.'}
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
