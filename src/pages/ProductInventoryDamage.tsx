import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  LoaderCircle,
  PackageX,
  RotateCcw,
  Save,
  Search,
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { useLanguage } from '../i18n/language-context';
import { useToast } from '../hooks/useToast';

type Product = {
  productId: string;
  productName: string;
  quantityAvailable: number;
  unit: string | null;
  primaryImageUrl: string | null;
};

type Tab = 'damage' | 'return';

export default function ProductInventoryDamage() {
  const { language } = useLanguage();
  const isVietnamese = language === 'vi';
  const { showToast } = useToast();

  const [tab, setTab] = useState<Tab>('damage');
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [relatedOrderId, setRelatedOrderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await apiClient.get<{ items: Product[] }>(
          '/products?includeHidden=true&page=1&limit=500',
        );
        if (!cancelled) setProducts(data.items);
      } catch (err) {
        if (!cancelled) {
          showToast({
            tone: 'error',
            title: isVietnamese ? 'Không tải được sản phẩm' : 'Failed to load products',
            description: err instanceof Error ? err.message : '',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [isVietnamese, showToast]);

  const filtered = useMemo(
    () =>
      products.filter((p) =>
        p.productName.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [products, search],
  );

  const selected = products.find((p) => p.productId === selectedProductId) ?? null;

  function reset() {
    setSelectedProductId('');
    setQuantity('1');
    setNote('');
    setRelatedOrderId('');
  }

  async function handleSubmit() {
    if (!selectedProductId || Number(quantity) < 1) {
      showToast({
        tone: 'error',
        title: isVietnamese ? 'Thiếu thông tin' : 'Missing data',
        description: isVietnamese
          ? 'Vui lòng chọn sản phẩm và nhập số lượng.'
          : 'Please select a product and enter quantity.',
      });
      return;
    }

    if (selected && Number(quantity) > selected.quantityAvailable) {
      showToast({
        tone: 'error',
        title: isVietnamese ? 'Số lượng vượt tồn kho' : 'Quantity exceeds stock',
        description: isVietnamese
          ? `Tối đa ${selected.quantityAvailable} ${selected.unit ?? ''}`
          : `Maximum ${selected.quantityAvailable} ${selected.unit ?? ''}`,
      });
      return;
    }

    const endpoint =
      tab === 'damage'
        ? '/inventory/transactions/damage'
        : '/inventory/transactions/return';

    const payload =
      tab === 'damage'
        ? { productId: selectedProductId, quantity: Number(quantity), note: note.trim() || undefined }
        : {
            productId: selectedProductId,
            quantity: Number(quantity),
            note: note.trim() || undefined,
            relatedOrderId: relatedOrderId.trim() || undefined,
          };

    setSaving(true);
    try {
      await apiClient.post(endpoint, payload);
      showToast({
        tone: 'success',
        title:
          tab === 'damage'
            ? isVietnamese ? 'Đã ghi nhận hàng hỏng' : 'Damage recorded'
            : isVietnamese ? 'Đã ghi nhận hàng trả' : 'Return recorded',
        description: selected?.productName ?? selectedProductId,
      });
      reset();
    } catch (err) {
      showToast({
        tone: 'error',
        title: isVietnamese ? 'Thao tác thất bại' : 'Action failed',
        description: err instanceof Error ? err.message : '',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="font-headline text-[2.7rem] font-black tracking-tight text-primary">
          {isVietnamese ? 'Ghi Nhận Hàng Hỏng / Trả Hàng' : 'Record Damage & Returns'}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
          {isVietnamese
            ? 'Ghi nhận hàng hư hỏng, hết hạn hoặc hàng trả về từ khách hàng để điều chỉnh tồn kho chính xác.'
            : 'Record damaged, expired, or returned goods to keep inventory accurate.'}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 rounded-2xl border border-on-surface-variant/10 bg-surface p-1 w-fit">
        {(['damage', 'return'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); reset(); }}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition-all ${
              tab === t
                ? 'bg-primary text-white shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t === 'damage' ? <PackageX size={16} /> : <RotateCcw size={16} />}
            {t === 'damage'
              ? isVietnamese ? 'Hàng hỏng / hết hạn' : 'Damaged / Expired'
              : isVietnamese ? 'Hàng trả về' : 'Return goods'}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Product picker */}
        <section className="rounded-[2.5rem] border border-on-surface-variant/5 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
            {isVietnamese ? 'Chọn sản phẩm' : 'Select product'}
          </h2>

          <div className="relative mb-4">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-on-surface/10 bg-surface py-3 pl-10 pr-4 text-sm outline-none"
              placeholder={isVietnamese ? 'Tìm sản phẩm...' : 'Search products...'}
            />
          </div>

          <div className="max-h-[420px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="py-8 text-center text-sm text-on-surface-variant">
                <LoaderCircle size={18} className="mx-auto animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-on-surface-variant">
                {isVietnamese ? 'Không tìm thấy sản phẩm' : 'No products found'}
              </p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.productId}
                  type="button"
                  onClick={() => setSelectedProductId(p.productId)}
                  className={`w-full flex items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all ${
                    selectedProductId === p.productId
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-on-surface-variant/5 hover:bg-on-surface-variant/[0.02]'
                  }`}
                >
                  {p.primaryImageUrl ? (
                    <img src={p.primaryImageUrl} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-primary/10 shrink-0 flex items-center justify-center">
                      <PackageX size={20} className="text-primary/50" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-on-surface truncate">{p.productName}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant/60">
                      {isVietnamese ? 'Tồn kho' : 'In stock'}:{' '}
                      <span className={p.quantityAvailable <= 5 ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold'}>
                        {p.quantityAvailable}
                      </span>{' '}
                      {p.unit ?? ''}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Form */}
        <section className="rounded-[2.5rem] border border-on-surface-variant/5 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
            {tab === 'damage'
              ? isVietnamese ? 'Thông tin hàng hỏng' : 'Damage details'
              : isVietnamese ? 'Thông tin hàng trả' : 'Return details'}
          </h2>

          {selected ? (
            <div className="rounded-2xl bg-primary/5 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                {isVietnamese ? 'Sản phẩm đã chọn' : 'Selected product'}
              </p>
              <p className="mt-1 font-bold text-on-surface">{selected.productName}</p>
              <p className="mt-0.5 text-xs text-on-surface-variant/60">
                {isVietnamese ? 'Tồn kho hiện tại' : 'Current stock'}: {selected.quantityAvailable} {selected.unit ?? ''}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-on-surface-variant/20 px-4 py-6 text-center text-sm text-on-surface-variant/50">
              {isVietnamese ? 'Chưa chọn sản phẩm' : 'No product selected'}
            </div>
          )}

          <label className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
              {isVietnamese ? 'Số lượng *' : 'Quantity *'}
            </span>
            <input
              type="number"
              min="1"
              max={selected?.quantityAvailable ?? undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input-base"
            />
            {selected && Number(quantity) > selected.quantityAvailable && (
              <p className="flex items-center gap-1 text-xs text-red-500">
                <AlertTriangle size={12} />
                {isVietnamese
                  ? `Vượt quá tồn kho (${selected.quantityAvailable})`
                  : `Exceeds stock (${selected.quantityAvailable})`}
              </p>
            )}
          </label>

          {tab === 'return' && (
            <label className="grid gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
                {isVietnamese ? 'Mã đơn hàng liên quan' : 'Related order ID'}
              </span>
              <input
                value={relatedOrderId}
                onChange={(e) => setRelatedOrderId(e.target.value)}
                className="input-base"
                placeholder={isVietnamese ? 'Không bắt buộc' : 'Optional'}
              />
            </label>
          )}

          <label className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50">
              {tab === 'damage'
                ? isVietnamese ? 'Lý do hỏng' : 'Damage reason'
                : isVietnamese ? 'Ghi chú trả hàng' : 'Return note'}
            </span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="input-base resize-none"
              placeholder={
                tab === 'damage'
                  ? isVietnamese ? 'VD: Hàng bị vỡ khi vận chuyển...' : 'e.g., Broken during transport...'
                  : isVietnamese ? 'VD: Khách không nhận hàng...' : 'e.g., Customer refused delivery...'
              }
            />
          </label>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving || !selectedProductId}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-white disabled:opacity-50"
          >
            {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
            {tab === 'damage'
              ? isVietnamese ? 'Ghi nhận hàng hỏng' : 'Record damage'
              : isVietnamese ? 'Ghi nhận hàng trả' : 'Record return'}
          </button>
        </section>
      </div>
    </div>
  );
}
