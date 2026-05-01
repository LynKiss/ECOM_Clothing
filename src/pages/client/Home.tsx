import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  Palette,
  Ruler,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  Truck,
} from 'lucide-react';
import { clientApi } from '../../lib/client-api';
import { useCart } from '../../hooks/useCart';
import { useClientSession } from '../../hooks/useClientSession';
import { triggerCartFlyAnimation } from '../../hooks/useCartAnimation';

type Product = {
  productId: string;
  productName: string;
  basePrice: string;
  effectivePrice: string;
  primaryImageUrl: string | null;
  quantityAvailable?: number;
  isFeatured?: boolean;
  ratingAverage?: string;
  ratingCount?: number;
  brand?: { brandName?: string } | null;
  origin?: { originName?: string } | null;
  category?: { categoryId: string; categoryName: string };
  appliedDiscount?: { id: string; type: string; value: number; name?: string } | null;
  variants?: Array<{ variantId: string; stockQuantity: number; isActive: boolean }>;
  colorOptions?: Array<{ colorId: string; colorName: string; colorCode: string | null }>;
};

type NewsItem = {
  newsId: string;
  title: string;
  subTitle?: string;
  slug: string;
  titleImageUrl?: string | null;
};

type PaginatedResponse<T> = {
  items: T[];
  meta?: unknown;
};

type Category = {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
};

type Banner = {
  bannerId: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  ctaText?: string | null;
};

const FALLBACK_BANNERS: Banner[] = [
  {
    bannerId: 'campaign-blue',
    title: 'Coolmate Summer Collection',
    subtitle: 'Nhập mã COOL12 giảm 12% tối đa 150K cho đơn từ 399K',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=85',
    linkUrl: '/client/products',
    ctaText: 'Mua ngay',
  },
  {
    bannerId: 'sport-edit',
    title: 'Coolmate Sport Edit',
    subtitle: 'Áo thể thao, đồ mặc hằng ngày và phụ kiện thoáng mát cho mùa hè',
    imageUrl: 'https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?auto=format&fit=crop&w=1800&q=85',
    linkUrl: '/client/products?search=the%20thao',
    ctaText: 'Khám phá',
  },
];

const QUICK_LINKS = [
  { label: 'Mới', href: '/client/products?sortBy=created_at&sortOrder=DESC' },
  { label: 'Nam', href: '/client/products?search=nam' },
  { label: 'Nữ', href: '/client/products?search=nu' },
  { label: 'Thể thao', href: '/client/products?search=the%20thao' },
  { label: 'Sale', href: '/client/products?onSale=1' },
];

const STATS = [
  { value: '20.000+', label: 'khách hàng Coolmate tin chọn' },
  { value: '800+', label: 'mẫu basic dễ mặc' },
  { value: '48h', label: 'xử lý đơn Coolmate' },
  { value: '7 ngày', label: 'đổi trả linh hoạt' },
];

const STYLE_CARDS = [
  { title: 'Chọn đúng size Coolmate', desc: 'Bảng size rõ ràng, gợi ý theo chiều cao, cân nặng và form mặc mong muốn.', icon: Ruler },
  { title: 'Chất liệu dễ mặc', desc: 'Cotton, denim, linen và poly blend được mô tả rõ để chọn đúng cảm giác mặc.', icon: BadgeCheck },
  { title: 'Phối đồ nhanh', desc: 'Gợi ý outfit Coolmate cho đi làm, đi chơi, tập luyện hoặc du lịch.', icon: Sparkles },
  { title: 'Giao hàng toàn quốc', desc: 'Đóng gói gọn, cập nhật trạng thái đơn và hỗ trợ đổi trả nhanh.', icon: Truck },
];

