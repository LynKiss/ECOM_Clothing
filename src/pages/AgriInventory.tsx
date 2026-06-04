import { useState, useMemo, useCallback, type JSX } from 'react';
import {
  applyFifoIssue,
  fifoIssue,
  formatDate,
  formatVND,
  getBatchStatus,
  getDaysToExpiry,
  runAllTests,
  weightedAvgCost,
  writeOffBatch,
  type Batch,
  type BatchStatus,
  type GoodsIssue,
  type GoodsReceipt,
  type PriceReduction,
  type WriteOff,
} from '../lib/agri-fifo';

// ─── Seed data ────────────────────────────────────────────────────────────────
const TODAY = '2025-05-14';

const INITIAL_BATCHES: Batch[] = [
  {
    batchId: 'b1', batchCode: 'L001-NPK', productId: 'p1', productName: 'Phân bón NPK 16-16-8',
    unit: 'kg', receivedDate: '2025-01-10', expiryDate: '2025-12-31',
    initialQty: 500, remainingQty: 320, unitCost: 12000,
    warehouseSection: 'Kho A – Dãy 1', supplier: 'Công ty Phân bón Miền Nam', notes: 'Lô đầu năm',
  },
  {
    batchId: 'b2', batchCode: 'L002-NPK', productId: 'p1', productName: 'Phân bón NPK 16-16-8',
    unit: 'kg', receivedDate: '2025-03-15', expiryDate: '2026-03-15',
    initialQty: 300, remainingQty: 300, unitCost: 13500,
    warehouseSection: 'Kho A – Dãy 2', supplier: 'Công ty Phân bón Miền Nam', notes: '',
  },
  {
    batchId: 'b3', batchCode: 'L003-NPK', productId: 'p1', productName: 'Phân bón NPK 16-16-8',
    unit: 'kg', receivedDate: '2025-05-01', expiryDate: '2025-05-20',
    initialQty: 80, remainingQty: 80, unitCost: 10500,
    warehouseSection: 'Kho A – Dãy 1', supplier: 'Đại lý XYZ', notes: 'Giá thấp – gần hết hạn, ưu tiên xuất trước',
  },
  {
    batchId: 'b4', batchCode: 'L001-TTS', productId: 'p2', productName: 'Thuốc trừ sâu Regent 800WG',
    unit: 'gói', receivedDate: '2025-02-01', expiryDate: '2025-05-10',
    initialQty: 60, remainingQty: 40, unitCost: 45000,
    warehouseSection: 'Kho B – Tủ khóa', supplier: 'Bayer Việt Nam', notes: '',
  },
  {
    batchId: 'b5', batchCode: 'L002-TTS', productId: 'p2', productName: 'Thuốc trừ sâu Regent 800WG',
    unit: 'gói', receivedDate: '2025-04-10', expiryDate: '2026-04-10',
    initialQty: 100, remainingQty: 100, unitCost: 48000,
    warehouseSection: 'Kho B – Tủ khóa', supplier: 'Bayer Việt Nam', notes: 'Lô mới nhập',
  },
  {
    batchId: 'b6', batchCode: 'L001-HG', productId: 'p3', productName: 'Hạt giống lúa OM5451',
    unit: 'kg', receivedDate: '2025-03-01', expiryDate: '2025-09-01',
    initialQty: 200, remainingQty: 200, unitCost: 25000,
    warehouseSection: 'Kho C – Mát', supplier: 'Vinaseed', notes: '',
  },
  {
    batchId: 'b7', batchCode: 'L001-VOI', productId: 'p4', productName: 'Vôi bột nông nghiệp',
    unit: 'kg', receivedDate: '2025-01-05', expiryDate: '2026-01-05',
    initialQty: 1000, remainingQty: 750, unitCost: 2500,
    warehouseSection: 'Kho D', supplier: 'HTX Nông nghiệp An Giang', notes: '',
  },
  {
    batchId: 'b8', batchCode: 'L002-VOI', productId: 'p4', productName: 'Vôi bột nông nghiệp',
    unit: 'kg', receivedDate: '2025-04-01', expiryDate: '2026-04-01',
    initialQty: 500, remainingQty: 500, unitCost: 2800,
    warehouseSection: 'Kho D', supplier: 'HTX Nông nghiệp An Giang', notes: 'Giá tăng nhẹ do vận chuyển',
  },
  {
    batchId: 'b9', batchCode: 'L001-PHU', productId: 'p5', productName: 'Phân hữu cơ vi sinh',
    unit: 'bao (25kg)', receivedDate: '2025-02-20', expiryDate: '2025-05-18',
    initialQty: 50, remainingQty: 30, unitCost: 85000,
    warehouseSection: 'Kho A – Dãy 3', supplier: 'Công ty Vedan', notes: 'Sắp hết hạn – ưu tiên bán',
  },
];

