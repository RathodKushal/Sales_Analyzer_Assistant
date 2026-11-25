import { useState, useEffect, useMemo } from 'react';
import { inventoryAPI, billingAPI } from '../api/client';
import { Card, StatCard } from '../components/UI';
import {
  HiOutlineReceiptPercent,
  HiOutlineShoppingCart,
  HiOutlineCurrencyRupee,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineTrash,
  HiOutlinePrinter,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineClock,
  HiOutlineCreditCard,
  HiOutlineBanknotes,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineCube,
  HiOutlineSparkles,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'history'
  
  // Products state
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState('');

  // Cart state
  const [cart, setCart] = useState([]);
  
  // Customer & Bill details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [city, setCity] = useState('Store Counter');
  const [state, setState] = useState('Retail');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [taxRate, setTaxRate] = useState(5.0); // Default 5% GST
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Invoice view / print modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Invoice history state
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Load products (only active approved products)
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      // Fetch only active products
      const res = await inventoryAPI.list(false, 'active');
      const items = Array.isArray(res.data) ? res.data : [];
      setProducts(items);
    } catch (err) {
      console.error('Failed to load products for billing', err);
      toast.error('Failed to load inventory products');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Load invoice history
  const fetchInvoices = async (search = '') => {
    setLoadingInvoices(true);
    try {
      const res = await billingAPI.getInvoices({ limit: 50, search: search.trim() || undefined });
      setInvoices(res.data?.invoices || []);
    } catch (err) {
      console.error('Failed to load invoice history', err);
      toast.error('Failed to load invoice history');
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchInvoices(historySearch);
    }
  }, [activeTab]);

  // Filter products for POS
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    return products.filter((p) => {
      // Must have approval_status === 'active'
      const isActive = (p.approval_status || 'active').toLowerCase() === 'active';
      if (!isActive) return false;
      if (!q) return true;
      return (
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    });
  }, [products, productSearch]);

  // Cart operations
  const addToCart = (product) => {
    const availableStock = parseInt(product.stock || 0, 10);
    if (availableStock <= 0) {
      toast.error(`"${product.name || product.sku}" is out of stock!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id || item.stock_code === product.sku);
      if (existing) {
        if (existing.quantity >= availableStock) {
          toast.error(`Cannot add more. Available stock is only ${availableStock}.`);
          return prev;
        }
        return prev.map((item) =>
          item === existing
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          stock_code: product.sku,
          description: product.name,
          unit_price: parseFloat(product.price || 0),
          quantity: 1,
          discount: 0,
          max_stock: availableStock,
        },
      ];
    });
    toast.success(`Added ${product.name || product.sku} to bill`);
  };

  const updateQuantity = (index, delta) => {
    setCart((prev) => {
      return prev.map((item, i) => {
        if (i !== index) return item;
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.max_stock) {
          toast.error(`Cannot exceed available stock of ${item.max_stock} units.`);
          return item;
        }
        return { ...item, quantity: newQty };
      }).filter(Boolean);
    });
  };

  const setItemDiscount = (index, disc) => {
    const val = Math.max(0, parseFloat(disc) || 0);
    setCart((prev) =>
      prev.map((item, i) => (i === index ? { ...item, discount: val } : item))
    );
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const line = Math.max(0, (item.unit_price * item.quantity) - (item.discount || 0));
      return acc + line;
    }, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Math.min(subtotal, Math.max(0, parseFloat(overallDiscount) || 0));
  }, [subtotal, overallDiscount]);

  const taxableAmount = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const taxAmount = useMemo(() => {
    const rate = Math.max(0, parseFloat(taxRate) || 0);
    return Math.round(taxableAmount * (rate / 100) * 100) / 100;
  }, [taxableAmount, taxRate]);

  const grandTotal = useMemo(() => {
    return Math.round((taxableAmount + taxAmount) * 100) / 100;
  }, [taxableAmount, taxAmount]);

  const totalItemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Handle Checkout / Generate Bill
  const handleGenerateBill = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('Please add at least one item to the cart.');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Please enter the customer name.');
      return;
    }

    // Verify stock constraints locally before sending
    for (const item of cart) {
      if (item.quantity > item.max_stock) {
        toast.error(`Quantity for "${item.description}" exceeds available stock (${item.max_stock}).`);
        return;
      }
    }

    const payload = {
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim() || undefined,
      customer_email: customerEmail.trim() || undefined,
      city: city.trim() || 'Store Counter',
      state: state.trim() || 'Retail',
      items: cart.map((item) => ({
        product_id: item.product_id,
        stock_code: item.stock_code,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount || 0,
      })),
      payment_method: paymentMethod,
      discount_applied: discountAmount,
      tax_rate: parseFloat(taxRate) || 0,
    };

    setSubmitting(true);
    try {
      const res = await billingAPI.createBill(payload);
      toast.success(`Bill Generated Successfully! Invoice #${res.data.invoice_number}`);
      
      // Open Printable Invoice Modal
      setSelectedInvoice(res.data);
      setShowInvoiceModal(true);

      // Reset cart and customer form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setOverallDiscount(0);

      // Refresh products to reflect reduced inventory
      fetchProducts();
    } catch (err) {
      console.error('Billing error', err);
      const detail = err.response?.data?.detail || 'Failed to generate bill.';
      toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const generatePrintableInvoiceHtml = (inv) => {
    if (!inv) return '';
    const dateFormatted = inv.order_date
      ? new Date(inv.order_date).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : new Date().toLocaleString('en-IN');

    const items = inv.items || [];
    const invoiceNum = inv.invoice_number || inv.order_id || 'N/A';
    const custName = inv.customer_name || (inv.customer_id ? `Customer #${inv.customer_id}` : 'Counter Customer');
    const custPhone = inv.customer_phone ? `<div><strong>Phone:</strong> ${inv.customer_phone}</div>` : '';
    const custEmail = inv.customer_email ? `<div><strong>Email:</strong> ${inv.customer_email}</div>` : '';
    const subtotal = (inv.subtotal || inv.total_amount || 0).toFixed(2);
    const discount = (inv.discount_applied || 0) > 0 ? Number(inv.discount_applied).toFixed(2) : null;
    const taxRate = inv.tax_rate || 0;
    const taxAmount = (inv.tax_amount || 0).toFixed(2);
    const grandTotal = (inv.total_amount || 0).toFixed(2);

    const rowsHtml = items.map((item, idx) => `
      <tr>
        <td style="padding: 10px 12px; border: 1px solid #e5e7eb; text-align: center; color: #4b5563;">${idx + 1}</td>
        <td style="padding: 10px 12px; border: 1px solid #e5e7eb;">
          <div style="font-weight: 600; color: #111827;">${item.description || 'Item'}</div>
          <div style="font-size: 11px; color: #6b7280; font-family: monospace;">SKU: ${item.stock_code}</div>
        </td>
        <td style="padding: 10px 12px; border: 1px solid #e5e7eb; text-align: center; font-weight: 600; color: #111827;">${item.quantity}</td>
        <td style="padding: 10px 12px; border: 1px solid #e5e7eb; text-align: right; color: #374151;">₹${Number(item.unit_price || 0).toFixed(2)}</td>
        <td style="padding: 10px 12px; border: 1px solid #e5e7eb; text-align: right; color: #059669;">${Number(item.discount || 0) > 0 ? `-₹${Number(item.discount).toFixed(2)}` : '—'}</td>
        <td style="padding: 10px 12px; border: 1px solid #e5e7eb; text-align: right; font-weight: 700; color: #111827;">₹${Number(item.line_total || (item.quantity * item.unit_price - (item.discount || 0))).toFixed(2)}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice - ${invoiceNum}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #111827;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #111827;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .company-title {
      font-size: 24px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .company-subtitle {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .invoice-tag {
      display: inline-block;
      background: #0f172a;
      color: #ffffff !important;
      font-weight: 700;
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 4px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .invoice-meta {
      text-align: right;
    }
    .meta-item {
      font-size: 12px;
      color: #475569;
      margin-top: 4px;
    }
    .meta-item strong {
      color: #0f172a;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .info-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .items-table th {
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid #cbd5e1;
      padding: 10px 12px;
    }
    .items-table td {
      border: 1px solid #e2e8f0;
    }
    .summary-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .summary-box {
      width: 280px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: #475569;
    }
    .summary-row.discount {
      color: #059669;
    }
    .summary-row.total {
      border-top: 2px solid #0f172a;
      margin-top: 8px;
      padding-top: 10px;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-title">ShopFlow POS</div>
      <div class="company-subtitle">Unified Retail, Inventory & Enterprise Management</div>
      <div class="company-subtitle">GSTIN: 27AABCS1429B1Z8 | Contact: support@shopflow.org</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-tag">Tax Invoice</div>
      <div class="meta-item" style="font-size: 14px; font-weight: 800; margin-top: 8px;">${invoiceNum}</div>
      <div class="meta-item">Date: <strong>${dateFormatted}</strong></div>
      <div class="meta-item">Location: <strong>${inv.city || 'Store Counter'}</strong></div>
    </div>
  </div>

  <div class="info-grid">
    <div>
      <div class="info-label">Customer Details (Billed To)</div>
      <div class="info-value">${custName}</div>
      ${custPhone}
      ${custEmail}
    </div>
    <div style="text-align: right;">
      <div class="info-label">Payment Information</div>
      <div class="info-value" style="color: #059669;">${inv.payment_method || 'Cash'}</div>
      <div>Payment Status: <strong>${inv.status || 'PAID'}</strong></div>
      <div>Counter Terminal: <strong>${inv.state || 'Retail POS'}</strong></div>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 40px; text-align: center;">#</th>
        <th style="text-align: left;">Item Description & SKU</th>
        <th style="width: 60px; text-align: center;">Qty</th>
        <th style="width: 90px; text-align: right;">Unit Price</th>
        <th style="width: 80px; text-align: right;">Discount</th>
        <th style="width: 100px; text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="summary-container">
    <div class="summary-box">
      <div class="summary-row">
        <span>Subtotal:</span>
        <span style="font-family: monospace; font-weight: 600;">₹${subtotal}</span>
      </div>
      ${discount ? `
      <div class="summary-row discount">
        <span>Overall Discount:</span>
        <span style="font-family: monospace; font-weight: 600;">-₹${discount}</span>
      </div>` : ''}
      <div class="summary-row">
        <span>GST / Tax (${taxRate}%):</span>
        <span style="font-family: monospace; font-weight: 600;">₹${taxAmount}</span>
      </div>
      <div class="summary-row total">
        <span>Grand Total:</span>
        <span style="font-family: monospace;">₹${grandTotal}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <div style="font-weight: 600; color: #334155; margin-bottom: 4px;">Thank you for your purchase!</div>
    <div>This is an official computer-generated receipt. Goods once sold can be returned or exchanged within 7 days.</div>
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    if (!selectedInvoice) return;

    // Use a dedicated invisible iframe to isolate the printable document with crisp light styling
    const printFrame = document.createElement('iframe');
    printFrame.name = 'invoice_print_frame';
    printFrame.style.position = 'fixed';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    printFrame.style.width = '1000px';
    printFrame.style.height = '1000px';
    printFrame.style.border = 'none';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(generatePrintableInvoiceHtml(selectedInvoice));
    frameDoc.close();

    // Trigger printing once loaded
    setTimeout(() => {
      try {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
      } catch (err) {
        console.error('Frame print failed, falling back to window.print()', err);
        window.print();
      } finally {
        setTimeout(() => {
          try {
            document.body.removeChild(printFrame);
          } catch (e) {}
        }, 4000);
      }
    }, 300);
  };

  const openInvoiceDetails = async (inv) => {
    try {
      const res = await billingAPI.getInvoice(inv.invoice_number || inv.order_id);
      setSelectedInvoice(res.data);
      setShowInvoiceModal(true);
    } catch (err) {
      // Fallback to the object we have
      setSelectedInvoice(inv);
      setShowInvoiceModal(true);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 pb-12">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          /* Reset parent modal fixed container in print preview */
          .fixed.inset-0 {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .relative.w-full.max-w-2xl {
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
          }
          #printable-invoice {
            background: #ffffff !important;
            color: #111827 !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          #printable-invoice * {
            color: #111827 !important;
            background-color: transparent !important;
            border-color: #e5e7eb !important;
            box-shadow: none !important;
            text-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-invoice th {
            background-color: #f3f4f6 !important;
            color: #111827 !important;
            font-weight: 700 !important;
          }
          #printable-invoice .font-bold, #printable-invoice strong {
            font-weight: 700 !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-white/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2 backdrop-blur-md">
            <HiOutlineSparkles className="text-sm animate-spin" style={{ animationDuration: '6s' }} />
            <span>Point of Sale & Invoicing</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Billing & POS Terminal
          </h1>
          <p className="text-zinc-400 mt-1">
            Real-time cashier checkout, automatic inventory deduction, customer linking, and printable tax invoices.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-zinc-900/90 border border-white/10 p-1.5 rounded-2xl backdrop-blur-xl">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <HiOutlineShoppingCart size={18} />
            <span>POS / New Bill</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <HiOutlineClock size={18} />
            <span>Invoice History</span>
          </button>
        </div>
      </header>

      {/* ──────────────── TAB 1: POS / NEW BILL ──────────────── */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Product Catalog & Search (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="p-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <HiOutlineCube size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Active Product Catalog</h2>
                    <p className="text-xs text-zinc-400">
                      Approved items in inventory available for checkout
                    </p>
                  </div>
                </div>

                <button
                  onClick={fetchProducts}
                  title="Refresh stock"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white text-xs font-medium transition cursor-pointer self-start sm:self-auto"
                >
                  <HiOutlineArrowPath className={loadingProducts ? 'animate-spin' : ''} />
                  <span>Sync Stock</span>
                </button>
              </div>

              {/* Product Search Bar */}
              <div className="relative mb-4">
                <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search active products by SKU, name, or category..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-white/10 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Product List Cards */}
              {loadingProducts ? (
                <div className="py-16 text-center text-zinc-400">
                  <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto mb-3" />
                  <p className="text-sm">Loading available inventory items...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <HiOutlineCube size={40} className="mx-auto mb-2 opacity-40 text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-400">No active products found.</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Products must have approval status "active" to be sold.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
                  {filteredProducts.map((prod) => {
                    const stock = parseInt(prod.stock || 0, 10);
                    const isOutOfStock = stock <= 0;
                    const inCart = cart.find(
                      (item) => item.product_id === prod.id || item.stock_code === prod.sku
                    );
                    const qtyInCart = inCart ? inCart.quantity : 0;
                    const remainingStock = Math.max(0, stock - qtyInCart);

                    return (
                      <div
                        key={prod.id || prod.sku}
                        className={`group relative p-4 rounded-xl border transition flex flex-col justify-between ${
                          isOutOfStock
                            ? 'bg-zinc-900/30 border-white/5 opacity-60'
                            : 'bg-zinc-900/70 hover:bg-zinc-800/80 border-white/10 hover:border-cyan-500/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <span className="font-mono text-[11px] font-semibold tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded-md">
                              SKU: {prod.sku}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                isOutOfStock
                                  ? 'bg-rose-950/70 text-rose-400 border border-rose-800/50'
                                  : stock <= 5
                                  ? 'bg-amber-950/70 text-amber-400 border border-amber-800/50'
                                  : 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                              }`}
                            >
                              {isOutOfStock
                                ? 'Out of Stock'
                                : `${stock} in stock`}
                            </span>
                          </div>

                          <h3 className="font-semibold text-zinc-100 text-sm line-clamp-2 mb-2 group-hover:text-cyan-300 transition">
                            {prod.name}
                          </h3>
                        </div>

                        <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-xs text-zinc-400">Unit Price</span>
                            <div className="text-base font-extrabold text-white flex items-center">
                              ₹{parseFloat(prod.price || 0).toFixed(2)}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isOutOfStock || remainingStock <= 0}
                            onClick={() => addToCart(prod)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 cursor-pointer ${
                              isOutOfStock || remainingStock <= 0
                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20'
                            }`}
                          >
                            <HiOutlinePlus size={14} />
                            <span>
                              {remainingStock <= 0 && !isOutOfStock
                                ? 'Max in Cart'
                                : inCart
                                ? `Add (${qtyInCart})`
                                : 'Add to Bill'}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT COLUMN: POS Cart, Customer Details, & Checkout (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Cart Box */}
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    <HiOutlineShoppingCart size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Current Cart</h2>
                    <span className="text-xs text-zinc-400 font-mono">
                      {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} selected
                    </span>
                  </div>
                </div>

                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-zinc-400 hover:text-rose-400 transition flex items-center gap-1 cursor-pointer"
                  >
                    <HiOutlineTrash size={14} />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div className="py-10 text-center text-zinc-500 border border-dashed border-white/10 rounded-xl my-2">
                  <HiOutlineShoppingCart size={36} className="mx-auto mb-2 opacity-30 text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-400">Cart is empty</p>
                  <p className="text-xs text-zinc-500 mt-1">Select items from the catalog on the left to bill.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 mb-4">
                  {cart.map((item, index) => {
                    const lineTotal = Math.max(0, (item.unit_price * item.quantity) - (item.discount || 0));
                    return (
                      <div
                        key={item.stock_code + index}
                        className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-800/40">
                              {item.stock_code}
                            </span>
                            <h4 className="text-xs font-semibold text-zinc-200 truncate mt-1">
                              {item.description}
                            </h4>
                            <div className="text-[11px] text-zinc-400">
                              ₹{item.unit_price.toFixed(2)} / unit
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-bold text-white">
                              ₹{lineTotal.toFixed(2)}
                            </div>
                            <button
                              onClick={() => removeFromCart(index)}
                              className="text-zinc-500 hover:text-rose-400 text-xs p-1 transition cursor-pointer"
                              title="Remove item"
                            >
                              <HiOutlineTrash size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Quantity and Discount row */}
                        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
                          {/* Qty +/- */}
                          <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded-lg border border-white/10">
                            <button
                              type="button"
                              onClick={() => updateQuantity(index, -1)}
                              className="w-5 h-5 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                            >
                              <HiOutlineMinus size={10} />
                            </button>
                            <span className="w-7 text-center font-bold text-white text-xs">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={item.quantity >= item.max_stock}
                              onClick={() => updateQuantity(index, 1)}
                              className={`w-5 h-5 flex items-center justify-center rounded transition ${
                                item.quantity >= item.max_stock
                                  ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer'
                              }`}
                            >
                              <HiOutlinePlus size={10} />
                            </button>
                          </div>

                          {/* Line Discount */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-zinc-400">Item Disc ₹:</span>
                            <input
                              type="number"
                              min="0"
                              max={item.unit_price * item.quantity}
                              value={item.discount || ''}
                              onChange={(e) => setItemDiscount(index, e.target.value)}
                              placeholder="0"
                              className="w-16 px-1.5 py-0.5 bg-zinc-950 border border-white/10 rounded text-right text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Customer Details Form */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <HiOutlineUser className="text-cyan-400" />
                    <span>Customer Details</span>
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Auto CRM Match / Create
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Customer Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3 py-1.5 bg-zinc-900/90 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-1.5 bg-zinc-900/90 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="e.g. ramesh@example.com"
                      className="w-full px-3 py-1.5 bg-zinc-900/90 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Location / City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Store Counter"
                      className="w-full px-3 py-1.5 bg-zinc-900/90 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment & Tax Selection */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900/90 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      GST / Tax Rate
                    </label>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                      className="w-full px-3 py-1.5 bg-zinc-900/90 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      <option value={0}>0% (Tax Exempt)</option>
                      <option value={5}>5% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={18}>18% GST (Standard)</option>
                      <option value={28}>28% GST</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Bill Discount (₹):</span>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={overallDiscount || ''}
                    onChange={(e) => setOverallDiscount(e.target.value)}
                    placeholder="0"
                    className="w-24 px-2 py-1 bg-zinc-900 border border-white/10 rounded-lg text-right text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Price Breakdown & Totals */}
              <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 bg-zinc-950/60 p-3 rounded-xl border">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-zinc-200">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400">
                    <span>Discount</span>
                    <span className="font-mono">- ₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Tax / GST ({taxRate}%)</span>
                  <span className="font-mono text-zinc-200">₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-white/10">
                  <span>Grand Total</span>
                  <span className="font-mono text-base text-cyan-400">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Generate Bill Button */}
              <button
                type="button"
                disabled={submitting || cart.length === 0}
                onClick={handleGenerateBill}
                className={`w-full mt-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-xl cursor-pointer active:scale-98 ${
                  submitting || cart.length === 0
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-extrabold shadow-emerald-500/20'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-zinc-950 border-t-transparent animate-spin" />
                    <span>Processing Sale & Deducting Stock...</span>
                  </>
                ) : (
                  <>
                    <HiOutlineCheckCircle size={20} />
                    <span>Generate Bill & Deduct Stock</span>
                  </>
                )}
              </button>
            </Card>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: INVOICE HISTORY ──────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <HiOutlineReceiptPercent className="text-cyan-400" size={20} />
                  <span>Sales Invoices History</span>
                </h2>
                <p className="text-xs text-zinc-400">
                  All transactional receipts generated through POS and central billing ledger
                </p>
              </div>

              {/* Search in history */}
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-72">
                  <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchInvoices(historySearch)}
                    placeholder="Search by invoice # or customer..."
                    className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  onClick={() => fetchInvoices(historySearch)}
                  className="px-3.5 py-2 bg-zinc-900 border border-white/10 hover:border-cyan-500 rounded-xl text-xs font-semibold text-zinc-200 transition cursor-pointer"
                >
                  Search
                </button>
              </div>
            </div>

            {loadingInvoices ? (
              <div className="py-20 text-center text-zinc-400">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto mb-3" />
                <p className="text-sm">Loading invoices...</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="py-16 text-center text-zinc-500">
                <HiOutlineReceiptPercent size={44} className="mx-auto mb-2 opacity-30 text-zinc-400" />
                <p className="text-sm font-medium text-zinc-300">No invoices recorded yet</p>
                <p className="text-xs text-zinc-500 mt-1">Generate your first bill in the POS tab to see receipts here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-wider text-[11px] border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Invoice #</th>
                      <th className="py-3 px-4 font-semibold">Date & Time</th>
                      <th className="py-3 px-4 font-semibold">Customer</th>
                      <th className="py-3 px-4 font-semibold">Items</th>
                      <th className="py-3 px-4 font-semibold">Payment Mode</th>
                      <th className="py-3 px-4 font-semibold">Total Amount</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {invoices.map((inv) => {
                      const dateFormatted = inv.order_date
                        ? new Date(inv.order_date).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '—';

                      return (
                        <tr key={inv.order_id || inv.invoice_number} className="hover:bg-zinc-900/50 transition">
                          <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                            {inv.invoice_number || inv.order_id}
                          </td>
                          <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                            {dateFormatted}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-zinc-200">
                              {inv.customer_name || `Customer #${inv.customer_id}`}
                            </div>
                            {inv.customer_phone && (
                              <div className="text-[10px] text-zinc-500">{inv.customer_phone}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {inv.total_items || (inv.items ? inv.items.length : 1)} items
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-white/10">
                              {inv.payment_method || 'Cash'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-extrabold text-white text-sm">
                            ₹{(inv.total_amount || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-800/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {inv.status || 'Completed'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => openInvoiceDetails(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-zinc-300 transition text-xs font-semibold cursor-pointer border border-white/10"
                            >
                              <HiOutlinePrinter size={14} />
                              <span>View / Print</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ──────────────── MODAL: PRINTABLE TAX INVOICE ──────────────── */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Actions Bar (hidden when printing) */}
            <div className="no-print p-4 bg-zinc-900/90 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <HiOutlinePrinter className="text-cyan-400" size={18} />
                <span>Tax Invoice Receipt</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-500/25 cursor-pointer"
                >
                  <HiOutlinePrinter size={16} />
                  <span>Print Receipt / PDF</span>
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800/80 transition cursor-pointer"
                >
                  <HiOutlineXMark size={18} />
                </button>
              </div>
            </div>

            {/* Printable Content Area */}
            <div id="printable-invoice" className="p-6 overflow-y-auto space-y-6 text-zinc-200 text-xs bg-zinc-950">
              
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b border-white/10 pb-4">
                <div>
                  <div className="text-lg font-black tracking-tight text-white uppercase">ShopFlow CRM</div>
                  <div className="text-[11px] text-zinc-400">Unified Retail & Enterprise POS</div>
                  <div className="text-[11px] text-zinc-400">GSTIN: 27AABCS1429B1Z8</div>
                  <div className="text-[11px] text-zinc-400">Contact: support@shopflow.org | +91 98765 00000</div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono font-bold text-xs">
                    TAX INVOICE
                  </span>
                  <div className="mt-1 font-mono text-xs font-bold text-white">
                    {selectedInvoice.invoice_number || selectedInvoice.order_id}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Date: {selectedInvoice.order_date ? new Date(selectedInvoice.order_date).toLocaleString('en-IN') : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Bill To Info */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Billed To (Customer):</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {selectedInvoice.customer_name || `Customer #${selectedInvoice.customer_id}`}
                  </div>
                  {selectedInvoice.customer_phone && (
                    <div className="text-[11px] text-zinc-300">Phone: {selectedInvoice.customer_phone}</div>
                  )}
                  {selectedInvoice.customer_email && (
                    <div className="text-[11px] text-zinc-300">Email: {selectedInvoice.customer_email}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-zinc-400 uppercase font-semibold">Payment Details:</div>
                  <div className="text-xs font-bold text-emerald-400 mt-0.5">
                    Method: {selectedInvoice.payment_method || 'Cash'}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Status: <span className="text-emerald-400 font-semibold">{selectedInvoice.status || 'PAID'}</span>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Counter: {selectedInvoice.city || 'Store Counter'}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-zinc-900 text-zinc-400 text-[10px] uppercase font-bold border-b border-white/10">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">SKU / Item</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Discount</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(selectedInvoice.items || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/30">
                        <td className="py-2 px-3 text-zinc-500">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-white">{item.description}</div>
                          <div className="text-[10px] text-cyan-400 font-mono">SKU: {item.stock_code}</div>
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-white">{item.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono text-zinc-300">₹{item.unit_price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-400">
                          {item.discount > 0 ? `-₹${item.discount.toFixed(2)}` : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-white">
                          ₹{item.line_total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-white">₹{(selectedInvoice.subtotal || selectedInvoice.total_amount || 0).toFixed(2)}</span>
                  </div>
                  {selectedInvoice.discount_applied > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Overall Discount:</span>
                      <span className="font-mono">- ₹{selectedInvoice.discount_applied.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-400">
                    <span>GST / Tax ({selectedInvoice.tax_rate || 0}%):</span>
                    <span className="font-mono text-white">₹{(selectedInvoice.tax_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-white/20">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base text-cyan-400">₹{(selectedInvoice.total_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="pt-4 border-t border-white/10 text-center text-[10px] text-zinc-500 space-y-1">
                <p className="text-zinc-400 font-semibold">Thank you for your business!</p>
                <p>This is a computer-generated tax invoice. Goods once sold are eligible for return within 7 days.</p>
              </div>
            </div>

            {/* Modal Bottom Close Button (no-print) */}
            <div className="no-print p-3 bg-zinc-900 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
