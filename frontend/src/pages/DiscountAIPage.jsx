import { useState, useEffect } from 'react';
import { analyticsAPI } from '../api/client';
import { Card } from '../components/UI';
import { HiOutlineSparkles, HiOutlineArrowTrendingUp } from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function DiscountAIPage() {
  const [bins, setBins] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);
  const [formData, setFormData] = useState({
    category: 'Electronics',
    segment: 'Champions',
    region: 'North',
    quantity: 1,
    sales: 1000,
  });

  useEffect(() => {
    async function fetchModelData() {
      try {
        const [binsRes, summaryRes] = await Promise.all([
          analyticsAPI.getDiscountBins(),
          analyticsAPI.getSummary(),
        ]);
        setBins(binsRes.data.available_discount_bins);
        setSummary(summaryRes.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load AI model data.');
      } finally {
        setLoading(false);
      }
    }
    fetchModelData();
  }, []);

  const handlePredict = async (e) => {
    e.preventDefault();
    try {
      const res = await analyticsAPI.predict({
        category: formData.category,
        customer_segment: formData.segment,
        region: formData.region,
        quantity: Number(formData.quantity),
        sales: Number(formData.sales),
      });
      setPrediction(res.data);
      toast.success('Prediction successful!');
    } catch (err) {
      toast.error('Prediction failed.');
    }
  };

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
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          Discount AI <HiOutlineSparkles className="text-blue-500" />
        </h1>
        <p className="text-zinc-400">Optimize discounts using our Deep Q-Network reinforcement learning agent.</p>
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
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Home">Home</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Customer Segment</label>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                  value={formData.segment}
                  onChange={(e) => setFormData({...formData, segment: e.target.value})}
                >
                  <option value="Champions">Champions</option>
                  <option value="Loyal">Loyal</option>
                  <option value="At Risk">At Risk</option>
                  <option value="New">New</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Quantity</label>
                  <input 
                    type="number" min="1"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Sales Value (₹)</label>
                  <input 
                    type="number" min="1"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500"
                    value={formData.sales}
                    onChange={(e) => setFormData({...formData, sales: e.target.value})}
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full mt-4 bg-zinc-100 hover:bg-white text-zinc-900 font-medium py-2.5 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                Run AI Optimization
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
                  <p className="text-sm text-zinc-400">Based on maximizing predicted profit</p>
                </div>
                <div className="text-4xl font-bold tracking-tight text-blue-400">
                  {(prediction.recommended_discount * 100).toFixed(0)}%
                </div>
              </div>
              <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2 text-sm text-zinc-300 mb-2">
                  <HiOutlineArrowTrendingUp className="text-emerald-400" />
                  Expected Profit: <span className="font-semibold">₹{prediction.expected_profit.toFixed(2)}</span>
                </div>
                <div className="text-xs text-zinc-500">
                  Confidence Score: {(prediction.confidence_score * 100).toFixed(1)}%
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 h-[200px] flex flex-col items-center justify-center text-zinc-500 border-dashed">
              <HiOutlineSparkles size={32} className="mb-3 opacity-50" />
              <p>Run optimization to see AI recommendations</p>
            </Card>
          )}

          {summary && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold tracking-wide text-zinc-400 uppercase mb-4">Model Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                  <div className="text-2xl font-semibold text-zinc-200 mb-1">
                    +{summary.average_profit_improvement_percent.toFixed(1)}%
                  </div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Avg Profit Uplift</div>
                </div>
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                  <div className="text-2xl font-semibold text-zinc-200 mb-1">
                    {(summary.positive_profit_rate * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Success Rate</div>
                </div>
              </div>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