const SHOP_BY_STYLE = [
  { title: 'Công sở', desc: 'Áo sơ mi, quần tây, blazer và set tối giản cho lịch làm việc.', href: '/client/products?style=office', icon: Shirt },
  { title: 'Dạo phố', desc: 'T-shirt, hoodie, denim và phụ kiện dễ phối cho cuối tuần.', href: '/client/products?style=streetwear', icon: ShoppingBag },
  { title: 'Tối giản', desc: 'Bảng màu trắng, đen, xanh dương và form basic dùng được lâu.', href: '/client/products?style=minimal', icon: Palette },
  { title: 'Ưu đãi', desc: 'Sản phẩm sale, voucher theo thương hiệu và combo theo mùa.', href: '/client/products?sort=discount', icon: Tag },
];

const DATA_FEATURES = [
  { label: 'Thương hiệu Coolmate', value: 'Lọc nhanh các dòng basic, activewear, denim và đồ mặc hằng ngày.' },
  { label: 'Màu sắc', value: 'Swatch màu giúp chọn nhanh đen, trắng, xanh navy, beige và denim.' },
  { label: 'Kích cỡ', value: 'Size S-XL và tồn kho theo từng biến thể Coolmate.' },
  { label: 'Chất liệu', value: 'Cotton, denim, linen, poly blend và mô tả cảm giác mặc rõ ràng.' },
  { label: 'Form dáng', value: 'Regular, slim, oversize, relaxed để hạn chế chọn sai fit.' },
  { label: 'SKU biến thể', value: 'Giỏ hàng và đơn hàng lưu màu, size, SKU rõ ràng.' },
];

const BUYING_STEPS = [
  { title: 'Chọn phong cách', desc: 'Lọc theo danh mục, thương hiệu, màu, size, chất liệu và form dáng.' },
  { title: 'Kiểm tra biến thể', desc: 'Mở chi tiết sản phẩm, xem ảnh theo màu và chọn size còn hàng.' },
  { title: 'Áp dụng ưu đãi', desc: 'Lưu voucher vào ví, dùng mã giảm giá phù hợp đơn hàng.' },
  { title: 'Theo dõi đơn', desc: 'Checkout, nhận thông báo trạng thái và gửi yêu cầu đổi trả khi cần.' },
];

