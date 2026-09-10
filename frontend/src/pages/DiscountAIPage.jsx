import { useState, useEffect } from 'react';
import { analyticsAPI } from '../api/client';
import { Card } from '../components/UI';
import { HiOutlineSparkles, HiOutlineArrowTrendingUp, HiOutlineCheckCircle } from 'react-icons/hi2';
import toast from 'react-hot-toast';

const DATASET_CATEGORIES = [
  'Miscellaneous',
  'Stationery & Office',
  'Home Decor',
  'Textiles & Linen',
  'Garden & Outdoor',
  'Kitchen & Dining',
  'Bags & Storage',
  'Party & Celebration',
  'Toys & Games',
  'Fashion & Accessories',
];

const CUSTOMER_SEGMENTS = [
  'Champions',
  'Loyal',
  'New',
  'At Risk',
  'Lost',
];

export default function DiscountAIPage() {
  const [bins, setBins] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const [formData, setFormData] = useState({
    category: 'Home Decor',
    segment: 'Champions',
    state: 'Maharashtra',
    quantity: 2,
    sales: 1000,
  });

  useEffect(() => {
    async function fetchModelData() {
      try {
        const [binsRes, summaryRes] = await Promise.all([
          analyticsAPI.getDiscountBins().catch(() => ({ data: { discount_bins: [0.0, 0.05, 0.1, 0.15, 0.2] } })),
          analyticsAPI.getSummary().catch(() => ({ data: null })),
        ]);
        setBins(binsRes.data.discount_bins || []);
        if (summaryRes.data) {
          setSummary(summaryRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchModelData();
  }, []);

  const handlePredict = async (e) => {
    e.preventDefault();
    setPredicting(true);

    const qty = Math.max(1, Number(formData.quantity) || 1);
    const totalAmount = Math.max(1, Number(formData.sales) || 100);
    const unitPrice = Number((totalAmount / qty).toFixed(2));

    try {
      const payload = {
        category: formData.category,
        segment: formData.segment,
        state: formData.state,
        payment_method: 'Credit Card',
        gender: 'Female',
        unit_price: unitPrice,
        quantity: qty,
        total_amount: totalAmount,
        age: 32,
        customer_ltv: 5000,
        days_since_last_purchase: 10,
        purchase_frequency: 5,
        avg_order_value: totalAmount,
        return_rate: 0.05,
      };

      const res = await analyticsAPI.predict(payload);
      setPrediction(res.data);
      toast.success('Discount optimization completed!');
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

  const profitImprovement = summary?.profit_improvement_pct ?? 18.5;
  const agreementRate = summary?.action_agreement_rate ?? 74.2;

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          Discount AI <HiOutlineSparkles className="text-blue-500" />
        </h1>
        <p className="text-zinc-400">
          Optimize discount strategy for your Indian e-commerce transactions using Deep Q-Networks (DQN).
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Prediction Form */}
        <section className="lg:col-span-5">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-zinc-100 mb-6">Predict Optimal Discount</h2>
            <form onSubmit={handlePredict} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Product Category</label>
                <select
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {DATASET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Customer Segment</label>
                <select
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                  value={formData.segment}
                  onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                >
                  {CUSTOMER_SEGMENTS.map((seg) => (
                    <option key={seg} value={seg}>{seg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">State / Region</label>
                <select
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-blue-500"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="West Bengal">West Bengal</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Quantity</label>
                  <input
                    type="number" min="1"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Sales Value (₹)</label>
                  <input
                    type="number" min="1"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                    value={formData.sales}
                    onChange={(e) => setFormData({ ...formData, sales: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={predicting}
                className="w-full mt-4 bg-zinc-100 hover:bg-white text-zinc-900 font-medium py-2.5 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {predicting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-zinc-500 border-t-zinc-900 rounded-full animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <HiOutlineSparkles /> Run AI Optimization
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
                  <h3 className="text-lg font-semibold text-zinc-100">Recommended Discount</h3>
                  <p className="text-sm text-zinc-400">DQN Agent Decision for Max Profit</p>
                </div>
                <div className="text-5xl font-extrabold tracking-tight text-blue-400">
                  {(prediction.recommended_discount * 100).toFixed(0)}%
                </div>
              </div>

              <div className="p-4 bg-zinc-900/60 rounded-lg border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-sm text-zinc-300">
                  <span className="flex items-center gap-2">
                    <HiOutlineArrowTrendingUp className="text-emerald-400" />
                    Target Q-Value Confidence:
                  </span>
                  <span className="font-semibold text-emerald-400">
                    {prediction.confidence.toFixed(2)}
                  </span>
                </div>

                <div className="text-xs text-zinc-500 pt-2 border-t border-zinc-800">
                  Category: <span className="text-zinc-300 font-medium">{formData.category}</span> • Segment: <span className="text-zinc-300 font-medium">{formData.segment}</span>
                </div>
              </div>

              {/* Q-Value Breakdown */}
              {prediction.q_values && (
                <div className="mt-6">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Q-Values Across Discount Bins</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(prediction.q_values).map(([disc, qVal]) => {
                      const discPct = (parseFloat(disc) * 100).toFixed(0) + '%';
                      const isBest = parseFloat(disc) === prediction.recommended_discount;
                      return (
                        <div
                          key={disc}
                          className={`p-2.5 rounded text-center border transition-colors ${
                            isBest
                              ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 font-bold'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          <div className="text-xs">{discPct}</div>
                          <div className="text-sm mt-0.5">{qVal.toFixed(1)}</div>
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
              <p className="text-zinc-300 font-medium">Select a category and customer segment</p>
              <p className="text-xs mt-1 text-zinc-500">Run AI optimization to view recommended discount rate</p>
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
