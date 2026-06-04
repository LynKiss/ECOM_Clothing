// ============================================================
// Quản lý tồn kho nông sản — Nghiệp vụ FIFO thuần
// ============================================================

export type BatchStatus = 'active' | 'expiring_soon' | 'critical' | 'expired' | 'depleted';

export type Batch = {
  batchId: string;
  batchCode: string;
  productId: string;
  productName: string;
  unit: string;
  receivedDate: string;   // ISO date string
  expiryDate: string;     // ISO date string
  initialQty: number;     // số lượng nhập ban đầu
  remainingQty: number;   // số lượng còn lại
  unitCost: number;       // đơn giá nhập (VNĐ)
  warehouseSection: string;
  supplier: string;
  notes: string;
};

export type FifoLineItem = {
  batchId: string;
  batchCode: string;
  receivedDate: string;
  expiryDate: string;
  qty: number;
  unitCost: number;
  subtotal: number;
};

export type FifoIssueResult = {
  success: boolean;
  shortfall: number;          // số lượng thiếu nếu không đủ
  lines: FifoLineItem[];      // breakdown theo lô (FIFO)
  totalCost: number;          // tổng giá vốn FIFO
  avgCost: number;            // đơn giá vốn bình quân FIFO
  batchesConsumed: number;    // số lô bị ảnh hưởng
};

export type GoodsReceipt = {
  receiptId: string;
  receiptDate: string;
  batchId: string;
  batchCode: string;
  productId: string;
  productName: string;
  qty: number;
  unitCost: number;
  totalCost: number;
  supplier: string;
  expiryDate: string;
  notes: string;
};

export type GoodsIssue = {
  issueId: string;
  issueDate: string;
  productId: string;
  productName: string;
  requestedQty: number;
  issuedQty: number;
  lines: FifoLineItem[];
  totalCost: number;
  avgUnitCost: number;
  purpose: string;
  notes: string;
};

export type WriteOff = {
  writeOffId: string;
  date: string;
  batchId: string;
  batchCode: string;
  productId: string;
  productName: string;
  qty: number;
  unitCost: number;
  totalLoss: number;
  reason: 'expired' | 'damaged' | 'quality_fail' | 'other';
  notes: string;
};

export type PriceReduction = {
  reductionId: string;
  date: string;
  batchId: string;
  batchCode: string;
  productName: string;
  originalPrice: number;
  reducedPrice: number;
  qty: number;
  notes: string;
};

// ============================================================
// Core helpers
// ============================================================

export function getDaysToExpiry(expiryDate: string, referenceDate = new Date()): number {
  const expiry = new Date(expiryDate);
  const ref = new Date(referenceDate);
  // normalize to midnight
  expiry.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));
}