const FIT_GUIDES = [
  { label: 'Slim fit', desc: 'Ôm gọn, hợp áo sơ mi hoặc quần tây đi làm.' },
  { label: 'Regular fit', desc: 'Dễ mặc hằng ngày, cân bằng giữa gọn và thoải mái.' },
  { label: 'Oversize', desc: 'Rộng rãi, hợp streetwear, hoodie và T-shirt.' },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function isUsableImageUrl(value?: string | null) {
  return Boolean(value && !/\/\/example\.com\//i.test(value));
}

function formatBannerTitle(value?: string | null) {
  const text = value?.trim();
  if (!text) return 'Coolmate Summer Collection';
  if (/summer collection/i.test(text)) return 'Coolmate Summer Collection';
  if (/fashion ledger/i.test(text)) return text.replace(/fashion ledger/gi, 'Coolmate');
  return text;
}

function formatBannerSubtitle(value?: string | null) {
  const text = value?.trim();
  if (!text) return 'Nhập mã COOL12 giảm 12% tối đa 150K';
  return text
    .replace(/Nhap ma FL12 giam 12% toi da 150K/gi, 'Nhập mã COOL12 giảm 12% tối đa 150K')
    .replace(/Nhap FL12 giam 12% toi da 150K/gi, 'Nhập mã COOL12 giảm 12% tối đa 150K')
    .replace(/Fashion Ledger/gi, 'Coolmate');
}

function formatBannerCta(value?: string | null) {
  const text = value?.trim();
  if (!text) return 'Mua ngay';
  return text
    .replace(/^Mua ngay$/i, 'Mua ngay')
    .replace(/^Kham pha$/i, 'Khám phá');
}

function ProductCard({ product, onAddToCart, adding }: {
  product: Product;
  onAddToCart: (e: MouseEvent<HTMLButtonElement>) => void;
  adding: boolean;
  key?: string;
}) {
  const base = Number(product.basePrice || 0);
  const effective = Number(product.effectivePrice || product.basePrice || 0);
  const hasDiscount = base > 0 && effective < base - 0.01;
  const discountPct = hasDiscount ? Math.round(((base - effective) / base) * 100) : 0;
  const outOfStock = product.quantityAvailable === 0;
  const hasVariants = (product.variants?.length ?? 0) > 0;
  const colorCount = product.colorOptions?.length ?? 0;
  const badgeText = outOfStock ? 'Tạm hết hàng' : hasDiscount ? '-' + discountPct + '%' : product.isFeatured ? 'Nổi bật' : product.ratingCount && product.ratingCount >= 5 ? 'Được yêu thích' : null;
  const stripTitle = hasVariants || colorCount > 0 ? 'Có biến thể' : (product.category?.categoryName ?? product.brand?.brandName ?? 'Sản phẩm chọn lọc');
  const stripDesc = hasVariants || colorCount > 0 ? [colorCount ? colorCount + ' màu' : null, hasVariants ? 'chọn size ở chi tiết' : null].filter(Boolean).join(' - ') : 'Xem màu, size và tồn kho';
  const imageUrl = isUsableImageUrl(product.primaryImageUrl) ? product.primaryImageUrl : null;

  return (
    <article className="group min-w-[280px] flex-1">
      <Link to={`/client/products/${product.productId}`} className="relative block overflow-hidden rounded-lg bg-[#f1f1f1]">
        <div className="aspect-[4/5] overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={product.productName} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100"><Shirt size={60} className="text-gray-300" /></div>
          )}
        </div>
        {badgeText && <span className={'absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-black uppercase text-white ' + (outOfStock ? 'bg-gray-700' : hasDiscount ? 'bg-red-600' : 'bg-black')}>{badgeText}</span>}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-[#2538d5] px-4 py-3 text-white">
          <span className="rounded-full bg-white px-4 py-1 text-sm font-black text-[#2538d5]">{stripTitle}</span>
          <span className="line-clamp-1 text-sm font-black uppercase">{stripDesc}</span>
        </div>
        {outOfStock && <div className="absolute inset-0 flex items-center justify-center bg-black/35"><span className="rounded-full bg-white px-4 py-2 text-sm font-black">Tạm hết hàng</span></div>}
      </Link>
      <div className="mt-3 flex gap-1.5">
        {(product.colorOptions ?? []).slice(0, 5).map((color) => (
          <span key={color.colorId} className="h-7 w-12 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]" title={color.colorName} style={{ background: color.colorCode ?? '#e5e7eb' }} />
        ))}
        {(product.colorOptions?.length ?? 0) > 5 && <span className="text-sm font-bold text-gray-500">+{(product.colorOptions?.length ?? 0) - 5}</span>}
      </div>
      <Link to={`/client/products/${product.productId}`} className="mt-2 line-clamp-2 block text-xl font-semibold leading-tight text-black hover:text-[#2538d5]">{product.productName}</Link>
      {product.ratingCount && product.ratingCount > 0 ? (
        <div className="mt-1 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={13} fill={star <= Math.round(Number(product.ratingAverage ?? 0)) ? '#111' : 'none'} className="text-black" />)}
          <span className="text-xs text-gray-400">({product.ratingCount})</span>
        </div>
      ) : null}
      <div className="mt-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-xl font-black text-black">{formatPrice(effective)}</p>
          {hasDiscount && <p className="text-sm text-gray-400 line-through">{formatPrice(base)}</p>}
        </div>
        <button onClick={onAddToCart} disabled={adding || outOfStock} className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white transition hover:bg-[#2538d5] disabled:bg-gray-300" title={hasVariants ? 'Chọn màu/size' : 'Thêm vào giỏ'}>
          {adding ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <ShoppingCart size={18} />}
        </button>
      </div>
    </article>
  );
}

function ProductCarousel({ products, addingId, onAddToCart, loading, loadError }: {
  products: Product[];
  addingId: string | null;
  onAddToCart: (product: Product, e: MouseEvent<HTMLButtonElement>) => void;
  loading?: boolean;
  loadError?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => ref.current?.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  if (loading) return <div className="flex gap-6 overflow-hidden">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-[520px] min-w-[280px] flex-1 animate-pulse rounded-lg bg-gray-100" />)}</div>;
  if (loadError) return <div className="client-card p-6 text-sm font-semibold text-gray-500">Chưa tải được sản phẩm. Vui lòng kiểm tra lại dữ liệu khuyến mãi hoặc thử lại sau.</div>;
  if (products.length === 0) return <div className="client-card p-6 text-sm font-semibold text-gray-500">Chưa có sản phẩm nổi bật để hiển thị.</div>;
  return (
    <div className="relative">
      <button onClick={() => scroll('left')} className="absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0B0F19] shadow-sm transition hover:bg-[#2563EB] hover:text-white md:flex" aria-label="Trước"><ChevronLeft size={18} /></button>
      <div ref={ref} className="flex gap-6 overflow-x-auto scroll-smooth pb-8" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {products.map((product) => <ProductCard key={product.productId} product={product} adding={addingId === product.productId} onAddToCart={(event) => onAddToCart(product, event)} />)}
      </div>
      <button onClick={() => scroll('right')} className="absolute -right-12 top-[38%] z-10 hidden h-12 w-12 items-center justify-center rounded-full bg-black text-white transition hover:bg-[#2538d5] xl:flex" aria-label="Sau"><ChevronRight size={22} /></button>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { session } = useClientSession();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>(FALLBACK_BANNERS);
  const [activeBanner, setActiveBanner] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productLoadError, setProductLoadError] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);

  useEffect(() => {
    setLoadingProducts(true);
    void clientApi.get<{ meta: unknown; items: Product[] }>('/products?isFeatured=true&limit=10&includeHidden=false')
      .then(async (data) => {
        const featured = data.items ?? [];
        if (featured.length > 0) {
          setProducts(featured);
          setProductLoadError(false);
          return;
        }
        const fallback = await clientApi.get<{ meta: unknown; items: Product[] }>('/products?limit=10&includeHidden=false');
        setProducts(fallback.items ?? []);
        setProductLoadError(false);
      })
      .catch(() => { setProducts([]); setProductLoadError(true); })
      .finally(() => setLoadingProducts(false));
    void clientApi
      .get<NewsItem[] | PaginatedResponse<NewsItem>>('/news?limit=3')
      .then((data) => setNews(Array.isArray(data) ? data : data.items ?? []))
      .catch(() => setNews([]));
    void clientApi.get<Category[]>('/categories').then(setCategories).catch(() => setCategories([]));
    void clientApi.get<Banner[]>('/banners?position=homepage').then((items) => setBanners(items.length ? items : FALLBACK_BANNERS)).catch(() => setBanners(FALLBACK_BANNERS));
  }, []);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const timer = window.setInterval(() => setActiveBanner((current) => (current + 1) % banners.length), 5000);
    return () => window.clearInterval(timer);
  }, [paused, banners.length]);

  const currentBanner = banners[activeBanner] ?? FALLBACK_BANNERS[0];
  const bannerTitle = formatBannerTitle(currentBanner.title);
  const bannerSubtitle = formatBannerSubtitle(currentBanner.subtitle);
  const bannerCta = formatBannerCta(currentBanner.ctaText);
  const nextBanner = () => setActiveBanner((current) => (current + 1) % banners.length);
  const prevBanner = () => setActiveBanner((current) => (current - 1 + banners.length) % banners.length);

  const handleAddToCart = async (product: Product, event: MouseEvent<HTMLButtonElement>) => {
    if ((product.variants?.length ?? 0) > 0) {
      void navigate('/client/products/' + product.productId);
      return;
    }
    if (!session) { void navigate('/client/login'); return; }
    setAddingId(product.productId);
    try { await addItem(product.productId, 1); triggerCartFlyAnimation(event.currentTarget); } finally { setAddingId(null); }
  };

  const handleNewsletter = async (event: FormEvent) => {
    event.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterStatus('Đang đăng ký...');
    try {
      await clientApi.post('/newsletter/subscribe', { email: newsletterEmail.trim() });
      setNewsletterStatus('Đã đăng ký nhận ưu đãi thời trang.');
      setNewsletterEmail('');
    } catch {
      setNewsletterStatus('Chưa thể đăng ký lúc này, vui lòng thử lại.');
    }
  };

  return (
    <div className="bg-[#F8FAFC] text-[#0B0F19]">
      <section className="relative min-h-[620px] overflow-hidden bg-[#58adff]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {currentBanner.imageUrl && <img src={currentBanner.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />}
        <div className="absolute inset-0 bg-gradient-to-r from-[#58adff] via-[#58adff]/85 to-[#b7f4ff]/55" />
        {banners.length > 1 && <><button onClick={prevBanner} className="absolute left-6 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white transition hover:bg-white/20 md:flex" aria-label="Banner trước"><ChevronLeft size={26} /></button><button onClick={nextBanner} className="absolute right-6 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white transition hover:bg-white/20 md:flex" aria-label="Banner sau"><ChevronRight size={26} /></button></>}
        <div className="relative mx-auto flex min-h-[620px] max-w-[1760px] items-center px-6 lg:px-20">
          <div className="max-w-5xl py-20 text-white">
            <p className="mb-4 text-sm font-black uppercase tracking-[0.28em] text-white/80">Coolmate Official Store</p>
            <h1 className="text-6xl font-black uppercase leading-[0.98] tracking-tight md:text-8xl">{bannerTitle}</h1>
            <p className="mt-6 text-2xl font-bold md:text-4xl">{bannerSubtitle}</p>
            <Link to={currentBanner.linkUrl || '/client/products'} className="mt-12 inline-flex items-center gap-3 rounded-full bg-white px-12 py-5 text-base font-black uppercase text-black transition hover:bg-black hover:text-white">{bannerCta} <ArrowRight size={24} /></Link>
          </div>
        </div>
        {banners.length > 1 && <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-3">{banners.map((banner, index) => <button key={banner.bannerId} onClick={() => setActiveBanner(index)} className={'h-2 rounded-full transition-all ' + (index === activeBanner ? 'w-10 bg-white' : 'w-2 bg-white/45')} aria-label={'Chọn banner ' + (index + 1)} />)}</div>}
      </section>

      <section className="mx-auto flex max-w-[1320px] justify-center gap-6 overflow-x-auto px-6 py-8">
        {QUICK_LINKS.map((item) => <Link key={item.label} to={item.href} className="group flex min-w-24 flex-col items-center gap-2"><span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#2538d5] bg-gray-100 text-sm font-black text-black transition group-hover:bg-[#2538d5] group-hover:text-white">{item.label}</span></Link>)}
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 lg:grid-cols-4 lg:px-6">{STATS.map((stat) => <div key={stat.label} className="client-card p-6 text-center"><p className="text-3xl font-black text-[#2563EB]">{stat.value}</p><p className="mt-1 text-sm font-semibold text-gray-500">{stat.label}</p></div>)}</section>

      <SectionTitle eyebrow="Bộ sưu tập" title="Mua theo danh mục" cta="Xem tất cả" href="/client/products" />
      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        {(categories.length ? categories.slice(0, 8) : [
          { categoryId: 'ao', categoryName: 'Áo', categorySlug: 'ao' },
          { categoryId: 'quan', categoryName: 'Quần', categorySlug: 'quan' },
          { categoryId: 'dam', categoryName: 'Đầm & chân váy', categorySlug: 'dam' },
          { categoryId: 'phu-kien', categoryName: 'Phụ kiện', categorySlug: 'phu-kien' },
        ]).map((category) => <InfoLink key={category.categoryId} href={`/client/products?categoryId=${category.categoryId}`} icon={Shirt} title={category.categoryName} desc="Lọc theo màu, size và phong cách phù hợp." />)}
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-[1760px] px-6 lg:px-20">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-4xl font-black uppercase tracking-tight text-black">Sản phẩm Coolmate nổi bật</h2>
            <Link to="/client/products" className="text-lg font-semibold text-black underline underline-offset-4">Xem thêm</Link>
          </div>
          <ProductCarousel products={products} loading={loadingProducts} loadError={productLoadError} addingId={addingId} onAddToCart={handleAddToCart} />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-16 md:grid-cols-2 lg:grid-cols-4 lg:px-6">{STYLE_CARDS.map((item) => <InfoCard key={item.title} icon={item.icon} title={item.title} desc={item.desc} />)}</section>

      <SectionTitle eyebrow="Shop theo phong cách" title="Đi thẳng tới gu bạn cần" cta="Mở bộ lọc" href="/client/products" />
      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 md:grid-cols-2 lg:grid-cols-4 lg:px-6">{SHOP_BY_STYLE.map((item) => <InfoLink key={item.title} href={item.href} icon={item.icon} title={item.title} desc={item.desc} />)}</section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="client-card bg-[#0B0F19] p-8 text-white md:p-10"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#DBEAFE]">Dữ liệu sản phẩm</p><h2 className="mt-3 text-3xl font-black">Mua quần áo theo đúng biến thể</h2><p className="mt-4 text-sm leading-7 text-white/70">Fashion Ledger dùng mô hình sản phẩm có thương hiệu, màu, size, chất liệu, form dáng và SKU biến thể. Vì vậy trang sản phẩm, giỏ hàng và đơn hàng đều hiển thị rõ lựa chọn thật của khách.</p><Link to="/client/products" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#2563EB] transition hover:bg-[#DBEAFE]">Xem sản phẩm <ShoppingBag size={16} /></Link></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{DATA_FEATURES.map((item) => <div key={item.label} className="client-card p-5"><p className="text-sm font-black text-[#2563EB]">{item.label}</p><p className="mt-2 text-sm leading-6 text-gray-500">{item.value}</p></div>)}</div>
        </div>
      </section>

      <section className="bg-white py-16"><div className="mx-auto max-w-7xl px-4 lg:px-6"><div className="mb-8"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#2563EB]">Mua hàng dễ kiểm soát</p><h2 className="mt-2 text-3xl font-black text-[#0B0F19]">Từ chọn size tới đổi trả</h2></div><div className="grid gap-4 md:grid-cols-4">{BUYING_STEPS.map((step, index) => <div key={step.title} className="client-card p-6"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-sm font-black text-white">{index + 1}</div><h3 className="mt-5 text-base font-black text-[#0B0F19]">{step.title}</h3><p className="mt-2 text-sm leading-6 text-gray-500">{step.desc}</p></div>)}</div><div className="mt-6 grid gap-4 md:grid-cols-3">{FIT_GUIDES.map((fit) => <div key={fit.label} className="rounded-xl border border-[#DBEAFE] bg-[#F8FAFC] p-5"><p className="font-black text-[#0B0F19]">{fit.label}</p><p className="mt-2 text-sm leading-6 text-gray-500">{fit.desc}</p></div>)}</div></div></section>

      <section className="bg-[#0B0F19] py-16 text-white"><div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:px-6"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#DBEAFE]">AI Style Advisor</p><h2 className="mt-3 text-3xl font-black">Cần phối đồ hoặc chọn size?</h2><p className="mt-4 text-sm leading-7 text-white/70">Mô tả phong cách, chiều cao, cân nặng và dịp sử dụng. Hệ thống sẽ gợi ý size, chất liệu và sản phẩm phù hợp trong shop.</p><Link to="/client/style-advisor" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#2563EB] transition hover:bg-[#DBEAFE]">Thử tư vấn ngay <Sparkles size={16} /></Link></div><div className="grid gap-4 sm:grid-cols-3">{['Đi làm', 'Đi chơi', 'Du lịch'].map((label, index) => <div key={label} className="rounded-xl border border-white/15 bg-white/8 p-5"><Palette className="text-[#DBEAFE]" size={24} /><p className="mt-5 text-lg font-black">{label}</p><p className="mt-2 text-sm text-white/65">Gợi ý outfit #{index + 1} theo phong cách của bạn.</p></div>)}</div></div></section>

      <SectionTitle eyebrow="Cảm hứng mặc đẹp" title="Tin tức và gợi ý phong cách" cta="Đọc thêm" href="/client/news" />
      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 md:grid-cols-3 lg:px-6">{news.slice(0, 3).map((item) => <Link key={item.newsId} to={`/client/news/${item.slug}`} className="client-card-soft group overflow-hidden"><div className="h-48 bg-[#DBEAFE]">{item.titleImageUrl ? <img src={item.titleImageUrl} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><ShoppingBag size={42} className="text-[#2563EB]/50" /></div>}</div><div className="p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#2563EB]">Fashion Journal</p><h3 className="mt-2 line-clamp-2 text-lg font-black text-[#0B0F19] group-hover:text-[#2563EB]">{item.title}</h3>{item.subTitle && <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">{item.subTitle}</p>}</div></Link>)}</section>

      <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-6"><div className="client-card grid gap-8 bg-white p-8 md:grid-cols-[1fr_0.9fr] md:p-10"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#2563EB]">Newsletter</p><h2 className="mt-3 text-3xl font-black text-[#0B0F19]">Nhận lookbook và ưu đãi mới</h2><p className="mt-3 max-w-xl text-sm leading-7 text-gray-500">Cập nhật bộ sưu tập, mã giảm giá và gợi ý phối đồ hằng tuần từ Fashion Ledger.</p></div><form onSubmit={handleNewsletter} className="flex flex-col justify-center gap-3 sm:flex-row md:flex-col lg:flex-row"><input value={newsletterEmail} onChange={(event) => setNewsletterEmail(event.target.value)} type="email" placeholder="Email của bạn" className="min-h-[48px] flex-1 rounded-full border border-gray-200 bg-[#F8FAFC] px-5 text-sm outline-none focus:border-[#2563EB]" /><button className="client-pill-primary px-7 py-3 text-sm font-black">Đăng ký</button>{newsletterStatus && <p className="text-xs font-semibold text-gray-500 sm:basis-full md:basis-auto lg:basis-full">{newsletterStatus}</p>}</form></div></section>
    </div>
  );
}

function SectionTitle({ eyebrow, title, cta, href }: { eyebrow: string; title: string; cta: string; href: string }) {
  return <section className="mx-auto max-w-7xl px-4 pt-16 lg:px-6"><SectionHeader eyebrow={eyebrow} title={title} cta={cta} href={href} /></section>;
}

function SectionHeader({ eyebrow, title, cta, href, filled }: { eyebrow: string; title: string; cta: string; href: string; filled?: boolean }) {
  return <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#2563EB]">{eyebrow}</p><h2 className="mt-2 text-3xl font-black text-[#0B0F19]">{title}</h2></div><Link to={href} className={`${filled ? 'client-pill-primary' : 'client-pill-outline'} inline-flex w-fit items-center gap-2 px-5 py-2.5 text-sm font-bold`}>{cta} <ArrowRight size={15} /></Link></div>;
}

function InfoCard({ icon: Icon, title, desc }: { icon: typeof Shirt; title: string; desc: string; key?: string }) {
  return <div className="client-card p-6"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#DBEAFE] text-[#2563EB]"><Icon size={22} /></div><h3 className="mt-5 text-base font-black text-[#0B0F19]">{title}</h3><p className="mt-2 text-sm leading-6 text-gray-500">{desc}</p></div>;
}

function InfoLink({ icon: Icon, href, title, desc }: { icon: typeof Shirt; href: string; title: string; desc: string; key?: string }) {
  return <Link to={href} className="client-card group p-6 transition hover:-translate-y-1 hover:border-[#2563EB]/30"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DBEAFE] text-[#2563EB]"><Icon size={24} /></div><h3 className="mt-5 text-lg font-black text-[#0B0F19] group-hover:text-[#2563EB]">{title}</h3><p className="mt-2 text-sm text-gray-500">{desc}</p></Link>;
}




