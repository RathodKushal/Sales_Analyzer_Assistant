import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI, ingestionAPI } from '../api/client';
import { Card } from '../components/UI';
import { HiOutlineCloudArrowUp, HiOutlineTag } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [datasetStatus, setDatasetStatus] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Products</h1>
          <p className="text-zinc-400">
            {hasDataset
              ? `Displaying ${products.length} of ${totalProducts.toLocaleString()} catalog SKUs from active dataset.`
              : 'Product catalog and historical inventory.'}
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
          <div className="p-12 text-center text-zinc-500">Loading catalog...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="p-4 font-medium">Stock Code</th>
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium text-right">Avg Unit Price</th>
                  <th className="p-4 font-medium text-right">Total Units Sold</th>
                  <th className="p-4 font-medium text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {products.map((p) => (
                  <tr key={p.id || p.stock_code} className="hover:bg-zinc-800/30 transition-colors text-sm">
                    <td className="p-4 text-zinc-300 font-mono text-xs">{p.stock_code}</td>
                    <td className="p-4 text-zinc-200 font-medium">{p.description || p.stock_code}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {p.category || '—'}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-zinc-300">
                      ₹{(p.avg_price || 0).toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-zinc-400">
                      {(p.total_quantity_sold || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-medium text-emerald-400">
                      ₹{(p.total_revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <HiOutlineTag className="text-3xl text-zinc-600 mb-1" />
                        <p className="text-zinc-300 font-medium text-base">Zero-State Active: No products found.</p>
                        <p className="text-zinc-500 text-xs">
                          {hasDataset
                            ? 'No products were extracted from the uploaded file.'
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
