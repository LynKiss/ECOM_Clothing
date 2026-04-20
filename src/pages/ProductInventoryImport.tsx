import { useEffect, useMemo, useState } from 'react';
import { Barcode, LoaderCircle, PackagePlus, ScanLine } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useLanguage } from '../i18n/language-context';
import { useToast } from '../hooks/useToast';

type Product = {
  productId: string;
  productName: string;
  productPrice: string;
  productPriceSale: string | null;
  quantityAvailable: number;
  unit: string | null;
  primaryImageUrl?: string | null;
};

type ProductResponse = {
  items: Product[];
};

export default function ProductInventoryImport() {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const isVietnamese = language === 'vi';
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        const data = await apiClient.get<ProductResponse>(
          '/products?includeHidden=true&page=1&limit=100',
        );
        if (!cancelled) {
          setProducts(data.items);
        }
      } catch (error) {
        if (!cancelled) {
          showToast({
            tone: 'error',
            title: isVietnamese ? 'Tải sản phẩm thất bại' : 'Unable to load products',
            description: error instanceof Error ? error.message : 'Unexpected error',
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, [isVietnamese, showToast]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        product.productName.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [products, search],
  );
  const selectedProduct =
    products.find((product) => product.productId === selectedProductId) ?? null;

  async function handleImport() {
    if (!selectedProductId || Number(quantity) < 1) {
      showToast({
        tone: 'error',
        title: isVietnamese ? 'Thiếu dữ liệu nhập kho' : 'Missing import data',
        description: isVietnamese
          ? 'Cần chọn sản phẩm và số lượng lớn hơn 0.'
          : 'Select a product and enter a quantity above 0.',
      });
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/inventory/transactions/import', {
        productId: selectedProductId,
        quantity: Number(quantity),
        note: note.trim() || undefined,
      });

      showToast({
        tone: 'success',
        title: isVietnamese ? 'Đã cập nhật tồn kho' : 'Inventory updated',
        description: selectedProduct?.productName ?? selectedProductId,
      });
      setQuantity('1');
      setNote('');
    } catch (error) {
      showToast({
        tone: 'error',
        title: isVietnamese ? 'Nhập kho thất bại' : 'Import failed',
        description: error instanceof Error ? error.message : 'Unexpected error',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="font-headline text-[2.7rem] font-black tracking-tight text-primary">
          {isVietnamese ? 'Nhập Kho Sản Phẩm' : 'Import Product Inventory'}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-on-surface-variant">
          {isVietnamese
            ? 'Page này tập trung cho thao tác nhập kho nhanh. Có thể tìm sản phẩm, chọn số lượng và ghi chú cho giao dịch.'
            : 'Use this page for quick inventory imports. Search products, set the quantity, and keep a note for the transaction.'}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2.5rem] border border-on-surface-variant/5 bg-white p-6 shadow-sm">
          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">
                {isVietnamese ? 'Tìm sản phẩm' : 'Search product'}
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  isVietnamese ? 'Nhập tên sản phẩm...' : 'Type a product name...'
                }
                className="rounded-2xl border border-on-surface/10 bg-surface px-4 py-3 text-sm outline-none"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">
                {isVietnamese ? 'Danh sách sản phẩm' : 'Product list'}
              </span>
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className="rounded-2xl border border-on-surface/10 bg-surface px-4 py-3 text-sm outline-none"
              >
                <option value="">
                  {isVietnamese ? 'Chọn sản phẩm' : 'Select a product'}
                </option>
                {filteredProducts.map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.productName}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">
                  {isVietnamese ? 'Số lượng nhập' : 'Import quantity'}
                </span>
                <input
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  type="number"
                  min="1"
                  className="rounded-2xl border border-on-surface/10 bg-surface px-4 py-3 text-sm outline-none"
                />
              </label>

              <div className="rounded-[1.5rem] border border-on-surface/10 bg-surface px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">
                  {isVietnamese ? 'Chế độ thao tác' : 'Operation mode'}
                </p>
                <p className="mt-2 text-sm font-semibold text-on-surface">
                  {isVietnamese ? 'Nhập kho thủ công / máy quét' : 'Manual / scanner intake'}
                </p>
              </div>
            </div>

            <label className="grid gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">
                {isVietnamese ? 'Ghi chú giao dịch' : 'Transaction note'}
              </span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                className="rounded-2xl border border-on-surface/10 bg-surface px-4 py-3 text-sm outline-none"
              />
            </label>

            <button
              type="button"
              onClick={() => void handleImport()}
              disabled={saving || loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-primary-container px-6 py-3 text-sm font-black text-white shadow-xl shadow-primary/20 disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <PackagePlus size={18} />
              )}
              <span>
                {isVietnamese
                  ? 'Cập nhật số lượng tồn kho'
                  : 'Update inventory quantity'}
              </span>
            </button>
          </div>
        </section>

        <section className="rounded-[2.5rem] border border-on-surface-variant/5 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ScanLine size={22} />
            </div>
            <div>
              <p className="font-black text-on-surface">
                {isVietnamese ? 'Preview sản phẩm' : 'Product preview'}
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {isVietnamese
                  ? 'Thông tin sản phẩm được chọn cho phiên nhập kho.'
                  : 'The currently selected product for this inventory session.'}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-on-surface/10 bg-surface p-5">
            {loading ? (
              <div className="py-12 text-center text-sm text-on-surface-variant">
                {isVietnamese
                  ? 'Đang tải danh sách sản phẩm...'
                  : 'Loading products...'}
              </div>
            ) : selectedProduct ? (
              <div className="grid gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white">
                    {selectedProduct.primaryImageUrl ? (
                      <img
                        src={selectedProduct.primaryImageUrl}
                        alt={selectedProduct.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Barcode size={24} className="text-on-surface-variant/40" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-black text-on-surface">
                      {selectedProduct.productName}
                    </p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {selectedProduct.productId}
                    </p>
                  </div>
                </div>

                <dl className="grid gap-3 md:grid-cols-2">
                  <InfoCard
                    label={isVietnamese ? 'Tồn hiện tại' : 'Current stock'}
                    value={`${selectedProduct.quantityAvailable}`}
                  />
                  <InfoCard
                    label={isVietnamese ? 'Đơn vị' : 'Unit'}
                    value={selectedProduct.unit || '-'}
                  />
                  <InfoCard
                    label={isVietnamese ? 'Giá bán' : 'Price'}
                    value={selectedProduct.productPrice}
                  />
                  <InfoCard
                    label={isVietnamese ? 'Giá giảm' : 'Sale price'}
                    value={selectedProduct.productPriceSale || '-'}
                  />
                </dl>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-on-surface-variant">
                {isVietnamese
                  ? 'Chọn một sản phẩm để xem thông tin.'
                  : 'Select a product to preview its data.'}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-on-surface/10 bg-white px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant/50">
        {label}
      </p>
      <p className="mt-2 text-sm font-bold text-on-surface">{value}</p>
    </div>
  );
}
