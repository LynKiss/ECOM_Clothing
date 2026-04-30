import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Camera,
  LoaderCircle,
  RotateCcw,
  Search,
  Shirt,
  Sparkles,
  Upload,
} from 'lucide-react';
import { clientApi } from '../../lib/client-api';
import {
  createVirtualTryOnSession,
  getVirtualTryOnErrorMessage,
  getVirtualTryOnWarningLabel,
  type VirtualTryOnResult,
} from '../../lib/virtual-try-on';

type VariantImage = { imageId: string; imageUrl: string; sortOrder: number };
type ColorOption = { colorId: string; colorName: string; colorCode: string | null };
type SizeOption = { sizeId: string; sizeName: string; sizeCode: string | null };
type ProductVariant = {
  variantId: string;
  sku: string | null;
  price: string | null;
  salePrice: string | null;
  stockQuantity: number;
  isActive: boolean;
  color: ColorOption | null;
  size: SizeOption | null;
  images?: VariantImage[];
};
type Product = {
  productId: string;
  productName: string;
  effectivePrice: string;
  basePrice?: string;
  primaryImageUrl: string | null;
  quantityAvailable: number;
  variants?: ProductVariant[];
};

function money(value: number | string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value));
}

function validateImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP';
  }
  if (file.size > 8 * 1024 * 1024) {
    return 'Ảnh không được vượt quá 8MB';
  }
  return null;
}

function productImage(product: Product | null, variant: ProductVariant | null) {
  return variant?.images?.[0]?.imageUrl ?? product?.primaryImageUrl ?? null;
}

