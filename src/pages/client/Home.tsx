import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Leaf,
  ShieldCheck,
  Truck,
  HeadphonesIcon,
  Star,
  ChevronRight,
  Sprout,
  FlaskConical,
  TreePine,
  Droplets,
} from 'lucide-react';
import { clientApi } from '../../lib/client-api';
import { useCart } from '../../hooks/useCart';
import { useClientSession } from '../../hooks/useClientSession';

type Product = {
  _id: string;
  productName: string;
  productSlug: string;
  productPrice: number;
  discountedPrice?: number;
  images?: Array<{ imageUrl: string; isPrimary: boolean }>;
  category?: { categoryName: string };
  activeDiscount?: { discountPercent: number };
};

type NewsItem = {
  _id: string;
  title: string;
  subTitle?: string;
  slug: string;
  titleImageUrl?: string;
  createdAt: string;
};

type Category = {
  _id: string;
  categoryName: string;
  categorySlug: string;
  categoryDescription?: string;
};

const CATEGORY_ICONS: Record<string, typeof Leaf> = {
  default: Leaf,
  phan: FlaskConical,
  thuoc: ShieldCheck,
  hat: Sprout,
  cay: TreePine,
  tuoi: Droplets,
};

function getCategoryIcon(slug: string) {
  const key = Object.keys(CATEGORY_ICONS).find((k) => slug.includes(k));
  return CATEGORY_ICONS[key ?? 'default'];
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: () => void }) {
  const primaryImage = product.images?.find((i) => i.isPrimary)?.imageUrl ?? product.images?.[0]?.imageUrl;
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.productPrice;

  return (
    <div className="group overflow-hidden rounded-2xl border border-black/8 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative overflow-hidden bg-[#f2f0eb]">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.productName}
            className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-52 items-center justify-center">
            <Leaf size={48} className="text-[#006241]/20" />
          </div>
        )}
        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-[#c82014] px-2.5 py-1 text-[11px] font-black text-white">
            -{product.activeDiscount?.discountPercent ?? 0}%
          </span>
        )}
      </div>

      <div className="p-4">
        {product.category && (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#006241]/60">
            {product.category.categoryName}
          </p>
        )}
        <h3 className="line-clamp-2 text-sm font-bold text-[#1E3932]">{product.productName}</h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-base font-black text-[#006241]">
            {formatPrice(hasDiscount ? (product.discountedPrice ?? product.productPrice) : product.productPrice)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.productPrice)}
            </span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <Link
            to={`/client/products/${product._id}`}
            className="flex-1 rounded-full py-2 text-center text-xs font-bold text-[#006241] border border-[#006241] transition hover:bg-[#006241] hover:text-white"
          >
            Xem chi tiết
          </Link>
          <button
            onClick={onAddToCart}
            className="flex-1 rounded-full py-2 text-xs font-bold text-white transition active:scale-95"
            style={{ background: '#00754A' }}
          >
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { session } = useClientSession();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    void clientApi
      .get<{ items: Product[]; total: number }>('/products?limit=8&page=1')
      .then((d) => setProducts(d.items ?? []))
      .catch(() => {});

    void clientApi
      .get<NewsItem[]>('/news?limit=3&status=published')
      .then((d) => setNews(Array.isArray(d) ? d : []))
      .catch(() => {});

    void clientApi
      .get<Category[]>('/categories')
      .then((d) => setCategories(Array.isArray(d) ? d.slice(0, 8) : []))
      .catch(() => {});
  }, []);

  const handleAddToCart = async (productId: string) => {
    if (!session) {
      window.location.href = '/client/login';
      return;
    }
    setAddingId(productId);
    try {
      await addItem(productId, 1);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div>
      {/* Keyframe animations */}
      <style>{`
        @keyframes floatUp {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(3deg); }
        }
        @keyframes leafDrift {
          0% { transform: translateY(0) translateX(0) rotate(0deg) scale(1); opacity: 0.8; }
          100% { transform: translateY(-120px) translateX(30px) rotate(40deg) scale(0.6); opacity: 0; }
        }
        @keyframes spinSlow {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
        @keyframes fieldPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .float-box { animation: floatUp 5s ease-in-out infinite; }
        .leaf-1 { animation: leafDrift 4s ease-in-out infinite; }
        .leaf-2 { animation: leafDrift 5s ease-in-out 1s infinite; }
        .leaf-3 { animation: leafDrift 3.5s ease-in-out 2s infinite; }
        .leaf-4 { animation: leafDrift 4.5s ease-in-out 0.5s infinite; }
      `}</style>

      {/* ===== HERO ===== */}
      <section style={{ background: '#1E3932' }} className="relative overflow-hidden">
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div
          className="absolute bottom-0 left-0 h-64 w-64 rounded-full opacity-20"
          style={{ background: '#006241', filter: 'blur(80px)' }}
        />
        <div
          className="absolute right-1/3 top-0 h-96 w-96 rounded-full opacity-10"
          style={{ background: '#00754A', filter: 'blur(100px)' }}
        />

        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left: Copy */}
            <div>
              <div
                className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold"
                style={{ background: 'rgba(0,117,74,0.3)', color: '#d4e9e2' }}
              >
                <Leaf size={12} />
                Nông nghiệp bền vững · Chất lượng được chứng nhận
              </div>
              <h1 className="text-4xl font-black leading-tight text-white lg:text-6xl">
                Mọi mùa vụ
                <br />
                <span style={{ color: '#d4e9e2' }}>đều bắt đầu</span>
                <br />
                từ đây.
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
                Cung cấp đầy đủ vật tư nông nghiệp — phân bón, thuốc BVTV, hạt giống, dụng cụ —
                chính hãng, giá tốt, giao nhanh toàn quốc.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/client/products"
                  className="flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:opacity-90 active:scale-95"
                  style={{ background: '#00754A' }}
                >
                  Khám phá ngay <ArrowRight size={16} />
                </Link>
                <Link
                  to="/client/news"
                  className="flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-bold transition-all hover:-translate-y-0.5 active:scale-95"
                  style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)' }}
                >
                  Đọc tin tức
                </Link>
              </div>
              {/* Trust badges */}
              <div className="mt-10 flex flex-wrap gap-6">
                {[
                  { icon: '🌿', text: '100% chính hãng' },
                  { icon: '🚚', text: 'Giao hàng 2–4 ngày' },
                  { icon: '⭐', text: '15.000+ khách hàng' },
                ].map((b) => (
                  <div key={b.text} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    <span className="text-base">{b.icon}</span>
                    {b.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 3D Scene */}
            <div className="flex items-center justify-center">
              <div style={{ perspective: '1200px' }} className="relative h-80 w-80">
                {/* Floating leaves */}
                <div className="leaf-1 absolute left-4 top-10 text-2xl select-none">🌿</div>
                <div className="leaf-2 absolute right-8 top-6 text-xl select-none">🍃</div>
                <div className="leaf-3 absolute left-12 bottom-16 text-lg select-none">🌱</div>
                <div className="leaf-4 absolute right-4 bottom-20 text-2xl select-none">🌾</div>

                {/* Main 3D crate */}
                <div
                  className="float-box absolute left-1/2 top-1/2"
                  style={{
                    transform: 'translate(-50%, -50%) rotateX(10deg) rotateY(-15deg)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Front face */}
                  <div
                    className="relative flex h-52 w-44 flex-col items-center justify-center overflow-hidden rounded-2xl"
                    style={{
                      background: 'linear-gradient(145deg, #2d5a3d, #1a3d2a)',
                      boxShadow: '8px 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    <div
                      className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                      style={{ background: 'rgba(0,117,74,0.4)', border: '1px solid rgba(0,117,74,0.5)' }}
                    >
                      <span className="text-4xl">🌾</span>
                    </div>
                    <p className="text-center text-xs font-black uppercase tracking-widest text-white/80">
                      Phân bón
                    </p>
                    <p className="text-center text-[11px] text-white/40">Hữu cơ · Sinh học</p>
                    <div className="mt-3 flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={8} fill="#d4e9e2" className="text-[#d4e9e2]" />
                      ))}
                    </div>
                    {/* Shine effect */}
                    <div
                      className="absolute inset-0 rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)',
                      }}
                    />
                  </div>

                  {/* Right face (3D depth) */}
                  <div
                    className="absolute right-0 top-0 h-52 w-8 rounded-r-2xl"
                    style={{
                      transform: 'translateX(28px) rotateY(90deg)',
                      transformOrigin: 'left center',
                      background: 'linear-gradient(180deg, #163326, #0d2219)',
                      boxShadow: 'inset -2px 0 8px rgba(0,0,0,0.4)',
                    }}
                  />

                  {/* Bottom face */}
                  <div
                    className="absolute bottom-0 left-0 w-44 h-8 rounded-b-2xl"
                    style={{
                      transform: 'translateY(28px) rotateX(-90deg)',
                      transformOrigin: 'top center',
                      background: 'linear-gradient(90deg, #163326, #0d2219)',
                    }}
                  />
                </div>

                {/* Secondary floating product */}
                <div
                  className="absolute right-0 top-8"
                  style={{
                    transform: 'rotateX(8deg) rotateY(10deg)',
                    animation: 'floatUp 7s ease-in-out 1.5s infinite',
                  }}
                >
                  <div
                    className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl"
                    style={{
                      background: 'linear-gradient(145deg, #1a4d3a, #0f2e22)',
                      boxShadow: '4px 4px 16px rgba(0,0,0,0.35)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <span className="text-2xl">💧</span>
                    <p className="mt-1 text-[9px] font-bold text-white/60">Thuốc BVTV</p>
                  </div>
                </div>

                {/* Third floating product */}
                <div
                  className="absolute left-0 bottom-10"
                  style={{
                    transform: 'rotateX(5deg) rotateY(-8deg)',
                    animation: 'floatUp 6s ease-in-out 0.8s infinite',
                  }}
                >
                  <div
                    className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl"
                    style={{
                      background: 'linear-gradient(145deg, #2a4a20, #1a3012)',
                      boxShadow: '4px 4px 16px rgba(0,0,0,0.35)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <span className="text-2xl">🌱</span>
                    <p className="mt-1 text-[9px] font-bold text-white/60">Hạt giống</p>
                  </div>
                </div>

                {/* Field grid (3D perspective plane) */}
                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: '60px',
                    background:
                      'linear-gradient(transparent, rgba(0,98,65,0.2))',
                    transform: 'rotateX(60deg)',
                    transformOrigin: 'bottom center',
                    backgroundImage:
                      'repeating-linear-gradient(90deg, rgba(0,117,74,0.15) 0px, rgba(0,117,74,0.15) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(180deg, rgba(0,117,74,0.15) 0px, rgba(0,117,74,0.15) 1px, transparent 1px, transparent 20px)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <svg viewBox="0 0 1440 80" className="block w-full" style={{ marginBottom: '-2px' }}>
          <path fill="#f2f0eb" d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </section>

      {/* ===== CATEGORIES ===== */}
      {categories.length > 0 && (
        <section style={{ background: '#f2f0eb' }} className="py-14">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: '#006241' }}>
                  Danh mục
                </p>
                <h2 className="text-3xl font-black" style={{ color: '#1E3932' }}>
                  Tìm theo nhóm sản phẩm
                </h2>
              </div>
              <Link
                to="/client/products"
                className="hidden items-center gap-1 text-sm font-bold transition hover:gap-2 sm:flex"
                style={{ color: '#006241' }}
              >
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {categories.map((cat) => {
                const Icon = getCategoryIcon(cat.categorySlug);
                return (
                  <Link
                    key={cat._id}
                    to={`/client/products?categoryId=${cat._id}`}
                    className="group flex flex-col items-center gap-3 rounded-2xl bg-white p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200 group-hover:scale-110"
                      style={{ background: '#d4e9e2' }}
                    >
                      <Icon size={22} style={{ color: '#006241' }} />
                    </div>
                    <p className="text-xs font-bold leading-tight" style={{ color: '#1E3932' }}>
                      {cat.categoryName}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="py-16" style={{ background: '#fff' }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: '#006241' }}>
                Nổi bật
              </p>
              <h2 className="text-3xl font-black" style={{ color: '#1E3932' }}>
                Sản phẩm bán chạy
              </h2>
            </div>
            <Link
              to="/client/products"
              className="hidden items-center gap-1 text-sm font-bold transition hover:gap-2 sm:flex"
              style={{ color: '#006241' }}
            >
              Xem tất cả <ChevronRight size={16} />
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-[#f2f0eb] h-72 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.slice(0, 8).map((p) => (
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore – React 19 key prop type quirk
                <ProductCard
                  key={p._id}
                  product={p}
                  onAddToCart={() => void handleAddToCart(p._id)}
                />
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              to="/client/products"
              className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-95"
              style={{ background: '#00754A' }}
            >
              Xem tất cả sản phẩm <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section style={{ background: '#1E3932' }} className="relative overflow-hidden py-16">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: '#d4e9e2' }}>
              Tại sao chọn chúng tôi
            </p>
            <h2 className="text-3xl font-black text-white">Cam kết từ chúng tôi</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                emoji: '✅',
                title: 'Hàng chính hãng 100%',
                desc: 'Toàn bộ sản phẩm có giấy chứng nhận và nguồn gốc rõ ràng. Cam kết không hàng giả, hàng nhái.',
              },
              {
                icon: Truck,
                emoji: '🚚',
                title: 'Giao hàng toàn quốc',
                desc: 'Đối tác vận chuyển uy tín, giao hàng 2–4 ngày. Miễn phí vận chuyển đơn hàng từ 500.000đ.',
              },
              {
                icon: HeadphonesIcon,
                emoji: '🎧',
                title: 'Hỗ trợ kỹ thuật',
                desc: 'Đội ngũ kỹ sư nông nghiệp tư vấn trực tiếp. Hotline miễn phí 1800 6863, hỗ trợ 7 ngày/tuần.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl p-6 text-center"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
                  style={{ background: 'rgba(0,117,74,0.3)' }}
                >
                  {item.emoji}
                </div>
                <h3 className="mb-2 font-black text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROMO BANNER ===== */}
      <section
        className="py-0"
        style={{
          background: 'linear-gradient(135deg, #006241 0%, #00754A 100%)',
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em] text-white/60">
                Ưu đãi đặc biệt
              </p>
              <h2 className="text-2xl font-black text-white">
                Giảm tới 30% khi mua combo phân bón 🌿
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Áp dụng cho đơn hàng từ 2 triệu đồng. Số lượng có hạn.
              </p>
            </div>
            <Link
              to="/client/products"
              className="shrink-0 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#006241] transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
            >
              Mua ngay →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== NEWS ===== */}
      {news.length > 0 && (
        <section style={{ background: '#f2f0eb' }} className="py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: '#006241' }}>
                  Tin tức & Kiến thức
                </p>
                <h2 className="text-3xl font-black" style={{ color: '#1E3932' }}>
                  Nông nghiệp hôm nay
                </h2>
              </div>
              <Link
                to="/client/news"
                className="hidden items-center gap-1 text-sm font-bold transition hover:gap-2 sm:flex"
                style={{ color: '#006241' }}
              >
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {news.map((article, idx) => (
                <Link
                  key={article._id}
                  to={`/client/news/${article.slug}`}
                  className="group overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative overflow-hidden" style={{ background: '#d4e9e2' }}>
                    {article.titleImageUrl ? (
                      <img
                        src={article.titleImageUrl}
                        alt={article.title}
                        className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-44 items-center justify-center">
                        <span className="text-5xl">{['🌾', '🌿', '🚜'][idx % 3]}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#006241' }}>
                      {new Date(article.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <h3 className="line-clamp-2 font-bold" style={{ color: '#1E3932' }}>
                      {article.title}
                    </h3>
                    {article.subTitle && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-500">{article.subTitle}</p>
                    )}
                    <p className="mt-3 flex items-center gap-1 text-xs font-bold" style={{ color: '#006241' }}>
                      Đọc tiếp <ArrowRight size={12} />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== NEWSLETTER ===== */}
      <section style={{ background: '#fff' }} className="py-16">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <span className="text-4xl">📬</span>
          <h2 className="mt-4 text-2xl font-black" style={{ color: '#1E3932' }}>
            Nhận thông tin khuyến mãi
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Đăng ký email để nhận ưu đãi độc quyền và kiến thức nông nghiệp mỗi tuần.
          </p>
          <form
            className="mt-6 flex gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Nhập email của bạn..."
              className="flex-1 rounded-full border border-black/10 bg-[#f2f0eb] px-5 py-3 text-sm outline-none focus:border-[#006241]"
            />
            <button
              type="submit"
              className="rounded-full px-6 py-3 text-sm font-bold text-white transition active:scale-95"
              style={{ background: '#00754A' }}
            >
              Đăng ký
            </button>
          </form>
          <p className="mt-3 text-xs text-gray-400">Không spam. Hủy đăng ký bất cứ lúc nào.</p>
        </div>
      </section>
    </div>
  );
}