// Unique products
const PRODUCTS = [
  { productId: 'p1', productName: 'Phân bón NPK 16-16-8', unit: 'kg' },
  { productId: 'p2', productName: 'Thuốc trừ sâu Regent 800WG', unit: 'gói' },
  { productId: 'p3', productName: 'Hạt giống lúa OM5451', unit: 'kg' },
  { productId: 'p4', productName: 'Vôi bột nông nghiệp', unit: 'kg' },
  { productId: 'p5', productName: 'Phân hữu cơ vi sinh', unit: 'bao (25kg)' },
];

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<BatchStatus, { label: string; bg: string; text: string; dot: string }> = {
  active:        { label: 'Bình thường',    bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
  expiring_soon: { label: 'Sắp hết hạn',   bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500'   },
  critical:      { label: 'Hết hạn < 7 ngày', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  expired:       { label: 'Đã hết hạn',    bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500'     },
  depleted:      { label: 'Hết hàng',      bg: 'bg-gray-100',    text: 'text-gray-500',    dot: 'bg-gray-400'    },
};

function StatusBadge({ status }: { status: BatchStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const TABS = [
  { id: 'dashboard', label: '📊 Tổng quan' },
  { id: 'receipt',   label: '📥 Nhập hàng' },
  { id: 'issue',     label: '📤 Xuất FIFO' },
  { id: 'batches',   label: '📦 Lô hàng' },
  { id: 'expiry',    label: '⚠️ Hết hạn' },
  { id: 'reports',   label: '📈 Báo cáo' },
  { id: 'tests',     label: '🧪 Kiểm thử' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AgriInventory() {
  const [tab, setTab] = useState('dashboard');
  const [batches, setBatches] = useState<Batch[]>(INITIAL_BATCHES);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [issues, setIssues] = useState<GoodsIssue[]>([]);
  const [writeOffs, setWriteOffs] = useState<WriteOff[]>([]);
  const [priceReductions, setPriceReductions] = useState<PriceReduction[]>([]);

  // ── Receipt form state ──
  const [rfProductId, setRfProductId] = useState('p1');
  const [rfBatchCode, setRfBatchCode] = useState('');
  const [rfReceivedDate, setRfReceivedDate] = useState(TODAY);
  const [rfExpiryDate, setRfExpiryDate] = useState('');
  const [rfQty, setRfQty] = useState('');
  const [rfUnitCost, setRfUnitCost] = useState('');
  const [rfSupplier, setRfSupplier] = useState('');
  const [rfSection, setRfSection] = useState('');
  const [rfNotes, setRfNotes] = useState('');

  // ── Issue form state ──
  const [ifProductId, setIfProductId] = useState('p1');
  const [ifQty, setIfQty] = useState('');
  const [ifPurpose, setIfPurpose] = useState('');
  const [ifNotes, setIfNotes] = useState('');
  const [fifoPreview, setFifoPreview] = useState<ReturnType<typeof fifoIssue> | null>(null);

  // ── Expiry action state ──
  const [woConfirmId, setWoConfirmId] = useState<string | null>(null);
  const [woReason, setWoReason] = useState<WriteOff['reason']>('expired');
  const [woNotes, setWoNotes] = useState('');
  const [prBatchId, setPrBatchId] = useState<string | null>(null);
  const [prNewPrice, setPrNewPrice] = useState('');
  const [prNotes, setPrNotes] = useState('');

  // ── Tests ──
  const [testResults, setTestResults] = useState<ReturnType<typeof runAllTests> | null>(null);

  const todayDate = new Date(TODAY);

  // Derived
  const enrichedBatches = useMemo(() =>
    batches.map((b) => ({ ...b, status: getBatchStatus(b, todayDate) })),
  [batches]);

  const expiringBatches = useMemo(() =>
    enrichedBatches.filter((b) => b.status === 'expiring_soon' || b.status === 'critical'),
  [enrichedBatches]);

  const expiredBatches = useMemo(() =>
    enrichedBatches.filter((b) => b.status === 'expired' && b.remainingQty > 0),
  [enrichedBatches]);

  const totalStockValue = useMemo(() =>
    batches.reduce((s, b) => s + b.remainingQty * b.unitCost, 0),
  [batches]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleReceipt = useCallback(() => {
    const qty = Number(rfQty);
    const unitCost = Number(rfUnitCost);
    if (!rfBatchCode || qty <= 0 || unitCost <= 0 || !rfExpiryDate) {
      alert('Vui lòng điền đầy đủ: Số lô, Số lượng, Đơn giá, Hạn sử dụng');
      return;
    }
    const product = PRODUCTS.find((p) => p.productId === rfProductId)!;
    const newBatch: Batch = {
      batchId: genId('b'),
      batchCode: rfBatchCode,
      productId: rfProductId,
      productName: product.productName,
      unit: product.unit,
      receivedDate: rfReceivedDate,
      expiryDate: rfExpiryDate,
      initialQty: qty,
      remainingQty: qty,
      unitCost,
      warehouseSection: rfSection || 'Chưa phân vị trí',
      supplier: rfSupplier || 'Chưa rõ',
      notes: rfNotes,
    };
    const receipt: GoodsReceipt = {
      receiptId: genId('r'),
      receiptDate: rfReceivedDate,
      batchId: newBatch.batchId,
      batchCode: rfBatchCode,
      productId: rfProductId,
      productName: product.productName,
      qty,
      unitCost,
      totalCost: qty * unitCost,
      supplier: rfSupplier,
      expiryDate: rfExpiryDate,
      notes: rfNotes,
    };
    setBatches((prev) => [...prev, newBatch]);
    setReceipts((prev) => [receipt, ...prev]);
    // Reset
    setRfBatchCode(''); setRfQty(''); setRfUnitCost(''); setRfExpiryDate('');
    setRfSupplier(''); setRfSection(''); setRfNotes('');
    alert(`✅ Đã nhập lô ${rfBatchCode} — ${qty.toLocaleString()} ${product.unit} × ${formatVND(unitCost)}`);
  }, [rfProductId, rfBatchCode, rfReceivedDate, rfExpiryDate, rfQty, rfUnitCost, rfSupplier, rfSection, rfNotes]);

  const handleFifoPreview = useCallback(() => {
    const qty = Number(ifQty);
    if (qty <= 0) { alert('Nhập số lượng xuất'); return; }
    const result = fifoIssue(batches, ifProductId, qty, todayDate);
    setFifoPreview(result);
  }, [batches, ifProductId, ifQty]);

  const handleFifoConfirm = useCallback(() => {
    if (!fifoPreview) return;
    const qty = Number(ifQty);
    const product = PRODUCTS.find((p) => p.productId === ifProductId)!;
    const issue: GoodsIssue = {
      issueId: genId('i'),
      issueDate: TODAY,
      productId: ifProductId,
      productName: product.productName,
      requestedQty: qty,
      issuedQty: qty - fifoPreview.shortfall,
      lines: fifoPreview.lines,
      totalCost: fifoPreview.totalCost,
      avgUnitCost: fifoPreview.avgCost,
      purpose: ifPurpose,
      notes: ifNotes,
    };
    setBatches((prev) => applyFifoIssue(prev, fifoPreview));
    setIssues((prev) => [issue, ...prev]);
    setFifoPreview(null);
    setIfQty(''); setIfPurpose(''); setIfNotes('');
    alert(`✅ Xuất thành công ${issue.issuedQty.toLocaleString()} ${product.unit} — Giá vốn FIFO: ${formatVND(issue.totalCost)}`);
  }, [fifoPreview, ifProductId, ifQty, ifPurpose, ifNotes]);

  const handleWriteOff = useCallback((batchId: string) => {
    const batch = batches.find((b) => b.batchId === batchId);
    if (!batch) return;
    const { updatedBatch, loss } = writeOffBatch(batch, batch.remainingQty);
    const wo: WriteOff = {
      writeOffId: genId('w'),
      date: TODAY,
      batchId: batch.batchId,
      batchCode: batch.batchCode,
      productId: batch.productId,
      productName: batch.productName,
      qty: batch.remainingQty,
      unitCost: batch.unitCost,
      totalLoss: loss,
      reason: woReason,
      notes: woNotes,
    };
    setBatches((prev) => prev.map((b) => b.batchId === batchId ? updatedBatch : b));
    setWriteOffs((prev) => [wo, ...prev]);
    setWoConfirmId(null); setWoNotes('');
  }, [batches, woReason, woNotes]);

  const handlePriceReduction = useCallback((batchId: string) => {
    const newPrice = Number(prNewPrice);
    if (newPrice <= 0) { alert('Nhập giá mới hợp lệ'); return; }
    const batch = batches.find((b) => b.batchId === batchId);
    if (!batch) return;
    const pr: PriceReduction = {
      reductionId: genId('pr'),
      date: TODAY,
      batchId,
      batchCode: batch.batchCode,
      productName: batch.productName,
      originalPrice: batch.unitCost,
      reducedPrice: newPrice,
      qty: batch.remainingQty,
      notes: prNotes,
    };
    setBatches((prev) => prev.map((b) => b.batchId === batchId ? { ...b, unitCost: newPrice } : b));
    setPriceReductions((prev) => [pr, ...prev]);
    setPrBatchId(null); setPrNewPrice(''); setPrNotes('');
    alert(`✅ Đã giảm giá lô ${batch.batchCode} từ ${formatVND(batch.unitCost)} → ${formatVND(newPrice)}`);
  }, [batches, prNewPrice, prNotes]);

  // ─── Render: Dashboard ───────────────────────────────────────────────────
  function renderDashboard() {
    const totalBatches = enrichedBatches.filter((b) => b.remainingQty > 0).length;
    const totalWriteOffLoss = writeOffs.reduce((s, w) => s + w.totalLoss, 0);

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Lô đang lưu', value: totalBatches, sub: 'lô còn hàng', color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Sắp hết hạn', value: expiringBatches.length, sub: `≤ 30 ngày`, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Đã hết hạn', value: expiredBatches.length, sub: 'lô cần xử lý', color: 'text-red-700', bg: 'bg-red-50' },
            { label: 'Giá trị tồn kho', value: formatVND(totalStockValue), sub: 'theo giá nhập', color: 'text-emerald-700', bg: 'bg-emerald-50' },
          ].map((k) => (
            <div key={k.label} className={`rounded-2xl ${k.bg} p-4`}>
              <p className="text-xs font-semibold text-gray-500">{k.label}</p>
              <p className={`mt-1 text-2xl font-black ${k.color}`}>{k.value}</p>
              <p className="text-[11px] text-gray-400">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {(expiringBatches.length > 0 || expiredBatches.length > 0) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="mb-3 font-black text-amber-800">⚠️ Cảnh báo hàng sắp / đã hết hạn</h3>
            <div className="space-y-2">
              {[...expiredBatches, ...expiringBatches].map((b) => {
                const days = getDaysToExpiry(b.expiryDate, todayDate);
                return (
                  <div key={b.batchId} className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 shadow-sm">
                    <div>
                      <span className="font-bold text-gray-800">{b.batchCode}</span>
                      <span className="ml-2 text-sm text-gray-500">{b.productName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">Còn {b.remainingQty.toLocaleString()} {b.unit}</span>
                      <StatusBadge status={b.status} />
                      <span className={`text-xs font-bold ${days < 0 ? 'text-red-600' : days <= 7 ? 'text-orange-600' : 'text-amber-600'}`}>
                        {days < 0 ? `Quá ${-days} ngày` : days === 0 ? 'Hết hạn hôm nay' : `Còn ${days} ngày`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tổng quan tồn kho theo sản phẩm */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-black text-gray-800">Tồn kho theo sản phẩm</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-bold uppercase tracking-wide text-gray-400">
                  <th className="pb-2 pr-4">Sản phẩm</th>
                  <th className="pb-2 pr-4 text-right">Tổng SL tồn</th>
                  <th className="pb-2 pr-4 text-right">Giá BQ gia quyền</th>
                  <th className="pb-2 pr-4 text-right">Giá vốn FIFO xuất kế tiếp</th>
                  <th className="pb-2 text-right">Tổng giá trị</th>
                </tr>
              </thead>
              <tbody>
                {PRODUCTS.map((p) => {
                  const pBatches = batches.filter((b) => b.productId === p.productId && b.remainingQty > 0);
                  const totalQty = pBatches.reduce((s, b) => s + b.remainingQty, 0);
                  const totalVal = pBatches.reduce((s, b) => s + b.remainingQty * b.unitCost, 0);
                  const wavg = weightedAvgCost(batches, p.productId);
                  const fifoNext = fifoIssue(batches, p.productId, 1, todayDate);
                  const fifoUnitCost = fifoNext.success ? fifoNext.lines[0]?.unitCost ?? 0 : 0;
                  if (totalQty === 0) return null;
                  return (
                    <tr key={p.productId} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 pr-4 font-medium text-gray-800">{p.productName}</td>
                      <td className="py-2 pr-4 text-right font-bold text-gray-700">{totalQty.toLocaleString()} {p.unit}</td>
                      <td className="py-2 pr-4 text-right text-gray-600">{formatVND(wavg)}</td>
                      <td className="py-2 pr-4 text-right font-bold text-blue-700">{fifoUnitCost > 0 ? formatVND(fifoUnitCost) : '—'}</td>
                      <td className="py-2 text-right font-bold text-emerald-700">{formatVND(totalVal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tổn thất */}
        {writeOffs.length > 0 && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
            <h3 className="mb-2 font-black text-red-800">💸 Tổn thất tích lũy</h3>
            <p className="text-3xl font-black text-red-700">{formatVND(totalWriteOffLoss)}</p>
            <p className="mt-1 text-xs text-red-500">Từ {writeOffs.length} lần hủy hàng</p>
          </div>
        )}
      </div>
    );
  }

  // ─── Render: Nhập hàng ───────────────────────────────────────────────────
  function renderReceipt() {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-5 font-black text-gray-800">📥 Phiếu nhập hàng mới</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500">Sản phẩm *</span>
              <select value={rfProductId} onChange={(e) => setRfProductId(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PRODUCTS.map((p) => <option key={p.productId} value={p.productId}>{p.productName}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500">Số lô (mã lô) *</span>
              <input value={rfBatchCode} onChange={(e) => setRfBatchCode(e.target.value)} placeholder="VD: L003-NPK" className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500">Ngày nhập *</span>
              <input type="date" value={rfReceivedDate} onChange={(e) => setRfReceivedDate(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500">Hạn sử dụng *</span>
              <input type="date" value={rfExpiryDate} onChange={(e) => setRfExpiryDate(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500">Số lượng nhập *</span>
              <input type="number" value={rfQty} onChange={(e) => setRfQty(e.target.value)} placeholder="0" min="1" className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500">Đơn giá nhập (đ) *</span>
              <input type="number" value={rfUnitCost} onChange={(e) => setRfUnitCost(e.target.value)} placeholder="0" min="0" className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500">Nhà cung cấp</span>
              <input value={rfSupplier} onChange={(e) => setRfSupplier(e.target.value)} placeholder="Tên nhà cung cấp" className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500">Vị trí kho</span>
              <input value={rfSection} onChange={(e) => setRfSection(e.target.value)} placeholder="VD: Kho A – Dãy 2" className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <label className="col-span-full flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500">Ghi chú</span>
              <textarea value={rfNotes} onChange={(e) => setRfNotes(e.target.value)} rows={2} className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
          </div>
          {rfQty && rfUnitCost && (
            <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm">
              <span className="font-bold text-blue-700">Tổng giá trị nhập: </span>
              <span className="font-black text-blue-900">{formatVND(Number(rfQty) * Number(rfUnitCost))}</span>
            </div>
          )}
          <button onClick={handleReceipt} className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-black text-white hover:bg-blue-700 transition">
            ✅ Xác nhận nhập kho
          </button>
        </div>

        {/* Lịch sử nhập */}
        {receipts.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-black text-gray-800">Lịch sử phiếu nhập ({receipts.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs font-bold uppercase tracking-wide text-gray-400">
                    <th className="pb-2 text-left pr-3">Ngày</th>
                    <th className="pb-2 text-left pr-3">Số lô</th>
                    <th className="pb-2 text-left pr-3">Sản phẩm</th>
                    <th className="pb-2 text-right pr-3">SL</th>
                    <th className="pb-2 text-right pr-3">Đơn giá</th>
                    <th className="pb-2 text-right">Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((r) => (
                    <tr key={r.receiptId} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 pr-3 text-gray-500">{formatDate(r.receiptDate)}</td>
                      <td className="py-2 pr-3 font-mono text-xs font-bold text-blue-700">{r.batchCode}</td>
                      <td className="py-2 pr-3 text-gray-700">{r.productName}</td>
                      <td className="py-2 pr-3 text-right">{r.qty.toLocaleString()}</td>
                      <td className="py-2 pr-3 text-right">{formatVND(r.unitCost)}</td>
                      <td className="py-2 text-right font-bold text-emerald-700">{formatVND(r.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Render: Xuất hàng FIFO ──────────────────────────────────────────────
  function renderIssue() {
    const product = PRODUCTS.find((p) => p.productId === ifProductId);
    const availableBatches = enrichedBatches.filter(
      (b) => b.productId === ifProductId && b.remainingQty > 0 && b.status !== 'expired',
    );
    const totalAvailable = availableBatches.reduce((s, b) => s + b.remainingQty, 0);

    return (
      <div className="space-y-6">
        {/* Form xuất */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-1 font-black text-gray-800">📤 Phiếu xuất hàng — Phương pháp FIFO</h3>
          <p className="mb-5 text-xs text-gray-400">Hệ thống tự động chọn lô nhập trước → xuất trước (nhập trước — bán trước)</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500">Sản phẩm *</span>
              <select value={ifProductId} onChange={(e) => { setIfProductId(e.target.value); setFifoPreview(null); }} className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PRODUCTS.map((p) => <option key={p.productId} value={p.productId}>{p.productName}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500">Số lượng xuất *</span>
              <input type="number" value={ifQty} onChange={(e) => { setIfQty(e.target.value); setFifoPreview(null); }} placeholder={`Tối đa ${totalAvailable.toLocaleString()} ${product?.unit}`} min="1" className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500">Mục đích xuất</span>
              <input value={ifPurpose} onChange={(e) => setIfPurpose(e.target.value)} placeholder="VD: Bón lúa vụ Hè Thu, Bán cho HTX..." className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500">Ghi chú</span>
              <input value={ifNotes} onChange={(e) => setIfNotes(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
          </div>

          {/* Lô hợp lệ hiện tại */}
          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Lô hợp lệ (theo thứ tự FIFO)</p>
            {availableBatches.length === 0
              ? <p className="text-sm text-gray-400">Không có lô nào khả dụng</p>
              : availableBatches
                  .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime())
                  .map((b, i) => (
                    <div key={b.batchId} className="mb-1 flex items-center gap-3 text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-black text-blue-700">{i + 1}</span>
                      <span className="font-mono font-bold text-blue-700">{b.batchCode}</span>
                      <span className="text-gray-500">nhập {formatDate(b.receivedDate)}</span>
                      <span className="font-bold">{b.remainingQty.toLocaleString()} {b.unit}</span>
                      <span className="text-gray-400">× {formatVND(b.unitCost)}</span>
                      <StatusBadge status={b.status} />
                    </div>
                  ))
            }
          </div>

          <button onClick={handleFifoPreview} className="mt-4 w-full rounded-xl bg-gray-800 py-3 font-black text-white hover:bg-gray-700 transition">
            🔍 Xem trước phân bổ FIFO
          </button>
        </div>

        {/* FIFO Preview */}
        {fifoPreview && (
          <div className={`rounded-2xl border p-6 shadow-sm ${fifoPreview.success ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            <h3 className={`mb-4 font-black ${fifoPreview.success ? 'text-emerald-800' : 'text-amber-800'}`}>
              {fifoPreview.success ? '✅ Phân bổ FIFO — Đủ hàng' : `⚠️ Phân bổ FIFO — Thiếu ${fifoPreview.shortfall.toLocaleString()} ${product?.unit}`}
            </h3>

            {/* Breakdown table */}
            <div className="mb-4 overflow-x-auto rounded-xl bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs font-bold uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-2 text-left">Số lô</th>
                    <th className="px-4 py-2 text-left">Ngày nhập</th>
                    <th className="px-4 py-2 text-left">HSD</th>
                    <th className="px-4 py-2 text-right">SL xuất</th>
                    <th className="px-4 py-2 text-right">Đơn giá</th>
                    <th className="px-4 py-2 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {fifoPreview.lines.map((line, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-4 py-2 font-mono font-bold text-blue-700">{line.batchCode}</td>
                      <td className="px-4 py-2 text-gray-500">{formatDate(line.receivedDate)}</td>
                      <td className="px-4 py-2 text-gray-500">{formatDate(line.expiryDate)}</td>
                      <td className="px-4 py-2 text-right font-bold">{line.qty.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{formatVND(line.unitCost)}</td>
                      <td className="px-4 py-2 text-right font-bold text-emerald-700">{formatVND(line.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-black">
                    <td colSpan={3} className="px-4 py-2 text-gray-700">TỔNG ({fifoPreview.batchesConsumed} lô)</td>
                    <td className="px-4 py-2 text-right text-gray-800">{fifoPreview.lines.reduce((s, l) => s + l.qty, 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-right text-gray-500 text-xs">BQ: {formatVND(fifoPreview.avgCost)}</td>
                    <td className="px-4 py-2 text-right text-emerald-800">{formatVND(fifoPreview.totalCost)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-xs text-gray-400">Tổng giá vốn FIFO</p>
                <p className="font-black text-emerald-700">{formatVND(fifoPreview.totalCost)}</p>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-xs text-gray-400">Đơn giá BQ FIFO</p>
                <p className="font-black text-blue-700">{formatVND(fifoPreview.avgCost)}</p>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-xs text-gray-400">Số lô sử dụng</p>
                <p className="font-black text-gray-700">{fifoPreview.batchesConsumed} lô</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleFifoConfirm} className="flex-1 rounded-xl bg-emerald-600 py-3 font-black text-white hover:bg-emerald-700 transition">
                ✅ Xác nhận xuất kho
              </button>
              <button onClick={() => setFifoPreview(null)} className="rounded-xl border border-gray-200 px-6 py-3 font-bold text-gray-600 hover:bg-gray-50 transition">
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Lịch sử xuất */}
        {issues.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-black text-gray-800">Lịch sử phiếu xuất ({issues.length})</h3>
            <div className="space-y-3">
              {issues.map((iss) => (
                <div key={iss.issueId} className="rounded-xl border border-gray-100 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-800">{iss.productName}</span>
                      {iss.purpose && <span className="ml-2 text-xs text-gray-400">— {iss.purpose}</span>}
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(iss.issueDate)}</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-gray-600">Xuất: <strong>{iss.issuedQty.toLocaleString()}</strong></span>
                    <span className="text-gray-600">Giá vốn FIFO: <strong className="text-emerald-700">{formatVND(iss.totalCost)}</strong></span>
                    <span className="text-gray-600">Đơn giá BQ: <strong className="text-blue-700">{formatVND(iss.avgUnitCost)}</strong></span>
                    <span className="text-gray-600">Số lô: <strong>{iss.lines.length}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Render: Lô hàng ────────────────────────────────────────────────────
  function renderBatches() {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="font-black text-gray-800">📦 Tất cả lô hàng ({enrichedBatches.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-bold uppercase tracking-wide text-gray-400">
                {['Số lô','Sản phẩm','Ngày nhập','HSD','SL nhập','SL còn','Đơn giá','Giá trị còn','Vị trí','Trạng thái'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {enrichedBatches
                .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime())
                .map((b) => {
                  const days = getDaysToExpiry(b.expiryDate, todayDate);
                  return (
                    <tr key={b.batchId} className={`border-b border-gray-50 hover:bg-gray-50 ${b.status === 'expired' ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-blue-700">{b.batchCode}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{b.productName}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(b.receivedDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={days < 0 ? 'text-red-600 font-bold' : days <= 7 ? 'text-orange-600 font-bold' : 'text-gray-500'}>
                          {formatDate(b.expiryDate)}
                          <span className="ml-1 text-[10px]">({days < 0 ? `−${-days}d` : `+${days}d`})</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{b.initialQty.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-bold">{b.remainingQty.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">{formatVND(b.unitCost)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatVND(b.remainingQty * b.unitCost)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{b.warehouseSection}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─── Render: Xử lý hết hạn ──────────────────────────────────────────────
  function renderExpiry() {
    const atRisk = enrichedBatches.filter(
      (b) => (b.status === 'expired' || b.status === 'critical' || b.status === 'expiring_soon') && b.remainingQty > 0,
    );

    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <h3 className="font-black text-amber-900">⚠️ Quy trình xử lý hàng sắp / đã hết hạn</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            {[
              { icon: '💰', title: 'Giảm giá xả hàng', desc: 'Hạ đơn giá bán để tăng tốc độ bán trước khi hết hạn. Ghi nhận vào sổ giảm giá.' },
              { icon: '📦', title: 'Chuyển kênh bán', desc: 'Chuyển sang kênh bán buôn, chợ đầu mối, hoặc dùng nội bộ thay vì bán lẻ.' },
              { icon: '🗑️', title: 'Hủy hàng (Write-off)', desc: 'Lập biên bản hủy, ghi nhận tổn thất vào chi phí. Bắt buộc khi đã hết hạn.' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-white p-4 shadow-sm">
                <p className="text-2xl">{item.icon}</p>
                <p className="mt-1 font-bold text-gray-800">{item.title}</p>
                <p className="mt-1 text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {atRisk.length === 0
          ? <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400">✅ Không có lô hàng nào cần xử lý</div>
          : atRisk.map((b) => {
              const days = getDaysToExpiry(b.expiryDate, todayDate);
              return (
                <div key={b.batchId} className={`rounded-2xl border p-5 ${b.status === 'expired' ? 'border-red-200 bg-red-50' : b.status === 'critical' ? 'border-orange-200 bg-orange-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-gray-700">{b.batchCode}</span>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="mt-0.5 text-sm font-bold text-gray-800">{b.productName}</p>
                      <div className="mt-1 flex gap-4 text-xs text-gray-500">
                        <span>Còn: <strong className="text-gray-800">{b.remainingQty.toLocaleString()} {b.unit}</strong></span>
                        <span>Giá nhập: <strong>{formatVND(b.unitCost)}</strong></span>
                        <span>Giá trị: <strong className="text-red-700">{formatVND(b.remainingQty * b.unitCost)}</strong></span>
                        <span className={days < 0 ? 'text-red-700 font-bold' : 'text-orange-700 font-bold'}>
                          HSD: {formatDate(b.expiryDate)} ({days < 0 ? `đã quá ${-days} ngày` : `còn ${days} ngày`})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action: Giảm giá */}
                  {prBatchId === b.batchId ? (
                    <div className="mb-3 rounded-xl border border-orange-200 bg-white p-4">
                      <p className="mb-2 text-sm font-bold text-orange-800">💰 Điều chỉnh giá bán / giá nhập</p>
                      <div className="flex gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-400">Giá mới (đ)</span>
                          <input type="number" value={prNewPrice} onChange={(e) => setPrNewPrice(e.target.value)} placeholder={`Hiện tại: ${b.unitCost.toLocaleString()}`} className="w-36 rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                          <span className="text-xs text-gray-400">Ghi chú</span>
                          <input value={prNotes} onChange={(e) => setPrNotes(e.target.value)} placeholder="Lý do giảm giá..." className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
                        </div>
                      </div>
                      {prNewPrice && Number(prNewPrice) > 0 && (
                        <p className="mt-2 text-xs text-orange-700">
                          Tổn thất chênh lệch: <strong>{formatVND((b.unitCost - Number(prNewPrice)) * b.remainingQty)}</strong> ({((1 - Number(prNewPrice) / b.unitCost) * 100).toFixed(1)}% giảm)
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => handlePriceReduction(b.batchId)} className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-black text-white hover:bg-orange-600">Xác nhận</button>
                        <button onClick={() => setPrBatchId(null)} className="rounded-lg border px-4 py-1.5 text-xs font-bold text-gray-600">Hủy</button>
                      </div>
                    </div>
                  ) : null}

                  {/* Action: Hủy hàng */}
                  {woConfirmId === b.batchId ? (
                    <div className="mb-3 rounded-xl border border-red-200 bg-white p-4">
                      <p className="mb-2 text-sm font-bold text-red-800">🗑️ Xác nhận hủy toàn bộ lô — tổn thất <strong>{formatVND(b.remainingQty * b.unitCost)}</strong></p>
                      <div className="flex gap-3">
                        <select value={woReason} onChange={(e) => setWoReason(e.target.value as WriteOff['reason'])} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm">
                          <option value="expired">Hết hạn sử dụng</option>
                          <option value="damaged">Hư hỏng / bị ảnh hưởng</option>
                          <option value="quality_fail">Không đạt chất lượng</option>
                          <option value="other">Lý do khác</option>
                        </select>
                        <input value={woNotes} onChange={(e) => setWoNotes(e.target.value)} placeholder="Ghi chú biên bản hủy..." className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => handleWriteOff(b.batchId)} className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-black text-white hover:bg-red-700">Hủy hàng & Ghi tổn thất</button>
                        <button onClick={() => setWoConfirmId(null)} className="rounded-lg border px-4 py-1.5 text-xs font-bold text-gray-600">Thoát</button>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex gap-2">
                    <button onClick={() => { setPrBatchId(b.batchId); setWoConfirmId(null); }} className="rounded-xl border border-orange-300 bg-white px-4 py-2 text-xs font-bold text-orange-700 hover:bg-orange-50 transition">
                      💰 Giảm giá xả hàng
                    </button>
                    <button onClick={() => { setWoConfirmId(b.batchId); setPrBatchId(null); }} className="rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 transition">
                      🗑️ Hủy hàng (Write-off)
                    </button>
                  </div>
                </div>
              );
            })}

        {/* Lịch sử hủy */}
        {writeOffs.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-black text-gray-800">Biên bản hủy hàng ({writeOffs.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs font-bold uppercase tracking-wide text-gray-400">
                    <th className="pb-2 text-left pr-3">Ngày</th>
                    <th className="pb-2 text-left pr-3">Số lô</th>
                    <th className="pb-2 text-left pr-3">Sản phẩm</th>
                    <th className="pb-2 text-right pr-3">SL hủy</th>
                    <th className="pb-2 text-right pr-3">Đơn giá</th>
                    <th className="pb-2 text-right pr-3">Tổn thất</th>
                    <th className="pb-2 text-left">Lý do</th>
                  </tr>
                </thead>
                <tbody>
                  {writeOffs.map((w) => (
                    <tr key={w.writeOffId} className="border-b border-gray-50">
                      <td className="py-2 pr-3 text-gray-500">{formatDate(w.date)}</td>
                      <td className="py-2 pr-3 font-mono text-xs font-bold text-red-700">{w.batchCode}</td>
                      <td className="py-2 pr-3">{w.productName}</td>
                      <td className="py-2 pr-3 text-right">{w.qty.toLocaleString()}</td>
                      <td className="py-2 pr-3 text-right">{formatVND(w.unitCost)}</td>
                      <td className="py-2 pr-3 text-right font-bold text-red-700">{formatVND(w.totalLoss)}</td>
                      <td className="py-2 text-xs text-gray-500">
                        {{ expired: 'Hết hạn', damaged: 'Hư hỏng', quality_fail: 'Không đạt CL', other: 'Khác' }[w.reason]}
                        {w.notes && ` — ${w.notes}`}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-red-50 font-black">
                    <td colSpan={5} className="px-0 py-2 text-gray-700">Tổng tổn thất</td>
                    <td className="py-2 text-right text-red-800">{formatVND(writeOffs.reduce((s, w) => s + w.totalLoss, 0))}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Render: Báo cáo ────────────────────────────────────────────────────
  function renderReports() {
    return (
      <div className="space-y-6">
        {/* So sánh FIFO vs Bình quân */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-1 font-black text-gray-800">So sánh FIFO vs Bình quân gia quyền</h3>
          <p className="mb-5 text-xs text-gray-400">Mô phỏng xuất 100 đơn vị mỗi sản phẩm — so sánh hai phương pháp tính giá vốn</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs font-bold uppercase tracking-wide text-gray-400">
                  <th className="pb-2 text-left pr-4">Sản phẩm</th>
                  <th className="pb-2 text-right pr-4">SL mô phỏng</th>
                  <th className="pb-2 text-right pr-4">Giá vốn FIFO</th>
                  <th className="pb-2 text-right pr-4">Đơn giá BQ</th>
                  <th className="pb-2 text-right pr-4">Giá vốn BQ</th>
                  <th className="pb-2 text-right">Chênh lệch</th>
                </tr>
              </thead>
              <tbody>
                {PRODUCTS.map((p) => {
                  const simQty = 100;
                  const r = fifoIssue(batches, p.productId, simQty, todayDate);
                  const wavg = weightedAvgCost(batches, p.productId);
                  const fifoTotal = r.totalCost;
                  const issuedQty = simQty - r.shortfall;
                  const wavgCostTotal = wavg * issuedQty;
                  const diff = fifoTotal - wavgCostTotal;
                  if (issuedQty === 0) return null;
                  return (
                    <tr key={p.productId} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 pr-4 font-medium">{p.productName}</td>
                      <td className="py-2 pr-4 text-right">{issuedQty.toLocaleString()} {p.unit}</td>
                      <td className="py-2 pr-4 text-right font-bold text-blue-700">{formatVND(fifoTotal)}</td>
                      <td className="py-2 pr-4 text-right text-gray-500">{formatVND(wavg)}</td>
                      <td className="py-2 pr-4 text-right">{formatVND(wavgCostTotal)}</td>
                      <td className={`py-2 text-right font-bold ${diff > 0 ? 'text-orange-600' : diff < 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {diff === 0 ? '=' : (diff > 0 ? '+' : '')}{formatVND(Math.abs(diff))}
                        <span className="ml-1 text-[10px] text-gray-400">{diff > 0 ? '(FIFO đắt hơn)' : diff < 0 ? '(FIFO rẻ hơn)' : ''}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
            <strong>Lý giải:</strong> Khi giá lô cũ &lt; lô mới (lạm phát), FIFO cho giá vốn thấp hơn bình quân → lợi nhuận báo cáo cao hơn. Ngược lại khi giá giảm, FIFO cho giá vốn cao hơn. Cả hai đều được VAS cho phép.
          </div>
        </div>

        {/* Báo cáo xuất hàng */}
        {issues.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-black text-gray-800">Tổng hợp phiếu xuất FIFO</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs text-gray-400">Tổng số lần xuất</p>
                <p className="text-2xl font-black text-blue-700">{issues.length}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs text-gray-400">Tổng giá vốn FIFO</p>
                <p className="text-2xl font-black text-emerald-700">{formatVND(issues.reduce((s, i) => s + i.totalCost, 0))}</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-4">
                <p className="text-xs text-gray-400">Tổng SL xuất</p>
                <p className="text-2xl font-black text-purple-700">{issues.reduce((s, i) => s + i.issuedQty, 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Điều chỉnh giá */}
        {priceReductions.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-black text-gray-800">Lịch sử điều chỉnh giá lô ({priceReductions.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs font-bold uppercase tracking-wide text-gray-400">
                    <th className="pb-2 text-left pr-3">Ngày</th>
                    <th className="pb-2 text-left pr-3">Số lô</th>
                    <th className="pb-2 text-right pr-3">Giá gốc</th>
                    <th className="pb-2 text-right pr-3">Giá mới</th>
                    <th className="pb-2 text-right pr-3">SL</th>
                    <th className="pb-2 text-right">Chênh lệch GV</th>
                  </tr>
                </thead>
                <tbody>
                  {priceReductions.map((pr) => (
                    <tr key={pr.reductionId} className="border-b border-gray-50">
                      <td className="py-2 pr-3 text-gray-500">{formatDate(pr.date)}</td>
                      <td className="py-2 pr-3 font-mono text-xs font-bold">{pr.batchCode}</td>
                      <td className="py-2 pr-3 text-right line-through text-gray-400">{formatVND(pr.originalPrice)}</td>
                      <td className="py-2 pr-3 text-right font-bold text-emerald-700">{formatVND(pr.reducedPrice)}</td>
                      <td className="py-2 pr-3 text-right">{pr.qty.toLocaleString()}</td>
                      <td className="py-2 text-right font-bold text-red-700">−{formatVND((pr.originalPrice - pr.reducedPrice) * pr.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Render: Kiểm thử ───────────────────────────────────────────────────
  function renderTests() {
    const results = testResults ?? runAllTests();
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-gray-800">🧪 Unit Tests — Nghiệp vụ FIFO</h3>
            <p className="text-xs text-gray-400">Kiểm thử toàn bộ logic nghiệp vụ: FIFO, hết hạn, write-off, giá vốn</p>
          </div>
          <button onClick={() => setTestResults(runAllTests())} className="rounded-xl bg-gray-800 px-5 py-2.5 font-black text-white hover:bg-gray-700 transition">
            ▶ Chạy lại tất cả
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-gray-800 p-5 text-center text-white">
            <p className="text-xs text-gray-400">Tổng test</p>
            <p className="text-3xl font-black">{results.length}</p>
          </div>
          <div className="rounded-2xl bg-emerald-600 p-5 text-center text-white">
            <p className="text-xs text-emerald-200">Passed ✅</p>
            <p className="text-3xl font-black">{passed}</p>
          </div>
          <div className={`rounded-2xl p-5 text-center text-white ${failed > 0 ? 'bg-red-600' : 'bg-gray-300'}`}>
            <p className={`text-xs ${failed > 0 ? 'text-red-200' : 'text-gray-400'}`}>Failed ❌</p>
            <p className={`text-3xl font-black ${failed === 0 ? 'text-gray-500' : ''}`}>{failed}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${(passed / results.length) * 100}%` }} />
        </div>

        {/* Test results */}
        <div className="space-y-2">
          {results.map((r, i) => (
            <div key={i} className={`rounded-xl border p-4 ${r.passed ? 'border-emerald-100 bg-emerald-50' : 'border-red-100 bg-red-50'}`}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg">{r.passed ? '✅' : '❌'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400">#{i + 1}</span>
                    <p className={`text-sm font-bold ${r.passed ? 'text-emerald-800' : 'text-red-800'}`}>{r.name}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">{r.detail}</p>
                  {(r.expected || r.actual) && (
                    <div className="mt-1.5 flex gap-4 text-xs">
                      <span className="text-gray-400">Expected: <code className="font-mono text-emerald-700">{r.expected}</code></span>
                      <span className="text-gray-400">Actual: <code className={`font-mono ${r.passed ? 'text-emerald-700' : 'text-red-600'}`}>{r.actual}</code></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Main render ─────────────────────────────────────────────────────────
  const tabContent: Record<string, () => JSX.Element> = {
    dashboard: renderDashboard,
    receipt: renderReceipt,
    issue: renderIssue,
    batches: renderBatches,
    expiry: renderExpiry,
    reports: renderReports,
    tests: renderTests,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-xl font-black text-gray-900">🌾 Quản lý tồn kho nông sản</h1>
          <p className="text-xs text-gray-400">Phương pháp FIFO — Nhập trước xuất trước • Cảnh báo hết hạn • Báo cáo giá vốn</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`whitespace-nowrap border-b-2 px-5 py-3.5 text-sm font-bold transition-colors ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {tabContent[tab]?.()}
      </div>
    </div>
  );
}
