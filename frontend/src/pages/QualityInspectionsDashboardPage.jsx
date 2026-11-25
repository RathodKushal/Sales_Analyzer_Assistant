import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, StatCard } from '../components/UI';
import {
  HiOutlineShieldCheck,
  HiOutlineCheckBadge,
  HiOutlineExclamationTriangle,
  HiOutlineArrowUturnLeft,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClipboardDocumentCheck,
  HiOutlineWrenchScrewdriver,
  HiOutlineTrash,
  HiOutlineArrowTrendingDown,
  HiOutlineBuildingOffice2,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

export default function QualityInspectionsDashboardPage() {
  const [activeTab, setActiveTab] = useState('inbound');
  const [searchTerm, setSearchTerm] = useState('');

  // Inbound Batch Inspections
  const [inboundBatches, setInboundBatches] = useState([
    {
      inspectionId: 'QA-2026-088',
      poRef: 'PO-2026-104',
      batchLot: 'LOT-APX-8801',
      manufacturer: 'Apex Electronics OEM Ltd.',
      sku: 'SKU-COMP-204',
      productName: 'Ergonomic Mechanical Keyboard RGB',
      sampleSize: 30,
      defectsFound: 0,
      defectRate: '0.0%',
      result: 'passed',
      inspector: 'Vikram S. (Lead QA)',
      inspectionDate: 'Nov 01, 2026',
    },
    {
      inspectionId: 'QA-2026-089',
      poRef: 'PO-2026-104',
      batchLot: 'LOT-APX-8802',
      manufacturer: 'Apex Electronics OEM Ltd.',
      sku: 'SKU-WEAR-109',
      productName: 'Smart Fitness Tracker IP68 AMOLED',
      sampleSize: 40,
      defectsFound: 2,
      defectRate: '5.0%',
      result: 'conditional',
      inspector: 'Deepika R. (Senior QA)',
      inspectionDate: 'Oct 31, 2026',
    },
    {
      inspectionId: 'QA-2026-090',
      poRef: 'PO-2026-107',
      batchLot: 'LOT-VLT-1104',
      manufacturer: 'VoltFast Technologies',
      sku: 'SKU-POW-550',
      productName: 'Fast-Charging GaN 65W Power Adapter',
      sampleSize: 50,
      defectsFound: 0,
      defectRate: '0.0%',
      result: 'passed',
      inspector: 'Vikram S. (Lead QA)',
      inspectionDate: 'Oct 29, 2026',
    },
    {
      inspectionId: 'QA-2026-091',
      poRef: 'PO-2026-103',
      batchLot: 'LOT-CYB-3320',
      manufacturer: 'CyberPeripherals Corp.',
      sku: 'SKU-AUDIO-802',
      productName: 'Ultra-Bass Portable Bluetooth Speaker 20W',
      sampleSize: 25,
      defectsFound: 4,
      defectRate: '16.0%',
      result: 'failed',
      inspector: 'Deepika R. (Senior QA)',
      inspectionDate: 'Oct 26, 2026',
    },
  ]);

  // Return Inspections & Disposition
  const [returnInspections, setReturnInspections] = useState([
    {
      returnId: 'RET-4912',
      orderId: 'ORD-9810',
      customer: 'Suresh Menon',
      productName: 'Acoustic Active Noise-Cancelling Headphones',
      reasonReported: 'Buzzing audio in left ear cup',
      qaFinding: 'Driver coil loose solder - Manufacturing defect',
      disposition: 'claim_mfr',
      status: 'Claim Issued',
      actionDate: 'Today, 11:30 AM',
    },
    {
      returnId: 'RET-4913',
      orderId: 'ORD-9818',
      customer: 'Ananya Roy',
      productName: 'Ergonomic Mechanical Keyboard RGB',
      reasonReported: 'Color did not match expectations',
      qaFinding: 'Seals intact, pristine cosmetic condition, 100% operational',
      disposition: 'restock',
      status: 'Restocked to WH-01',
      actionDate: 'Today, 09:15 AM',
    },
    {
      returnId: 'RET-4914',
      orderId: 'ORD-9822',
      customer: 'Kunal Verma',
      productName: 'Fast-Charging GaN 65W Power Adapter',
      reasonReported: 'Package crushed during delivery',
      qaFinding: 'Pin bent from courier transit impact',
      disposition: 'scrap',
      status: 'Scrap Documented',
      actionDate: 'Yesterday',
    },
    {
      returnId: 'RET-4915',
      orderId: 'ORD-9829',
      customer: 'Pooja Hegde',
      productName: 'Smart Fitness Tracker IP68 AMOLED',
      reasonReported: 'Strap clasp popped loose',
      qaFinding: 'Spring pin detached, easily reconditioned with OEM spare pin',
      disposition: 'refurbish',
      status: 'Queued for Refurbish',
      actionDate: 'Oct 30, 2026',
    },
  ]);

  const [showLogModal, setShowLogModal] = useState(false);
  const [newInspection, setNewInspection] = useState({
    poRef: 'PO-2026-104',
    batchLot: '',
    manufacturer: 'Apex Electronics OEM Ltd.',
    sku: 'SKU-ELEC-401',
    productName: 'Acoustic Active Noise-Cancelling Headphones',
    sampleSize: '30',
    defectsFound: '0',
    result: 'passed',
  });

  const handleCreateInspection = (e) => {
    e.preventDefault();
    const sample = parseInt(newInspection.sampleSize, 10) || 30;
    const defects = parseInt(newInspection.defectsFound, 10) || 0;
    const rate = ((defects / sample) * 100).toFixed(1) + '%';
    const inspId = `QA-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newRec = {
      inspectionId: inspId,
      poRef: newInspection.poRef,
      batchLot: newInspection.batchLot || 'LOT-AUTO-2026',
      manufacturer: newInspection.manufacturer,
      sku: newInspection.sku,
      productName: newInspection.productName,
      sampleSize: sample,
      defectsFound: defects,
      defectRate: rate,
      result: newInspection.result,
      inspector: 'QA Station #1',
      inspectionDate: 'Just now',
    };

    setInboundBatches([newRec, ...inboundBatches]);
    setShowLogModal(false);
    toast.success(`Batch Inspection ${inspId} saved with result: ${newRec.result.toUpperCase()}!`);
  };

  const handleUpdateDisposition = (returnId, newDisp) => {
    setReturnInspections((prev) =>
      prev.map((r) =>
        r.returnId === returnId
          ? {
              ...r,
              disposition: newDisp,
              status:
                newDisp === 'restock'
                  ? 'Restocked to WH-01'
                  : newDisp === 'claim_mfr'
                  ? 'Warranty Claim Issued'
                  : newDisp === 'refurbish'
                  ? 'Sent to Refurb Lab'
                  : 'Scrapped & Logged',
            }
          : r
      )
    );
    toast.success(`Updated disposition for ${returnId} to: ${newDisp.toUpperCase()}`);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950/70 via-pink-950/40 to-zinc-950/80 p-8 border border-rose-500/20 backdrop-blur-2xl shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                QUALITY ASSURANCE & INSPECTION LAB
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                Standard: ISO-9001:2015 Compliant
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Inbound Batch Quality Control & Return Inspections
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
              Inspect incoming factory production lots, certify compliance tolerances, categorize customer returned items, and assign authoritative dispositions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLogModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2 cursor-pointer"
            >
              <HiOutlinePlus size={16} />
              Log Batch Inspection
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total Batches Certified"
          value={inboundBatches.length}
          trend={10.2}
          icon={<HiOutlineShieldCheck size={22} className="text-rose-400" />}
        />
        <StatCard
          label="First-Time Pass Rate"
          value="97.4%"
          trend={1.2}
          icon={<HiOutlineCheckBadge size={22} className="text-emerald-400" />}
        />
        <StatCard
          label="Return Dispositions Processed"
          value={returnInspections.length}
          trend={18.0}
          icon={<HiOutlineArrowUturnLeft size={22} className="text-cyan-400" />}
        />
        <StatCard
          label="Manufacturer Warranty Claims"
          value={
            returnInspections.filter((r) => r.disposition === 'claim_mfr').length
          }
          trend={-5.4}
          icon={<HiOutlineBuildingOffice2 size={22} className="text-amber-400" />}
        />
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('inbound')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'inbound'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <HiOutlineShieldCheck size={16} />
          Inbound Production Lot Inspections ({inboundBatches.length})
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'returns'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <HiOutlineArrowUturnLeft size={16} />
          Return Inspections & Disposition ({returnInspections.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-lg shadow-rose-500/10'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <HiOutlineExclamationTriangle size={16} />
          Defect Root-Cause Breakdown
        </button>
      </div>

      {/* Tab 1: Inbound Batch Quality Checks */}
      {activeTab === 'inbound' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HiOutlineShieldCheck className="text-rose-400" />
                Inbound Shipment Batch Inspection Logs
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Randomized statistical sampling on arrived factory batches prior to warehouse binning.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Inspection ID</th>
                  <th className="py-3 px-4">PO & Batch Lot</th>
                  <th className="py-3 px-4">Product & Manufacturer</th>
                  <th className="py-3 px-4">Sample Size</th>
                  <th className="py-3 px-4">Defects</th>
                  <th className="py-3 px-4">Defect Rate</th>
                  <th className="py-3 px-4">QA Decision</th>
                  <th className="py-3 px-4">Lead Inspector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {inboundBatches.map((item) => (
                  <tr
                    key={item.inspectionId}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-400">
                      {item.inspectionId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-200">
                        {item.poRef}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400">
                        {item.batchLot}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-200">
                        {item.productName}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {item.manufacturer}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300">
                      {item.sampleSize} units
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {item.defectsFound} units
                    </td>
                    <td
                      className={`py-3.5 px-4 font-mono font-bold ${
                        item.defectsFound > 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {item.defectRate}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.result === 'passed' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <HiOutlineCheckCircle /> PASSED
                        </span>
                      )}
                      {item.result === 'conditional' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
                          CONDITIONAL
                        </span>
                      )}
                      {item.result === 'failed' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
                          <HiOutlineXCircle /> QUARANTINED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono">
                      {item.inspector}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Return Quality Inspections & Disposition */}
      {activeTab === 'returns' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HiOutlineArrowUturnLeft className="text-rose-400" />
                Customer Return Diagnostics & Disposition Routing
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Physical examination of RMA items to determine restock, refurbish, manufacturer warranty claim, or scrap.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Return ID</th>
                  <th className="py-3 px-4">Customer & Product</th>
                  <th className="py-3 px-4">Customer Stated Reason</th>
                  <th className="py-3 px-4">QA Technical Finding</th>
                  <th className="py-3 px-4">Disposition Action</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Route Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {returnInspections.map((ret) => (
                  <tr
                    key={ret.returnId}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-400">
                      {ret.returnId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-200">
                        {ret.productName}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {ret.customer} &bull; {ret.orderId}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      "{ret.reasonReported}"
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 font-medium">
                      {ret.qaFinding}
                    </td>
                    <td className="py-3.5 px-4">
                      {ret.disposition === 'claim_mfr' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Claim Mfr. Warranty
                        </span>
                      )}
                      {ret.disposition === 'restock' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Restock to Inventory
                        </span>
                      )}
                      {ret.disposition === 'refurbish' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Refurbish Lab
                        </span>
                      )}
                      {ret.disposition === 'scrap' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Scrap / Write-off
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                      {ret.status}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={ret.disposition}
                        onChange={(e) =>
                          handleUpdateDisposition(ret.returnId, e.target.value)
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
                      >
                        <option value="restock">Restock</option>
                        <option value="refurbish">Refurbish</option>
                        <option value="claim_mfr">Claim Mfr</option>
                        <option value="scrap">Scrap</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Defect Analytics */}
      {activeTab === 'analytics' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <HiOutlineExclamationTriangle className="text-rose-400" />
                Defect Failure Mode & Root Cause Distribution
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Aggregated breakdown of manufacturing anomalies, transit damages, and component faults.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span>Manufacturing / Solder Anomaly</span>
                <span className="font-bold text-white">44%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '44%' }} />
              </div>
              <p className="text-[11px] text-zinc-400">
                Primary fault: loose speaker coil and dry solder on USB connector ports.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span>Courier & Logistics Impact</span>
                <span className="font-bold text-white">32%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '32%' }} />
              </div>
              <p className="text-[11px] text-zinc-400">
                Primary fault: crushed outer retail packaging, fractured internal clamshells.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/50 border border-white/10 space-y-3">
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span>No Fault Found / Buyer Remorse</span>
                <span className="font-bold text-white">24%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '24%' }} />
              </div>
              <p className="text-[11px] text-zinc-400">
                Unit operates at 100% specification; immediately restocked into live inventory.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Log Batch Modal */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg p-6 rounded-2xl bg-zinc-950 border border-rose-500/30 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <HiOutlineShieldCheck className="text-rose-400" />
                  Log Inbound Batch Quality Inspection
                </h3>
                <button
                  onClick={() => setShowLogModal(false)}
                  className="text-zinc-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateInspection} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">PO Reference *</label>
                    <input
                      type="text"
                      required
                      value={newInspection.poRef}
                      onChange={(e) =>
                        setNewInspection({ ...newInspection, poRef: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Batch / Lot Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LOT-2026-X9"
                      value={newInspection.batchLot}
                      onChange={(e) =>
                        setNewInspection({ ...newInspection, batchLot: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Manufacturer *</label>
                  <input
                    type="text"
                    required
                    value={newInspection.manufacturer}
                    onChange={(e) =>
                      setNewInspection({
                        ...newInspection,
                        manufacturer: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-400 mb-1">Sample Inspected</label>
                    <input
                      type="number"
                      required
                      value={newInspection.sampleSize}
                      onChange={(e) =>
                        setNewInspection({
                          ...newInspection,
                          sampleSize: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">Defects Found</label>
                    <input
                      type="number"
                      required
                      value={newInspection.defectsFound}
                      onChange={(e) =>
                        setNewInspection({
                          ...newInspection,
                          defectsFound: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">QA Decision</label>
                    <select
                      value={newInspection.result}
                      onChange={(e) =>
                        setNewInspection({ ...newInspection, result: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="passed">Passed</option>
                      <option value="conditional">Conditional</option>
                      <option value="failed">Quarantined</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLogModal(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold transition"
                  >
                    Certify Batch Inspection
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

