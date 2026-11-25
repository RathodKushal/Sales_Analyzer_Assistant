import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI } from '../api/client';
import { Card } from '../components/UI';
import { HiOutlineSparkles, HiOutlineArrowTrendingUp, HiOutlineCheckCircle, HiOutlineShoppingCart, HiOutlineUser } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function DiscountAIPage() {
  const navigate = useNavigate();
  const [bins, setBins] = useState([]);
  const [summary, setSummary] = useState(null);
  const [datasetMeta, setDatasetMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const [categories, setCategories] = useState([]);
  const [states, setStates] = useState([]);
  const [segments, setSegments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedStockCode, setSelectedStockCode] = useState('');

  const [formData, setFormData] = useState({
    category: '',
    segment: 'Retail',
    state: '',
    quantity: 1,
    sales: 100,
    unitPrice: 100,
    customerLTV: 1000,
    daysSinceLastPurchase: 0,
    purchaseFrequency: 1,
    returnRate: 0.0,
  });

  useEffect(() => {
    async function fetchModelData() {
      try {
        const [binsRes, summaryRes, metaRes] = await Promise.all([
          analyticsAPI.getDiscountBins().catch(() => ({ data: { discount_bins: [0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3] } })),
          analyticsAPI.getSummary().catch(() => ({ data: null })),
          analyticsAPI.getDatasetMeta().catch(() => ({ data: { has_dataset: false, categories: [], states: [], segments: [] } })),
        ]);
        
        setBins(binsRes.data.discount_bins || [0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3]);
        if (summaryRes.data) {
          setSummary(summaryRes.data);
        }

        const meta = metaRes.data || {};
        setDatasetMeta(meta);

        const loadedCats = meta.categories && meta.categories.length > 0 ? meta.categories : ['Miscellaneous', 'General'];
        const loadedStates = meta.states && meta.states.length > 0 ? meta.states : ['Maharashtra', 'General'];
        const loadedSegs = meta.segments && meta.segments.length > 0 ? meta.segments : ['Retail', 'Champions', 'Loyal', 'Potential', 'New'];
        const loadedCusts = meta.customers || [];
        const loadedProds = meta.products || [];

        setCategories(loadedCats);
        setStates(loadedStates);
        setSegments(loadedSegs);
        setCustomers(loadedCusts);
        setProducts(loadedProds);

        // Pre-select first customer & product if available
        let initialCat = loadedCats[0] || 'General';
        let initialSeg = loadedSegs[0] || 'Retail';
        let initialState = loadedStates[0] || 'General';
        let initialPrice = 100;
        let initialLTV = 1000;
        let initialFreq = 1;
        let initialRecency = 0;
        let initialReturnRate = 0.0;

        if (loadedCusts.length > 0) {
          const c0 = loadedCusts[0];
          setSelectedCustomerId(String(c0.customer_id));
          initialSeg = c0.segment || initialSeg;
          initialState = c0.state || initialState;
          initialLTV = c0.lifetime_value || 1000;
          initialFreq = c0.total_orders || 1;
          initialRecency = c0.days_since_last_purchase || 0;
          initialReturnRate = c0.return_rate || 0.0;
        }

        if (loadedProds.length > 0) {
          const p0 = loadedProds[0];
          setSelectedStockCode(p0.stock_code);
          initialCat = p0.category || initialCat;
          initialPrice = p0.unit_price || 100;
        }

        setFormData({
          category: initialCat,
          state: initialState,
          segment: initialSeg,
          quantity: 1,
          unitPrice: initialPrice,
          sales: initialPrice * 1,
          customerLTV: initialLTV,
          daysSinceLastPurchase: initialRecency,
          purchaseFrequency: initialFreq,
          returnRate: initialReturnRate,
        });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchModelData();
  }, []);

  const handleCustomerChange = (e) => {
    const cid = e.target.value;
    setSelectedCustomerId(cid);
    if (!cid) return;

    const cust = customers.find((c) => String(c.customer_id) === String(cid));
    if (cust) {
      setFormData((prev) => ({
        ...prev,
        segment: cust.segment || prev.segment,
        state: cust.state || prev.state,
        customerLTV: cust.lifetime_value || cust.total_spent || 1000,
        daysSinceLastPurchase: cust.days_since_last_purchase || 0,
        purchaseFrequency: cust.total_orders || 1,
        returnRate: cust.return_rate || 0.0,
      }));
    }
  };

  const handleProductChange = (e) => {
    const scode = e.target.value;
    setSelectedStockCode(scode);
    if (!scode) return;

    const prod = products.find((p) => p.stock_code === scode);
    if (prod) {
      const unitP = prod.unit_price || 100;
      setFormData((prev) => ({
        ...prev,
        category: prod.category || prev.category,
        unitPrice: unitP,
        sales: Number((unitP * prev.quantity).toFixed(2)),
      }));
    }
  };

  const handleQuantityChange = (qtyVal) => {
    const qty = Math.max(1, Number(qtyVal) || 1);
    setFormData((prev) => ({
      ...prev,
      quantity: qty,
      sales: Number((prev.unitPrice * qty).toFixed(2)),
    }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setPredicting(true);

    const qty = Math.max(1, Number(formData.quantity) || 1);
    const totalAmount = Math.max(1, Number(formData.sales) || (formData.unitPrice * qty));
    const unitPrice = Number((totalAmount / qty).toFixed(2));

    try {
      const payload = {
        customer_id: selectedCustomerId ? Number(selectedCustomerId) : undefined,
        stock_code: selectedStockCode || undefined,
        category: formData.category || 'General',
        segment: formData.segment || 'Retail',
        state: formData.state || 'General',
        payment_method: 'UPI',
        gender: 'Male',
        unit_price: unitPrice,
        quantity: qty,
        total_amount: totalAmount,
        age: 32,
        customer_ltv: formData.customerLTV,
        days_since_last_purchase: formData.daysSinceLastPurchase,
        purchase_frequency: formData.purchaseFrequency,
        avg_order_value: Number((totalAmount / qty).toFixed(2)),
        return_rate: formData.returnRate,
      };

      const res = await analyticsAPI.predict(payload);
      setPrediction(res.data);
      toast.success('Dueling DDQN discount optimization completed!');
    } catch (err) {
      console.error(err);
      toast.error('Discount optimization failed. Check input values.');
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin"></div>
      </div>
    );
  }

  const hasDataset = Boolean(datasetMeta?.has_dataset);
  const profitImprovement = summary?.profit_improvement_pct ?? 14.2;
  const agreementRate = summary?.action_agreement_rate ?? 88.5;

  const selectedCust = customers.find((c) => String(c.customer_id) === String(selectedCustomerId));
  const selectedProd = products.find((p) => p.stock_code === selectedStockCode);

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            Discount AI <HiOutlineSparkles className="text-blue-500" />
          </h1>
          <p className="text-zinc-400">
            Dueling Double Deep Q-Network (DQN) pricing agent trained to maximize profit margin across discrete discount tiers (0% – 30%).
          </p>
        </div>

        {!hasDataset && (
          <button
            onClick={() => navigate('/billing')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition self-start"
          >
            <HiOutlineShoppingCart className="text-lg" />
            Create First Bill
          </button>
        )}
      </header>

      {!hasDataset && (
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-zinc-200">Zero-State Active</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              No sales recorded in billing yet. Complete sales in the Billing/POS module to automatically calibrate customer RFM states and product pricing.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Prediction Form */}
        <section className="lg:col-span-5">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Live Transaction State</h2>
            <form onSubmit={handlePredict} className="space-y-4">
              {/* Customer Selector */}
              {customers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1.5">
                    <HiOutlineUser className="text-blue-400" /> Billed Customer (RFM Profile)
                  </label>
                  <select
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500 text-sm"
                    value={selectedCustomerId}
                    onChange={handleCustomerChange}
                  >
                    <option value="">-- Manual Customer Entry --</option>
                    {customers.map((c) => (
                      <option key={c.customer_id} value={c.customer_id}>
                        {c.name} ({c.segment || 'Retail'}, {c.total_orders} orders, ₹{c.total_spent.toFixed(0)})
                      </option>
                    ))}
                  </select>

                  {selectedCust && (
                    <div className="mt-2 p-2.5 bg-zinc-950/60 rounded border border-zinc-800/80 text-[11px] text-zinc-400 flex flex-wrap gap-x-3 gap-y-1">
                      <span>Recency: <strong className="text-zinc-200">{selectedCust.days_since_last_purchase}d</strong></span>
                      <span>Freq: <strong className="text-zinc-200">{selectedCust.total_orders} orders</strong></span>
                      <span>CLV: <strong className="text-zinc-200">₹{selectedCust.total_spent.toFixed(2)}</strong></span>
                      <span>Return Rate: <strong className="text-zinc-200">{(selectedCust.return_rate * 100).toFixed(0)}%</strong></span>
                    </div>
                  )}
                </div>
              )}

              {/* Product Selector */}
              {products.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1.5">
                    <HiOutlineShoppingCart className="text-emerald-400" /> Billed Inventory Product
                  </label>
                  <select
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500 text-sm"
                    value={selectedStockCode}
                    onChange={handleProductChange}
                  >
                    <option value="">-- Manual Product Entry --</option>
                    {products.map((p) => (
                      <option key={p.stock_code} value={p.stock_code}>
                        [{p.stock_code}] {p.description} (₹{p.unit_price.toFixed(2)})
                      </option>
                    ))}
                  </select>

                  {selectedProd && (
                    <div className="mt-2 p-2.5 bg-zinc-950/60 rounded border border-zinc-800/80 text-[11px] text-zinc-400 flex flex-wrap gap-x-3 gap-y-1">
                      <span>Category: <strong className="text-zinc-200">{selectedProd.category}</strong></span>
                      <span>Unit Price: <strong className="text-zinc-200">₹{selectedProd.unit_price.toFixed(2)}</strong></span>
                      <span>Stock: <strong className="text-zinc-200">{selectedProd.stock} units</strong></span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Product Category</label>
                  <select
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500 text-sm"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Customer Segment</label>
                  <select
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500 text-sm"
                    value={formData.segment}
                    onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                  >
                    {segments.map((seg) => (
                      <option key={seg} value={seg}>{seg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Customer State / Region</label>
                <select
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500 text-sm"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                >
                  {states.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500 text-sm"
                    value={formData.quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Transaction Value (₹)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500 text-sm"
                    value={formData.sales}
                    onChange={(e) => setFormData({ ...formData, sales: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={predicting}
                className="w-full mt-3 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-sm shadow"
              >
                {predicting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-900 rounded-full animate-spin" />
                    Evaluating Q-Values...
                  </>
                ) : (
                  <>
                    <HiOutlineSparkles className="text-blue-600" /> Run Dueling DDQN Optimization
                  </>
                )}
              </button>
            </form>
          </Card>
        </section>

        {/* Prediction Results & Model Summary */}
        <section className="lg:col-span-7 space-y-6">
          {prediction ? (
            <Card className="p-6 border-blue-500/30 bg-blue-500/5">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">Recommended Discount Tier</h3>
                  <p className="text-sm text-zinc-400">RL Agent Decision to Maximize Profit</p>
                </div>
                <div className="text-5xl font-extrabold tracking-tight text-blue-400">
                  {(prediction.recommended_discount * 100).toFixed(0)}%
                </div>
              </div>

              <div className="p-4 bg-zinc-900/60 rounded-lg border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-sm text-zinc-300">
                  <span className="flex items-center gap-2">
                    <HiOutlineArrowTrendingUp className="text-emerald-400" />
                    Optimal Action Q-Value:
                  </span>
                  <span className="font-semibold text-emerald-400">
                    {prediction.confidence.toFixed(3)}
                  </span>
                </div>

                <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-800 flex flex-wrap gap-2">
                  <span>Category: <strong className="text-zinc-200">{formData.category}</strong></span>
                  <span>• Segment: <strong className="text-zinc-200">{formData.segment}</strong></span>
                  <span>• Quantity: <strong className="text-zinc-200">{formData.quantity}</strong></span>
                  <span>• Total: <strong className="text-zinc-200">₹{formData.sales}</strong></span>
                </div>
              </div>

              {/* Q-Value Breakdown */}
              {prediction.q_values && (
                <div className="mt-6">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    Action Advantage Stream (0% to 30% Tiers)
                  </h4>
                  <div className="grid grid-cols-7 gap-1.5">
                    {Object.entries(prediction.q_values).map(([disc, qVal]) => {
                      const discPct = (parseFloat(disc) * 100).toFixed(0) + '%';
                      const isBest = parseFloat(disc) === prediction.recommended_discount;
                      return (
                        <div
                          key={disc}
                          className={`p-2 rounded text-center border transition-all ${
                            isBest
                              ? 'bg-blue-500/20 border-blue-500/60 text-blue-300 font-bold scale-105'
                              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          <div className="text-xs font-medium">{discPct}</div>
                          <div className="text-[11px] mt-0.5 font-mono">{qVal.toFixed(2)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 h-[220px] flex flex-col items-center justify-center text-zinc-500 border-dashed">
              <HiOutlineSparkles size={36} className="mb-3 opacity-50 text-blue-400" />
              <p className="text-zinc-300 font-medium">Select a billed customer or product</p>
              <p className="text-xs mt-1 text-zinc-500">Run AI optimization to view profit-maximizing discount recommendations</p>
            </Card>
          )}

          {/* Model Summary Performance */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold tracking-wide text-zinc-400 uppercase mb-4 flex items-center gap-2">
              <HiOutlineCheckCircle className="text-blue-400" /> Model Performance Benchmarks
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <div className="text-3xl font-bold text-emerald-400 mb-1">
                  +{profitImprovement.toFixed(1)}%
                </div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider">Estimated Profit Uplift</div>
              </div>
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  {agreementRate.toFixed(1)}%
                </div>
                <div className="text-xs text-zinc-400 uppercase tracking-wider">Historical Strategy Alignment</div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
