import { useState, useEffect } from 'react';
import { productsAPI } from '../api/client';
import { Card } from '../components/UI';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await productsAPI.list(0, 50);
        setProducts(res.data.products);
      } catch (err) {
        toast.error('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Products</h1>
        <p className="text-zinc-400">Inventory and catalog.</p>
      </header>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="p-4 font-medium">Product ID</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Name / Description</th>
                  <th className="p-4 font-medium text-right">Unit Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors text-sm">
                    <td className="p-4 text-zinc-300 font-mono text-xs">{p.product_id}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-200">
                      {p.name || 'Unknown Product'}
                    </td>
                    <td className="p-4 text-right font-medium text-zinc-300">
                      ₹{p.unit_price.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-500">
                      No products found.
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
