import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Leaf,
  Minus,
  Plus,
  ShoppingCart,
  Heart,
  Star,
  Truck,
  ShieldCheck,
  ArrowLeft,
  Package,
} from 'lucide-react';
import { clientApi } from '../../lib/client-api';
import { useCart } from '../../hooks/useCart';
import { useClientSession } from '../../hooks/useClientSession';

type ProductImage = { _id: string; imageUrl: string; isPrimary: boolean; sortOrder: number };

type Product = {
  _id: string;
  productName: string;
  productSlug: string;
  productPrice: number;
  discountedPrice?: number;
  productDescription?: string;
  unit?: string;
  stock: number;
  isVisible: boolean;
  images?: ProductImage[];
  category?: { _id: string; categoryName: string; categorySlug: string };
  subcategory?: { _id: string; subcategoryName: string };
  origin?: { _id: string; originName: string };
  tags?: Array<{ _id: string; tagName: string }>;
  activeDiscount?: { discountPercent: number; discountName: string };
};

type RelatedProduct = {
  _id: string;
  productName: string;
  productPrice: number;
  discountedPrice?: number;
  images?: ProductImage[];
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useClientSession();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'info'>('desc');
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [addedMsg, setAddedMsg] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void clientApi
      .get<Product>(`/products/${id}`)
      .then((data) => {
        setProduct(data);
        if (data.category?._id) {
          void clientApi
            .get<{ items: RelatedProduct[] }>(`/products?categoryId=${data.category._id}&limit=4`)
            .then((r) => setRelated((r.items ?? []).filter((p) => p._id !== id)))
            .catch(() => {});
        }
      })
      .catch(() => { void navigate('/client/products'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!session) { void navigate('/client/login'); return; }
    setAdding(true);
    try {
      await addItem(id!, quantity);
      setAddedMsg(true);
      setTimeout(() => setAddedMsg(false), 2500);
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!session) { void navigate('/client/login'); return; }
    await addItem(id!, quantity);
    void navigate('/client/cart');
  };

  const handleWishlist = async () => {
    if (!session) { void navigate('/client/login'); return; }
    try {
      if (wishlisted) {
        await clientApi.delete(`/wishlist/${id}`);
      } else {
        await clientApi.post(`/wishlist/${id}`);
      }
      setWishlisted(!wishlisted);
    } catch {}
  };

  if (loading) {
    return (
      <div style={{ background: '#f2f0eb', minHeight: '60vh' }} className="flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#006241] border-t-transparent" />
      </div>
    );
  }

  if (!product) return null;

  const images = product.images ?? [];
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return a.sortOrder - b.sortOrder;
  });
  const currentImage = sortedImages[selectedImage]?.imageUrl;
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.productPrice;
  const displayPrice = hasDiscount
    ? (product.discountedPrice ?? product.productPrice)
    : product.productPrice;
  const savings = hasDiscount ? product.productPrice - (product.discountedPrice ?? 0) : 0;

  return (
    <div style={{ background: '#f2f0eb', minHeight: '80vh' }}>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/client/products" className="flex items-center gap-1 hover:text-[#006241]">
            <ArrowLeft size={14} /> Sản phẩm
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                to={`/client/products?categoryId=${product.category._id}`}
                className="hover:text-[#006241]"
              >
                {product.category.categoryName}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-[#1E3932] font-semibold line-clamp-1">{product.productName}</span>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Images */}
          <div>
            <div className="overflow-hidden rounded-2xl bg-white shadow-md">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.productName}
                  className="h-96 w-full object-contain p-4"
                />
              ) : (
                <div className="flex h-96 items-center justify-center">
                  <Leaf size={64} className="text-[#006241]/20" />
                </div>
              )}
            </div>
            {sortedImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {sortedImages.map((img, idx) => (
                  <button
                    key={img._id}
                    onClick={() => setSelectedImage(idx)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      selectedImage === idx ? 'border-[#006241]' : 'border-transparent'
                    }`}
                  >
                    <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.category && (
              <Link
                to={`/client/products?categoryId=${product.category._id}`}
                className="mb-2 inline-block text-xs font-bold uppercase tracking-wider text-[#006241] hover:underline"
              >
                {product.category.categoryName}
              </Link>
            )}
            <h1 className="text-2xl font-black leading-tight text-[#1E3932]">{product.productName}</h1>

            {/* Rating placeholder */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={14} fill={s <= 4 ? '#00754A' : 'none'} className="text-[#00754A]" />
                ))}
              </div>
              <span className="text-xs text-gray-400">(4.2 · 28 đánh giá)</span>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-end gap-3">
              <span className="text-3xl font-black text-[#006241]">{formatPrice(displayPrice)}</span>
              {hasDiscount && (
                <div className="flex flex-col">
                  <span className="text-sm text-gray-400 line-through">{formatPrice(product.productPrice)}</span>
                  <span className="text-xs font-bold text-[#c82014]">
                    Tiết kiệm {formatPrice(savings)} ({product.activeDiscount?.discountPercent}%)
                  </span>
                </div>
              )}
            </div>
            {product.activeDiscount && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#c82014]/10 px-3 py-1 text-xs font-bold text-[#c82014]">
                🏷️ {product.activeDiscount.discountName}
              </div>
            )}

            {/* Details quick */}
            <div className="mt-5 space-y-2 rounded-2xl bg-white p-4">
              {product.origin && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Xuất xứ</span>
                  <span className="font-semibold text-[#1E3932]">{product.origin.originName}</span>
                </div>
              )}
              {product.unit && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Đơn vị</span>
                  <span className="font-semibold text-[#1E3932]">{product.unit}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Tình trạng</span>
                {product.stock > 0 ? (
                  <span className="font-semibold text-[#006241]">
                    Còn hàng ({product.stock} {product.unit ?? 'sản phẩm'})
                  </span>
                ) : (
                  <span className="font-semibold text-[#c82014]">Hết hàng</span>
                )}
              </div>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span
                    key={tag._id}
                    className="rounded-full border border-[#006241]/20 bg-white px-2.5 py-1 text-xs text-[#006241]"
                  >
                    {tag.tagName}
                  </span>
                ))}
              </div>
            )}

            {/* Quantity */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-[#1E3932]">Số lượng</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#1E3932] transition hover:border-[#006241]"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center text-lg font-bold text-[#1E3932]">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#1E3932] transition hover:border-[#006241] disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => void handleAddToCart()}
                disabled={adding || product.stock === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#006241] py-3.5 text-sm font-bold text-[#006241] transition hover:bg-[#006241] hover:text-white disabled:opacity-50 active:scale-95"
              >
                <ShoppingCart size={18} />
                {adding ? 'Đang thêm...' : addedMsg ? '✓ Đã thêm!' : 'Thêm vào giỏ'}
              </button>
              <button
                onClick={() => void handleBuyNow()}
                disabled={product.stock === 0}
                className="flex flex-1 items-center justify-center rounded-full py-3.5 text-sm font-bold text-white transition disabled:opacity-50 active:scale-95"
                style={{ background: '#00754A' }}
              >
                Mua ngay
              </button>
              <button
                onClick={() => void handleWishlist()}
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition ${
                  wishlisted
                    ? 'border-pink-300 bg-pink-50 text-pink-500'
                    : 'border-black/10 bg-white text-gray-400 hover:text-pink-400'
                }`}
              >
                <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Trust */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              {[
                { icon: ShieldCheck, text: 'Cam kết chính hãng' },
                { icon: Truck, text: 'Giao hàng 2–4 ngày' },
                { icon: Package, text: 'Đổi trả trong 7 ngày' },
                { icon: Leaf, text: 'Sản phẩm chứng nhận' },
              ].map((t) => (
                <div key={t.text} className="flex items-center gap-2 rounded-xl bg-white p-3 text-xs text-gray-500">
                  <t.icon size={14} className="shrink-0 text-[#006241]" />
                  {t.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-10 rounded-2xl bg-white">
          <div className="flex border-b border-black/5">
            {([
              { key: 'desc', label: 'Mô tả sản phẩm' },
              { key: 'info', label: 'Thông tin thêm' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-4 text-sm font-bold transition-all ${
                  activeTab === tab.key
                    ? 'border-b-2 border-[#006241] text-[#006241]'
                    : 'text-gray-400 hover:text-[#1E3932]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {activeTab === 'desc' ? (
              product.productDescription ? (
                <div
                  className="prose max-w-none text-sm text-gray-600"
                  dangerouslySetInnerHTML={{ __html: product.productDescription }}
                />
              ) : (
                <p className="text-sm text-gray-400 italic">Chưa có mô tả cho sản phẩm này.</p>
              )
            ) : (
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Tên sản phẩm', value: product.productName },
                  { label: 'Xuất xứ', value: product.origin?.originName ?? '—' },
                  { label: 'Đơn vị', value: product.unit ?? '—' },
                  { label: 'Danh mục', value: product.category?.categoryName ?? '—' },
                  { label: 'Danh mục phụ', value: product.subcategory?.subcategoryName ?? '—' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between border-b border-black/5 pb-3">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="font-semibold text-[#1E3932]">{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-xl font-black text-[#1E3932]">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((p) => {
                const img = p.images?.find((i) => i.isPrimary)?.imageUrl ?? p.images?.[0]?.imageUrl;
                return (
                  <Link
                    key={p._id}
                    to={`/client/products/${p._id}`}
                    className="group overflow-hidden rounded-2xl border border-black/5 bg-white transition-all hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="overflow-hidden bg-[#f2f0eb]">
                      {img ? (
                        <img
                          src={img}
                          alt={p.productName}
                          className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-36 items-center justify-center">
                          <Leaf size={32} className="text-[#006241]/20" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="line-clamp-2 text-xs font-semibold text-[#1E3932]">{p.productName}</p>
                      <p className="mt-1 text-sm font-black text-[#006241]">
                        {formatPrice(p.discountedPrice ?? p.productPrice)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