export default function VirtualTryOn() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [query, setQuery] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<VirtualTryOnResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingProducts(true);
    clientApi
      .get<{ items: Product[] }>(`/products?limit=24${query.trim() ? `&search=${encodeURIComponent(query.trim())}` : ''}`)
      .then((data) => {
        if (cancelled) return;
        const items = data.items ?? [];
        setProducts(items);
        setSelectedProductId((current) => current || items[0]?.productId || '');
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const selectedProduct = products.find((item) => item.productId === selectedProductId) ?? null;
  const activeVariants = selectedProduct?.variants?.filter((variant) => variant.isActive) ?? [];
  const selectedVariant =
    activeVariants.find((variant) => variant.variantId === selectedVariantId) ??
    activeVariants.find((variant) => variant.stockQuantity > 0) ??
    activeVariants[0] ??
    null;
  const garmentImage = productImage(selectedProduct, selectedVariant);
  const outputImage = result?.resultImageUrl ?? result?.resultImageDataUrl ?? null;

  useEffect(() => {
    if (!selectedProduct) return;
    const firstVariant =
      selectedProduct.variants?.find((variant) => variant.isActive && variant.stockQuantity > 0) ??
      selectedProduct.variants?.find((variant) => variant.isActive);
    setSelectedVariantId(firstVariant?.variantId ?? '');
    setResult(null);
    setError(null);
  }, [selectedProduct?.productId]);

  const groupedVariants = useMemo(() => activeVariants.slice(0, 24), [activeVariants]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!nextFile) return;

    const validation = validateImage(nextFile);
    if (validation) {
      setError(validation);
      setFile(null);
      setPreviewUrl(null);
      setResult(null);
      return;
    }

    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setResult(null);
    setError(null);
  }

  function reset() {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  }

  async function submit() {
    if (!selectedProduct) {
      setError('Vui lòng chọn sản phẩm');
      return;
    }
    if (!garmentImage) {
      setError('Sản phẩm cần có ảnh để thử đồ');
      return;
    }
    if (!file) {
      setError('Vui lòng chọn ảnh của bạn');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const nextResult = await createVirtualTryOnSession({
        productId: selectedProduct.productId,
        variantId: selectedVariant?.variantId,
        personImage: file,
        posePreference: 'auto',
      });
      setResult(nextResult);
    } catch (err) {
      setError(err instanceof Error ? getVirtualTryOnErrorMessage(err.message) : 'Không thể tạo ảnh thử đồ');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="client-surface min-h-[80vh]">
      <section className="border-b border-black/8 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 lg:px-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#DBEAFE] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#2563EB]">
            <Camera size={14} /> Virtual Try-on
          </span>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black text-[#0B0F19] lg:text-4xl">Thử đồ bằng ảnh</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Chọn sản phẩm, tải ảnh toàn thân rõ sáng, hệ thống sẽ tạo ảnh mặc thử để bạn kiểm tra màu sắc và form dáng.
              </p>
            </div>
            <Link to="/client/products" className="client-pill-outline inline-flex items-center justify-center px-5 py-2.5 text-sm font-black">
              Chọn thêm sản phẩm
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[360px_1fr] lg:px-6">
        <aside className="space-y-4">
          <form
            onSubmit={(event) => event.preventDefault()}
            className="flex h-11 items-center rounded-full border border-black/10 bg-white px-4"
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm sản phẩm..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <Search size={16} className="text-[#2563EB]" />
          </form>

          <div className="client-card-soft max-h-[640px] overflow-y-auto p-3">
            {loadingProducts ? (
              <div className="flex items-center justify-center py-10">
                <LoaderCircle size={24} className="animate-spin text-[#2563EB]" />
              </div>
            ) : products.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">Không tìm thấy sản phẩm.</p>
            ) : (
              <div className="space-y-2">
                {products.map((product) => (
                  <button
                    key={product.productId}
                    type="button"
                    onClick={() => setSelectedProductId(product.productId)}
                    className={`flex w-full gap-3 rounded-xl border p-2 text-left transition ${
                      selectedProductId === product.productId
                        ? 'border-[#2563EB] bg-[#DBEAFE]/35'
                        : 'border-transparent hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F8FAFC]">
                      {product.primaryImageUrl ? (
                        <img src={product.primaryImageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Shirt size={22} className="text-[#2563EB]/25" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-bold text-[#0B0F19]">{product.productName}</p>
                      <p className="mt-1 text-sm font-black text-[#2563EB]">{money(product.effectivePrice)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="client-card-soft p-4">
              <p className="mb-3 text-sm font-black text-[#0B0F19]">Màu / size</p>
              {groupedVariants.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {groupedVariants.map((variant) => (
                    <button
                      key={variant.variantId}
                      type="button"
                      disabled={variant.stockQuantity <= 0}
                      onClick={() => {
                        setSelectedVariantId(variant.variantId);
                        setResult(null);
                      }}
                      className={`rounded-full border px-4 py-2 text-xs font-black transition disabled:opacity-35 ${
                        selectedVariant?.variantId === variant.variantId
                          ? 'border-[#2563EB] bg-[#2563EB] text-white'
                          : 'border-black/10 bg-white text-[#0B0F19]'
                      }`}
                    >
                      {[variant.color?.colorName, variant.size?.sizeCode ?? variant.size?.sizeName]
                        .filter(Boolean)
                        .join(' / ') || variant.sku || 'Mặc định'}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Sản phẩm không có biến thể.</p>
              )}
            </div>

            <div className="client-card-soft p-4">
              <p className="mb-3 text-sm font-black text-[#0B0F19]">Ảnh sản phẩm</p>
              <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-[#F8FAFC]">
                {garmentImage ? (
                  <img src={garmentImage} alt={selectedProduct?.productName ?? ''} className="h-full w-full object-contain" />
                ) : (
                  <Shirt size={44} className="text-[#2563EB]/25" />
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="client-card-soft p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-black text-[#0B0F19]">Ảnh của bạn</p>
                  <button type="button" onClick={() => inputRef.current?.click()} className="text-xs font-black text-[#2563EB]">
                    Chọn ảnh
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#2563EB]/40 bg-[#F8FAFC] text-[#2563EB]"
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Ảnh người mặc" className="h-full w-full object-contain" />
                  ) : (
                    <span className="flex flex-col items-center gap-3 text-sm font-black">
                      <Upload size={28} /> Tải ảnh
                    </span>
                  )}
                </button>
                <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
              </div>

              <div className="client-card-soft p-4">
                <p className="mb-3 text-sm font-black text-[#0B0F19]">Kết quả</p>
                <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl bg-[#0B0F19]">
                  {outputImage ? (
                    <img src={outputImage} alt="Ket qua thu do" className="h-full w-full object-contain" />
                  ) : submitting ? (
                    <div className="flex flex-col items-center gap-3 text-white">
                      <LoaderCircle size={30} className="animate-spin" />
                      <span className="text-sm font-semibold">Đang tạo ảnh</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-white/65">
                      <Sparkles size={32} />
                      <span className="text-sm font-semibold">Chưa có kết quả</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="client-card-soft p-4">
                <p className="text-sm font-black text-[#0B0F19]">{result.advisory.headline}</p>
                <p className="mt-2 text-xs leading-5 text-gray-500">{result.advisory.disclaimer}</p>
                {result.warnings.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.warnings.map((warning) => (
                      <span key={warning} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        {getVirtualTryOnWarningLabel(warning)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={reset}
                disabled={submitting || (!file && !result && !error)}
                className="client-pill-outline inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-black disabled:opacity-45"
              >
                <RotateCcw size={16} /> Làm lại
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={submitting || !file || !selectedProduct || !garmentImage}
                className="client-pill-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-black disabled:opacity-45"
              >
                {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {submitting ? 'Đang tạo...' : 'Tạo thử đồ'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