export function getBatchStatus(batch: Batch, referenceDate = new Date()): BatchStatus {
  if (batch.remainingQty <= 0) return 'depleted';
  const days = getDaysToExpiry(batch.expiryDate, referenceDate);
  if (days < 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'expiring_soon';
  return 'active';
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ============================================================
// FIFO Issue Algorithm
// Quy tắc: sắp xếp lô theo receivedDate tăng dần → xuất lô cũ nhất trước
// Lô bị loại: đã hết hàng, đã hết hạn, không active
// ============================================================

export function fifoIssue(
  allBatches: Batch[],
  productId: string,
  requestedQty: number,
  referenceDate = new Date(),
): FifoIssueResult {
  // 1. Lọc lô hợp lệ của sản phẩm (còn hàng, chưa hết hạn)
  const eligible = allBatches
    .filter((b) => {
      if (b.productId !== productId) return false;
      if (b.remainingQty <= 0) return false;
      const days = getDaysToExpiry(b.expiryDate, referenceDate);
      if (days < 0) return false; // đã hết hạn → không xuất
      return true;
    })
    // 2. Sắp xếp: receivedDate tăng dần (cũ nhất trước — FIFO)
    .sort((a, b) => new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime());

  let remaining = requestedQty;
  const lines: FifoLineItem[] = [];

  // 3. Lần lượt lấy từng lô cho đến khi đủ số lượng
  for (const batch of eligible) {
    if (remaining <= 0) break;
    const take = Math.min(batch.remainingQty, remaining);
    lines.push({
      batchId: batch.batchId,
      batchCode: batch.batchCode,
      receivedDate: batch.receivedDate,
      expiryDate: batch.expiryDate,
      qty: take,
      unitCost: batch.unitCost,
      subtotal: take * batch.unitCost,
    });
    remaining -= take;
  }

  const issuedQty = requestedQty - remaining;
  const totalCost = lines.reduce((s, l) => s + l.subtotal, 0);

  return {
    success: remaining === 0,
    shortfall: remaining,
    lines,
    totalCost,
    avgCost: issuedQty > 0 ? totalCost / issuedQty : 0,
    batchesConsumed: lines.length,
  };
}

// Áp dụng kết quả FIFO lên danh sách lô (trừ tồn kho)
export function applyFifoIssue(batches: Batch[], result: FifoIssueResult): Batch[] {
  const deductions = new Map(result.lines.map((l) => [l.batchId, l.qty]));
  return batches.map((b) => {
    const deduct = deductions.get(b.batchId) ?? 0;
    if (deduct === 0) return b;
    return { ...b, remainingQty: b.remainingQty - deduct };
  });
}

// ============================================================
// Giá vốn bình quân gia quyền (so sánh với FIFO)
// ============================================================
export function weightedAvgCost(batches: Batch[], productId: string): number {
  const active = batches.filter(
    (b) => b.productId === productId && b.remainingQty > 0,
  );
  const totalQty = active.reduce((s, b) => s + b.remainingQty, 0);
  if (totalQty === 0) return 0;
  const totalValue = active.reduce((s, b) => s + b.remainingQty * b.unitCost, 0);
  return totalValue / totalQty;
}

// ============================================================
// Xử lý hủy lô (write-off)
// ============================================================
export function writeOffBatch(batch: Batch, qty: number): { updatedBatch: Batch; loss: number } {
  const writeQty = Math.min(qty, batch.remainingQty);
  return {
    updatedBatch: { ...batch, remainingQty: batch.remainingQty - writeQty },
    loss: writeQty * batch.unitCost,
  };
}

// ============================================================
// Business Logic Tests (pure functions — no DOM needed)
// ============================================================

export type TestResult = {
  name: string;
  passed: boolean;
  detail: string;
  expected?: string;
  actual?: string;
};

function assert(name: string, condition: boolean, detail: string, expected?: string, actual?: string): TestResult {
  return { name, passed: condition, detail, expected, actual };
}

export function runAllTests(): TestResult[] {
  const results: TestResult[] = [];

  const today = new Date('2025-05-14');

  // Sample batches for testing
  const baseBatches: Batch[] = [
    {
      batchId: 'b1', batchCode: 'L001', productId: 'p1', productName: 'Phân bón NPK',
      unit: 'kg', receivedDate: '2025-01-10', expiryDate: '2025-12-31',
      initialQty: 100, remainingQty: 100, unitCost: 12000,
      warehouseSection: 'A1', supplier: 'Công ty ABC', notes: '',
    },
    {
      batchId: 'b2', batchCode: 'L002', productId: 'p1', productName: 'Phân bón NPK',
      unit: 'kg', receivedDate: '2025-03-20', expiryDate: '2026-03-20',
      initialQty: 150, remainingQty: 150, unitCost: 13000,
      warehouseSection: 'A2', supplier: 'Công ty ABC', notes: '',
    },
    {
      batchId: 'b3', batchCode: 'L003', productId: 'p1', productName: 'Phân bón NPK',
      unit: 'kg', receivedDate: '2025-05-01', expiryDate: '2025-05-10',
      initialQty: 50, remainingQty: 50, unitCost: 11000,
      warehouseSection: 'A3', supplier: 'Công ty XYZ', notes: 'Giá thấp do sắp hết hạn',
    },
    {
      batchId: 'b4', batchCode: 'L004', productId: 'p2', productName: 'Thuốc trừ sâu',
      unit: 'chai', receivedDate: '2025-02-01', expiryDate: '2025-04-30',
      initialQty: 60, remainingQty: 60, unitCost: 45000,
      warehouseSection: 'B1', supplier: 'Bayer VN', notes: '',
    },
  ];

  // ── Test 1: FIFO xuất từ lô cũ nhất trước ──────────────────
  {
    const r = fifoIssue(baseBatches, 'p1', 80, today);
    results.push(assert(
      'FIFO: xuất lô cũ nhất trước (L001 trước L002)',
      r.lines[0]?.batchId === 'b1',
      'Xuất 80kg phân bón → phải lấy từ L001 (nhập 10/01) trước L002 (nhập 20/03)',
      'batchId = b1',
      r.lines[0]?.batchId ?? 'không có',
    ));
  }

  // ── Test 2: FIFO đúng số lượng mỗi lô ─────────────────────
  {
    const r = fifoIssue(baseBatches, 'p1', 80, today);
    results.push(assert(
      'FIFO: số lượng lấy từ lô đúng (80 ≤ 100 → 1 lô)',
      r.lines.length === 1 && r.lines[0].qty === 80,
      '80kg ≤ 100kg (L001) → chỉ cần 1 lô',
      'lines.length=1, qty=80',
      `lines.length=${r.lines.length}, qty=${r.lines[0]?.qty}`,
    ));
  }

  // ── Test 3: FIFO span nhiều lô ────────────────────────────
  {
    const r = fifoIssue(baseBatches, 'p1', 120, today);
    results.push(assert(
      'FIFO: span 2 lô khi lô đầu không đủ (xuất 120kg)',
      r.lines.length === 2 && r.lines[0].qty === 100 && r.lines[1].qty === 20,
      'L001 còn 100kg, cần 120 → lấy 100 từ L001 + 20 từ L002',
      'L001:100 + L002:20',
      `L001:${r.lines[0]?.qty} + L002:${r.lines[1]?.qty}`,
    ));
  }

  // ── Test 4: Giá vốn FIFO tính đúng ────────────────────────
  {
    const r = fifoIssue(baseBatches, 'p1', 120, today);
    const expected = 100 * 12000 + 20 * 13000; // 1_200_000 + 260_000 = 1_460_000
    results.push(assert(
      'FIFO: tổng giá vốn tính đúng',
      r.totalCost === expected,
      `100kg × 12.000 + 20kg × 13.000 = ${expected.toLocaleString()}đ`,
      `${expected.toLocaleString()}`,
      `${r.totalCost.toLocaleString()}`,
    ));
  }

  // ── Test 5: Đơn giá bình quân FIFO ───────────────────────
  {
    const r = fifoIssue(baseBatches, 'p1', 120, today);
    const expected = (100 * 12000 + 20 * 13000) / 120;
    results.push(assert(
      'FIFO: đơn giá bình quân FIFO đúng',
      Math.abs(r.avgCost - expected) < 0.01,
      `avgCost = tổngGiáVốn / 120 = ${expected.toFixed(2)}`,
      expected.toFixed(2),
      r.avgCost.toFixed(2),
    ));
  }

  // ── Test 6: Lô hết hạn bị bỏ qua ─────────────────────────
  {
    // L003 hết hạn 2025-05-10, today = 2025-05-14 → expired
    // L004 (p2) không liên quan
    // Xuất p1: chỉ dùng L001 và L002, bỏ qua L003
    const r = fifoIssue(baseBatches, 'p1', 30, today);
    const usedExpired = r.lines.some((l) => l.batchId === 'b3');
    results.push(assert(
      'Lô hết hạn bị loại khỏi FIFO (L003 HSD 10/05, today 14/05)',
      !usedExpired,
      'L003 HSD 10/05 < today 14/05 → bị loại, FIFO chỉ dùng L001/L002',
      'L003 không được dùng',
      usedExpired ? 'L003 BỊ DÙNG (SAI!)' : 'L003 không được dùng ✓',
    ));
  }

  // ── Test 7: Thiếu hàng (shortfall) ────────────────────────
  {
    const r = fifoIssue(baseBatches, 'p1', 999, today);
    // L001: 100, L002: 150, L003: hết hạn → tổng có thể xuất = 250
    results.push(assert(
      'FIFO: báo đúng shortfall khi không đủ hàng',
      !r.success && r.shortfall === 999 - 250,
      'Tổng có thể xuất = 250, yêu cầu 999 → shortfall = 749',
      'shortfall=749',
      `shortfall=${r.shortfall}`,
    ));
  }

  // ── Test 8: Xuất đúng 0 khi không có hàng ────────────────
  {
    const r = fifoIssue(baseBatches, 'p_none', 100, today);
    results.push(assert(
      'FIFO: shortfall = requestedQty khi không có lô nào',
      !r.success && r.shortfall === 100 && r.lines.length === 0,
      'productId không tồn tại → không có lô nào → shortfall = 100',
      'shortfall=100, lines=[]',
      `shortfall=${r.shortfall}, lines=${r.lines.length}`,
    ));
  }

  // ── Test 9: applyFifoIssue trừ tồn đúng ─────────────────
  {
    const r = fifoIssue(baseBatches, 'p1', 120, today);
    const updated = applyFifoIssue(baseBatches, r);
    const b1 = updated.find((b) => b.batchId === 'b1');
    const b2 = updated.find((b) => b.batchId === 'b2');
    results.push(assert(
      'applyFifoIssue: trừ tồn kho đúng sau khi xuất',
      b1?.remainingQty === 0 && b2?.remainingQty === 130,
      'L001: 100-100=0, L002: 150-20=130',
      'b1.remaining=0, b2.remaining=130',
      `b1=${b1?.remainingQty}, b2=${b2?.remainingQty}`,
    ));
  }

  // ── Test 10: getBatchStatus phân loại đúng ───────────────
  {
    const cases: [Batch, BatchStatus][] = [
      [{ ...baseBatches[0], remainingQty: 0 }, 'depleted'],
      [{ ...baseBatches[0], expiryDate: '2025-05-10' }, 'expired'],  // đã qua
      [{ ...baseBatches[0], expiryDate: '2025-05-15' }, 'critical'], // còn 1 ngày
      [{ ...baseBatches[0], expiryDate: '2025-05-30' }, 'expiring_soon'], // còn 16 ngày
      [{ ...baseBatches[0], expiryDate: '2026-01-01' }, 'active'],
    ];
    const allOk = cases.every(([b, expected]) => getBatchStatus(b, today) === expected);
    results.push(assert(
      'getBatchStatus: phân loại 5 trạng thái đúng (depleted/expired/critical/expiring_soon/active)',
      allOk,
      'depleted(qty=0), expired(HSD qua), critical(≤7 ngày), expiring_soon(≤30 ngày), active(>30 ngày)',
      'tất cả đúng',
      allOk ? 'tất cả đúng ✓' : cases.map(([b, exp]) => `${exp}→${getBatchStatus(b, today)}`).join(', '),
    ));
  }

  // ── Test 11: getDaysToExpiry ──────────────────────────────
  {
    const d1 = getDaysToExpiry('2025-05-21', today); // +7
    const d2 = getDaysToExpiry('2025-05-14', today); // 0
    const d3 = getDaysToExpiry('2025-05-10', today); // -4
    results.push(assert(
      'getDaysToExpiry: tính số ngày đúng (tương lai/hôm nay/quá khứ)',
      d1 === 7 && d2 === 0 && d3 === -4,
      '21/05→+7, 14/05→0, 10/05→-4',
      '7, 0, -4',
      `${d1}, ${d2}, ${d3}`,
    ));
  }

  // ── Test 12: weightedAvgCost ──────────────────────────────
  {
    const avg = weightedAvgCost(baseBatches, 'p1');
    // active batches: b1(100 × 12000) + b2(150 × 13000) + b3(50 × 11000 — hết hạn nhưng remainingQty>0)
    // weightedAvg tính trên remainingQty, không lọc hết hạn (chỉ dùng để định giá tài sản)
    const expected = (100 * 12000 + 150 * 13000 + 50 * 11000) / 300;
    results.push(assert(
      'weightedAvgCost: giá bình quân gia quyền tính đúng',
      Math.abs(avg - expected) < 0.01,
      `(100×12.000 + 150×13.000 + 50×11.000) / 300 = ${expected.toFixed(2)}`,
      expected.toFixed(2),
      avg.toFixed(2),
    ));
  }

  // ── Test 13: writeOffBatch ────────────────────────────────
  {
    const b = baseBatches[2]; // L003, 50kg, 11.000đ
    const { updatedBatch, loss } = writeOffBatch(b, 50);
    results.push(assert(
      'writeOffBatch: ghi nhận tổn thất đúng (hủy toàn bộ lô)',
      updatedBatch.remainingQty === 0 && loss === 50 * 11000,
      'Hủy 50kg × 11.000đ = 550.000đ tổn thất',
      'remaining=0, loss=550000',
      `remaining=${updatedBatch.remainingQty}, loss=${loss}`,
    ));
  }

  // ── Test 14: writeOffBatch hủy một phần ──────────────────
  {
    const b = baseBatches[0]; // L001, 100kg
    const { updatedBatch, loss } = writeOffBatch(b, 30);
    results.push(assert(
      'writeOffBatch: hủy một phần lô (30/100kg)',
      updatedBatch.remainingQty === 70 && loss === 30 * 12000,
      'Hủy 30/100kg → còn 70kg, tổn thất 360.000đ',
      'remaining=70, loss=360000',
      `remaining=${updatedBatch.remainingQty}, loss=${loss}`,
    ));
  }

  // ── Test 15: FIFO vs LIFO — chênh lệch giá vốn ───────────
  {
    // Giá L001 < L002: FIFO ưu tiên L001 → giá vốn thấp hơn
    const rFifo = fifoIssue(baseBatches, 'p1', 100, today);
    // LIFO (mô phỏng): ưu tiên L002
    const lifoLines: FifoLineItem[] = [{ batchId: 'b2', batchCode: 'L002', receivedDate: '2025-03-20', expiryDate: '2026-03-20', qty: 100, unitCost: 13000, subtotal: 1300000 }];
    const lifoCost = lifoLines[0].subtotal;
    results.push(assert(
      'FIFO vs LIFO: giá vốn FIFO thấp hơn LIFO khi giá lô mới > lô cũ',
      rFifo.totalCost < lifoCost,
      `FIFO=100×12.000=1.200.000 < LIFO=100×13.000=1.300.000`,
      'FIFO < LIFO',
      `FIFO=${rFifo.totalCost.toLocaleString()} < LIFO=${lifoCost.toLocaleString()} ✓`,
    ));
  }

  return results;
}
