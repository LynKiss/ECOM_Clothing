import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Award, ChevronDown, ChevronLeft, ChevronRight,
  Leaf, Package, Quote, RefreshCcw, Ruler, Shield,
  Shirt, ShoppingCart, Sparkles, Star, Truck, Users, Zap,
} from 'lucide-react';
import { clientApi } from '../../lib/client-api';
import { resolveMediaUrl } from '../../lib/media-url';
import { useCart } from '../../hooks/useCart';
import { useClientSession } from '../../hooks/useClientSession';
import { triggerCartFlyAnimation } from '../../hooks/useCartAnimation';

/* ─── Types ─────────────────────────────────────────── */
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

type Category = {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  imageUrl?: string | null;
};

type Banner = {
  bannerId: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  ctaText?: string | null;
};

type PaginatedResponse<T> = { items: T[] };

/* ─── Static data ───────────────────────────────────── */
const ANNOUNCEMENTS = [
  '🚚 Miễn phí vận chuyển cho đơn hàng từ 299.000đ',
  '🎁 Quà tặng kèm cho đơn hàng từ 599.000đ',
  '⚡ Flash Sale mỗi ngày — Giảm đến 50%',
];

const FALLBACK_BANNERS: Banner[] = [
  {
    bannerId: 'h1',
    title: 'NEW ARRIVALS',
    subtitle: 'Bộ sưu tập mới — chất liệu thoáng mát, form chuẩn cho mọi vóc dáng',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1400&q=85',
    linkUrl: '/client/products',
    ctaText: 'MUA NGAY',
  },
  {
    bannerId: 'h2',
    title: 'ĐỒ THỂ THAO',
    subtitle: 'Áo thể thao, jogger và phụ kiện tập luyện thoải mái cả ngày',
    imageUrl: 'https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1400&q=85',
    linkUrl: '/client/products?search=the%20thao',
    ctaText: 'KHÁM PHÁ',
  },
];

const GENDER_BANNERS_FALLBACK = [
  {
    label: 'ĐỒ NAM',
    href: '/client/products?search=nam',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
    fallback: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    objectPosition: 'center 28%',
  },
  {
    label: 'ĐỒ NỮ',
    href: '/client/products?search=nu',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85',
    fallback: 'linear-gradient(135deg, #831843 0%, #a855f7 100%)',
    objectPosition: 'center 24%',
  },
];

const FALLBACK_CATS = [
  { categoryId: 'c1', categoryName: 'Áo Polo', categorySlug: 'ao-polo' },
  { categoryId: 'c2', categoryName: 'Áo Thun', categorySlug: 'ao-thun' },
  { categoryId: 'c3', categoryName: 'Quần Shorts', categorySlug: 'quan-shorts' },
  { categoryId: 'c4', categoryName: 'Sơ Mi', categorySlug: 'so-mi' },
  { categoryId: 'c5', categoryName: 'Quần Dài', categorySlug: 'quan' },
  { categoryId: 'c6', categoryName: 'Phụ Kiện', categorySlug: 'phu-kien' },
  { categoryId: 'c7', categoryName: 'Đầm', categorySlug: 'dam' },
  { categoryId: 'c8', categoryName: 'Thể Thao', categorySlug: 'the-thao' },
];

const CATEGORY_FALLBACKS: Record<string, string> = {
  ao: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=75',
  'ao-thun': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=75',
  'ao-polo': 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?auto=format&fit=crop&w=400&q=75',
  'so-mi': 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&w=400&q=75',
  quan: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=75',
  'quan-jeans': 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=400&q=75',
  dam: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=75',
  'phu-kien': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=75',
  'the-thao': 'https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=400&q=75',
};

const TRUST_POINTS = [
  { icon: Truck, title: 'Miễn phí vận chuyển', desc: 'Đơn từ 299.000đ' },
  { icon: RefreshCcw, title: '7 ngày đổi trả', desc: 'Không cần lý do' },
  { icon: Shield, title: 'Chất lượng kiểm định', desc: 'Vải đạt chuẩn' },
  { icon: Package, title: 'Đóng gói cẩn thận', desc: 'Giao hàng nhanh' },
];

const BRAND_STATS = [
  { value: '50,000+', label: 'Khách hàng tin dùng' },
  { value: '200+', label: 'Sản phẩm đa dạng' },
  { value: '63', label: 'Tỉnh thành giao hàng' },
  { value: '4.8★', label: 'Đánh giá trung bình' },
];

const QUALITY_PILLARS = [
  { icon: Leaf, title: 'Vải sinh thái', desc: 'Cotton/Bamboo an toàn cho da, kiểm định Oeko-Tex Standard 100.' },
  { icon: Ruler, title: 'Đa dạng size', desc: 'XS đến 5XL — thiết kế riêng cho vóc dáng người Việt.' },
  { icon: Award, title: 'Kiểm soát chất lượng', desc: 'Mỗi sản phẩm qua 5 bước kiểm tra trước khi giao đến bạn.' },
  { icon: Users, title: 'Cộng đồng mặc đẹp', desc: 'Hơn 50.000 khách hàng chia sẻ phong cách mỗi ngày.' },
];

const LOOKBOOK_FALLBACK = [
  {
    id: 'lk1',
    label: 'PHONG CÁCH BASIC',
    sub: 'Đơn giản · Tinh tế',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=700&q=80',
    href: '/client/products',
  },
  {
    id: 'lk2',
    label: 'CÔNG SỞ',
    sub: 'Chuyên nghiệp mỗi ngày',
    image: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&w=700&q=80',
    href: '/client/products?search=cong%20so',
  },
  {
    id: 'lk3',
    label: 'NĂNG ĐỘNG',
    sub: 'Thể thao · Thoải mái',
    image: 'https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=700&q=80',
    href: '/client/products?search=the%20thao',
  },
];

const TESTIMONIALS = [
  {
    id: 't1',
    name: 'Trần Minh Đức',
    loc: 'Hà Nội',
    rating: 5,
    text: 'Áo polo chất lượng tuyệt vời, mặc đi làm hay đi chơi đều ổn. Form đẹp, vải mát. Mua lần 2 rồi và chắc chắn sẽ mua tiếp.',
    product: 'Áo Polo Basic',
  },
  {
    id: 't2',
    name: 'Nguyễn Thị Lan',
    loc: 'TP.HCM',
    rating: 5,
    text: 'Giao hàng nhanh, đóng gói cẩn thận. Quần jeans vừa đúng size, chất vải dày dặn. Rất hài lòng với dịch vụ và sản phẩm.',
    product: 'Quần Jeans Slim',
  },
  {
    id: 't3',
    name: 'Lê Hoàng Nam',
    loc: 'Đà Nẵng',
    rating: 5,
    text: 'Đặt hàng tối, sáng hôm sau đã có. Chất lượng như mô tả, màu sắc đẹp. Shop tư vấn nhiệt tình, sẽ giới thiệu bạn bè.',
    product: 'Áo Thun Oversized',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Chính sách đổi trả như thế nào?',
    a: 'Chúng tôi hỗ trợ đổi trả trong vòng 7 ngày kể từ khi nhận hàng. Sản phẩm cần còn nguyên tem nhãn, chưa qua sử dụng và có hóa đơn mua hàng.',
  },
  {
    q: 'Làm thế nào để chọn đúng size?',
    a: 'Bạn có thể tham khảo bảng size chi tiết trên từng trang sản phẩm. Nếu cần tư vấn, hãy chat với chúng tôi — đội ngũ sẽ gợi ý size phù hợp dựa trên số đo của bạn.',
  },
  {
    q: 'Thời gian giao hàng bao lâu?',
    a: 'Nội thành HN và HCM: 1–2 ngày. Tỉnh thành khác: 2–4 ngày. Chúng tôi hợp tác với GHTK, GHN và Viettel Post để đảm bảo giao nhanh nhất.',
  },
  {
    q: 'Có thể theo dõi đơn hàng không?',
    a: 'Có. Sau khi đặt hàng, bạn sẽ nhận mã vận đơn qua email. Theo dõi đơn trong mục "Đơn hàng của tôi" trên tài khoản.',
  },
];

/* ─── Helpers ───────────────────────────────────────── */
function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function isUsableUrl(v?: string | null): v is string {
  return Boolean(v && !/example\.com/i.test(v));
}

function getCategoryImage(cat: Category): string | null {
  const imageUrl = resolveMediaUrl(cat.imageUrl);
  return isUsableUrl(imageUrl) ? imageUrl : null;
}

function normalizeStr(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase();
}

/* ─── CountdownTimer ────────────────────────────────── */
function CountdownTimer({ endTime }: { endTime: number }) {
  const [diff, setDiff] = useState(() => Math.max(0, endTime - Date.now()));
  useEffect(() => {
    const t = window.setInterval(() => setDiff(Math.max(0, endTime - Date.now())), 1000);
    return () => window.clearInterval(t);
  }, [endTime]);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-1 font-black tabular-nums">
      <span className="rounded-lg bg-red-600 px-2.5 py-1 text-xl text-white">{pad(h)}</span>
      <span className="text-xl font-black text-red-600">:</span>
      <span className="rounded-lg bg-red-600 px-2.5 py-1 text-xl text-white">{pad(m)}</span>
      <span className="text-xl font-black text-red-600">:</span>
      <span className="rounded-lg bg-red-600 px-2.5 py-1 text-xl text-white">{pad(s)}</span>
    </div>
  );
}

/* ─── ProductCard ───────────────────────────────────── */
function ProductCard({ product, onAddToCart, adding }: {
  product: Product;
  onAddToCart: (e: MouseEvent<HTMLButtonElement>) => void;
  adding: boolean;
  key?: string;
}) {
  const base = Number(product.basePrice || 0);
  const eff = Number(product.effectivePrice || product.basePrice || 0);
  const hasDiscount = base > 0 && eff < base - 1;
  const discPct = hasDiscount ? Math.round(((base - eff) / base) * 100) : 0;
  const outOfStock = product.quantityAvailable === 0;
  const hasVariants = (product.variants?.length ?? 0) > 0;
  const colors = product.colorOptions ?? [];
  const img = isUsableUrl(product.primaryImageUrl) ? product.primaryImageUrl : null;

  return (
    <article className="group min-w-[180px] flex-shrink-0 flex-grow basis-[180px]">
      <div className="relative overflow-hidden rounded-2xl bg-[#f0f0f0]">
        <div className="aspect-[4/5]">
          {img
            ? <img src={img} alt={product.productName} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            : <div className="flex h-full w-full items-center justify-center"><Shirt size={48} className="text-gray-300" /></div>
          }
        </div>
        {hasDiscount && !outOfStock && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-[#e53e3e] px-2.5 py-0.5 text-[11px] font-black text-white">-{discPct}%</span>
        )}
        {!hasDiscount && (product.ratingCount ?? 0) >= 5 && !outOfStock && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-black px-2.5 py-0.5 text-[11px] font-black uppercase text-white tracking-wide">Bán chạy</span>
        )}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50">
            <span className="rounded-full bg-white px-4 py-1.5 text-xs font-black text-gray-600 shadow">Hết hàng</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-200 group-hover:translate-y-0">
          <button onClick={onAddToCart} disabled={adding || outOfStock}
            className="flex w-full items-center justify-center gap-2 bg-black/90 py-3 text-sm font-black text-white backdrop-blur-sm transition hover:bg-black disabled:opacity-40">
            {adding ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <ShoppingCart size={15} />}
            {hasVariants ? 'Chọn màu/size' : 'Thêm nhanh vào giỏ'}
          </button>
        </div>
      </div>
      {colors.length > 0 && (
        <div className="mt-2.5 flex items-center gap-1">
          {colors.slice(0, 8).map((c) => (
            <span key={c.colorId} className="h-[18px] w-[18px] cursor-pointer rounded-full border border-black/10 shadow-sm transition hover:scale-110"
              style={{ background: c.colorCode ?? '#e5e7eb' }} title={c.colorName} />
          ))}
          {colors.length > 8 && <span className="text-[11px] text-gray-400">+{colors.length - 8}</span>}
        </div>
      )}
      <Link to={`/client/products/${product.productId}`}
        className="mt-2 block line-clamp-2 text-[14px] font-semibold leading-snug text-gray-900 hover:text-blue-600">
        {product.productName}
      </Link>
      {(product.ratingCount ?? 0) > 0 && (
        <div className="mt-1 flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} size={10} fill={s <= Math.round(Number(product.ratingAverage ?? 0)) ? '#f59e0b' : 'none'} className="text-amber-400" />
          ))}
          <span className="ml-1 text-[11px] text-gray-400">({product.ratingCount})</span>
        </div>
      )}
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-[17px] font-black text-gray-900">{formatPrice(eff)}</span>
        {hasDiscount && <span className="text-[13px] text-gray-400 line-through">{formatPrice(base)}</span>}
      </div>
    </article>
  );
}

/* ─── ProductCarousel ───────────────────────────────── */
function ProductCarousel({ products, addingId, onAddToCart, loading }: {
  products: Product[];
  addingId: string | null;
  onAddToCart: (p: Product, e: MouseEvent<HTMLButtonElement>) => void;
  loading?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'l' | 'r') => ref.current?.scrollBy({ left: dir === 'r' ? 260 : -260, behavior: 'smooth' });

  if (loading) return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => <div key={i} className="aspect-[4/5] min-w-[180px] flex-1 animate-pulse rounded-2xl bg-gray-100" />)}
    </div>
  );
  if (products.length === 0) return (
    <p className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">Chưa có sản phẩm.</p>
  );

  return (
    <div className="relative">
      <button onClick={() => scroll('l')} aria-label="Trước"
        className="absolute -left-5 top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-black hover:text-white md:flex">
        <ChevronLeft size={17} />
      </button>
      <div ref={ref} className="flex gap-4 overflow-x-auto scroll-smooth pb-2" style={{ scrollbarWidth: 'none' }}>
        {products.map((p) => (
          <ProductCard key={p.productId} product={p} adding={addingId === p.productId} onAddToCart={(e) => onAddToCart(p, e)} />
        ))}
      </div>
      <button onClick={() => scroll('r')} aria-label="Sau"
        className="absolute -right-5 top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-black hover:text-white md:flex">
        <ChevronRight size={17} />
      </button>
    </div>
  );
}

/* ─── Home ───────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const { session } = useClientSession();
  const { addItem } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>(FALLBACK_BANNERS);
  const [lookbookBanners, setLookbookBanners] = useState<Banner[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);
  const [annoIdx, setAnnoIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const flashSaleEnd = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, []);

  useEffect(() => {
    setLoadingFeatured(true);
    void clientApi.get<{ items: Product[] }>('/products?isFeatured=true&limit=12&includeHidden=false')
      .then(async (d) => {
        const items = d.items ?? [];
        if (items.length > 0) { setProducts(items); return; }
        const fb = await clientApi.get<{ items: Product[] }>('/products?limit=12&includeHidden=false');
        setProducts(fb.items ?? []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoadingFeatured(false));

    setLoadingNew(true);
    void clientApi.get<{ items: Product[] }>('/products?sortBy=created_at&sortOrder=DESC&limit=12&includeHidden=false')
      .then((d) => setNewArrivals(d.items ?? []))
      .catch(() => setNewArrivals([]))
      .finally(() => setLoadingNew(false));

    void clientApi.get<{ items: Product[] }>('/products?hasSalePrice=true&limit=12&includeHidden=false')
      .then((d) => setSaleProducts(d.items ?? []))
      .catch(() => setSaleProducts([]));

    void clientApi.get<NewsItem[] | PaginatedResponse<NewsItem>>('/news?limit=4')
      .then((d) => setNews(Array.isArray(d) ? d : (d.items ?? [])))
      .catch(() => setNews([]));

    void clientApi.get<Category[]>('/categories')
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]));

    void clientApi.get<Banner[]>('/banners?position=homepage')
      .then((items) => setBanners(items.length ? items : FALLBACK_BANNERS))
      .catch(() => setBanners(FALLBACK_BANNERS));

    void clientApi.get<Banner[]>('/banners?position=lookbook')
      .then((items) => setLookbookBanners(items.length ? items : []))
      .catch(() => setLookbookBanners([]));
  }, []);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const t = window.setInterval(() => setActiveBanner((c) => (c + 1) % banners.length), 5000);
    return () => window.clearInterval(t);
  }, [paused, banners.length]);

  useEffect(() => {
    const t = window.setInterval(() => setAnnoIdx((i) => (i + 1) % ANNOUNCEMENTS.length), 3500);
    return () => window.clearInterval(t);
  }, []);

  const banner = banners[activeBanner] ?? FALLBACK_BANNERS[0];
  const displayCats = (categories.length ? categories : FALLBACK_CATS).slice(0, 8);

  const genderBanners = useMemo(() => {
    if (!categories.length) return GENDER_BANNERS_FALLBACK;
    const norm = (s: string) => normalizeStr(s);
    const maleCat = categories.find(c => norm(c.categoryName).includes('nam') || norm(c.categorySlug).includes('nam'));
    const femaleCat = categories.find(c => norm(c.categoryName).includes('nu') || norm(c.categorySlug).includes('nu'));
    return [
      {
        label: maleCat ? maleCat.categoryName.toUpperCase() : 'ĐỒ NAM',
        href: maleCat ? `/client/products?categoryIds=${maleCat.categoryId}` : '/client/products?search=nam',
        image: (isUsableUrl(resolveMediaUrl(maleCat?.imageUrl)) ? resolveMediaUrl(maleCat!.imageUrl) : null) ?? GENDER_BANNERS_FALLBACK[0].image,
        fallback: GENDER_BANNERS_FALLBACK[0].fallback,
        objectPosition: GENDER_BANNERS_FALLBACK[0].objectPosition,
      },
      {
        label: femaleCat ? femaleCat.categoryName.toUpperCase() : 'ĐỒ NỮ',
        href: femaleCat ? `/client/products?categoryIds=${femaleCat.categoryId}` : '/client/products?search=nu',
        image: (isUsableUrl(resolveMediaUrl(femaleCat?.imageUrl)) ? resolveMediaUrl(femaleCat!.imageUrl) : null) ?? GENDER_BANNERS_FALLBACK[1].image,
        fallback: GENDER_BANNERS_FALLBACK[1].fallback,
        objectPosition: GENDER_BANNERS_FALLBACK[1].objectPosition,
      },
    ];
  }, [categories]);

  const lookbook = useMemo(() => {
    if (!lookbookBanners.length) return LOOKBOOK_FALLBACK;
    return lookbookBanners.slice(0, 3).map((b, i) => ({
      id: b.bannerId,
      label: b.title,
      sub: b.subtitle ?? LOOKBOOK_FALLBACK[i]?.sub ?? '',
      image: (isUsableUrl(b.imageUrl) ? b.imageUrl : null) ?? LOOKBOOK_FALLBACK[i]?.image ?? '',
      href: b.linkUrl ?? '/client/products',
    }));
  }, [lookbookBanners]);

  const handleAddToCart = async (product: Product, event: MouseEvent<HTMLButtonElement>) => {
    if ((product.variants?.length ?? 0) > 0) { void navigate('/client/products/' + product.productId); return; }
    setAddingId(product.productId);
    try {
      const img = isUsableUrl(product.primaryImageUrl) ? product.primaryImageUrl : null;
      await addItem(product.productId, 1, undefined, !session ? {
        productName: product.productName,
        primaryImageUrl: img,
        unitPrice: Number(product.effectivePrice || product.basePrice || 0),
        availableQuantity: product.quantityAvailable ?? 0,
      } : undefined);
      triggerCartFlyAnimation(event.currentTarget);
    } finally { setAddingId(null); }
  };

  const handleNewsletter = async (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterStatus('Đang đăng ký...');
    try {
      await clientApi.post('/newsletter/subscribe', { email: newsletterEmail.trim() });
      setNewsletterStatus('Đăng ký thành công! Kiểm tra email của bạn.');
      setNewsletterEmail('');
    } catch {
      setNewsletterStatus('Chưa thể đăng ký lúc này.');
    }
  };

  return (
    <div className="bg-white text-gray-900">

      {/* ── ANNOUNCEMENT BAR ─────────────────────────── */}
      <div className="relative overflow-hidden bg-[#1a1a2e] py-2.5 text-center text-xs font-bold tracking-wide text-white">
        <div className="flex items-center justify-center gap-3">
          <span className="hidden h-px w-16 bg-white/20 sm:block" />
          <span className="transition-all duration-500">{ANNOUNCEMENTS[annoIdx]}</span>
          <span className="hidden h-px w-16 bg-white/20 sm:block" />
        </div>
      </div>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a0a14]"
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {/* Background image */}
        {isUsableUrl(banner.imageUrl) && (
          <img src={banner.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover object-center opacity-40 transition-opacity duration-700" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a14]/95 via-[#0a0a14]/70 to-transparent" />
        <div className="relative mx-auto flex min-h-[600px] max-w-[1760px] items-center px-8 lg:min-h-[680px] lg:px-16 xl:px-24">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-600/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">
                {(banner.subtitle?.split(',')[0]) ?? 'Thời trang chất lượng'}
              </p>
            </div>
            <h1 className="text-5xl font-black uppercase leading-[0.92] tracking-tight text-white md:text-7xl xl:text-8xl">
              {(banner.title || 'NEW ARRIVALS').split('\\n').map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h1>
            <p className="mt-6 max-w-lg text-base text-white/60 md:text-lg">{banner.subtitle ?? ''}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to={banner.linkUrl || '/client/products'}
                className="inline-flex items-center gap-2 rounded-full bg-white px-9 py-4 text-sm font-black uppercase text-black shadow-lg transition hover:bg-gray-100 hover:shadow-xl">
                {banner.ctaText || 'MUA NGAY'} <ArrowRight size={16} />
              </Link>
              <Link to="/client/products"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-9 py-4 text-sm font-black uppercase text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/10">
                Xem tất cả
              </Link>
            </div>
            {banners.length > 1 && (
              <div className="mt-12 flex items-center gap-3">
                {banners.map((b, i) => (
                  <button key={b.bannerId} onClick={() => setActiveBanner(i)}
                    className={'h-[3px] rounded-full transition-all duration-300 ' + (i === activeBanner ? 'w-12 bg-white' : 'w-3 bg-white/30')} />
                ))}
              </div>
            )}
          </div>
          {banners.length > 1 && (
            <div className="absolute right-8 top-1/2 flex -translate-y-1/2 flex-col gap-3">
              <button onClick={() => setActiveBanner((c) => (c - 1 + banners.length) % banners.length)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20">
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setActiveBanner((c) => (c + 1) % banners.length)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20">
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── CATEGORY GRID ────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pt-14 pb-10 lg:px-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Danh mục sản phẩm</p>
            <h2 className="mt-1.5 text-2xl font-black uppercase tracking-tight text-black md:text-3xl">MUA SẮM THEO DANH MỤC</h2>
          </div>
          <Link to="/client/products" className="flex items-center gap-1 text-sm font-bold text-gray-400 underline underline-offset-4 hover:text-black transition">
            Tất cả <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {displayCats.map((cat) => {
            const imgSrc = getCategoryImage(cat);
            return (
              <Link key={cat.categoryId} to={`/client/products?categoryId=${cat.categoryId}`}
                className="group relative overflow-hidden rounded-2xl bg-gray-100 transition hover:shadow-lg"
                style={{ aspectRatio: '3/4' }}>
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={cat.categoryName}
                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-50 via-slate-100 to-slate-200 text-blue-300">
                    <Shirt size={32} />
                    <span className="text-3xl font-black text-blue-200">{cat.categoryName[0]}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 transition group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <span className="block text-center text-[11px] font-black uppercase leading-tight tracking-wide text-white drop-shadow">
                    {cat.categoryName}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-[#f9f9f9]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-gray-200 md:grid-cols-4 md:divide-y-0">
          {TRUST_POINTS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 px-6 py-5">
              <Icon size={22} className="shrink-0 text-blue-600" />
              <div>
                <p className="text-sm font-black text-gray-900">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FLASH SALE ───────────────────────────────── */}
      {saleProducts.length > 0 && (
        <section className="bg-[#fff5f5] py-10">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Zap size={20} className="text-red-600" fill="currentColor" />
                    <span className="text-2xl font-black uppercase tracking-tight text-red-600">FLASH SALE</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">Kết thúc sau:</p>
                </div>
                <CountdownTimer endTime={flashSaleEnd} />
              </div>
              <Link to="/client/products?hasSalePrice=true"
                className="flex items-center gap-1 text-sm font-bold text-red-600 underline underline-offset-4 hover:text-red-800">
                Xem thêm <ArrowRight size={14} />
              </Link>
            </div>
            <ProductCarousel products={saleProducts} loading={false} addingId={addingId} onAddToCart={handleAddToCart} />
          </div>
        </section>
      )}

      {/* ── NEW ARRIVALS ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-green-600">Mới về hôm nay</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-black md:text-3xl">HÀNG MỚI VỀ</h2>
          </div>
          <Link to="/client/products?sortBy=created_at&sortOrder=DESC"
            className="flex items-center gap-1 text-sm font-bold text-gray-500 underline underline-offset-4 hover:text-black">
            Xem thêm <ArrowRight size={14} />
          </Link>
        </div>
        <ProductCarousel products={newArrivals} loading={loadingNew} addingId={addingId} onAddToCart={handleAddToCart} />
      </section>

      {/* ── ACTIVEWEAR BANNER ────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: 420 }}>
        <img
          src="https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1600&q=80"
          alt="Active wear"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/85 via-[#0f172a]/50 to-transparent" />
        <div className="relative flex h-full min-h-[420px] flex-col justify-center px-10 text-white lg:px-24">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Bộ sưu tập</p>
          <h2 className="mt-3 text-5xl font-black uppercase leading-tight md:text-7xl">ACTIVE<br />WEAR</h2>
          <p className="mt-4 max-w-sm text-white/70">Thiết kế cho người năng động — từ gym đến đường phố, thoải mái cả ngày.</p>
          <Link to="/client/products?search=the%20thao"
            className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border-2 border-white px-8 py-3.5 text-sm font-black uppercase transition hover:bg-white hover:text-black">
            Khám phá ngay <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">Bán chạy nhất</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-black md:text-3xl">SẢN PHẨM NỔI BẬT</h2>
          </div>
          <Link to="/client/products"
            className="flex items-center gap-1 text-sm font-bold text-gray-500 underline underline-offset-4 hover:text-black">
            Xem thêm <ArrowRight size={14} />
          </Link>
        </div>
        <ProductCarousel products={products} loading={loadingFeatured} addingId={addingId} onAddToCart={handleAddToCart} />
      </section>

      {/* ── BRAND STORY ──────────────────────────────── */}
      <section className="bg-[#0f172a] py-16 text-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mb-10 text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">Về chúng tôi</p>
            <h2 className="mt-2 text-3xl font-black uppercase tracking-tight md:text-4xl">TẠI SAO CHỌN CHÚNG TÔI?</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/60">
              Chúng tôi không chỉ bán quần áo — chúng tôi xây dựng phong cách sống tự tin, thoải mái cho người Việt.
            </p>
          </div>
          <div className="mb-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 md:grid-cols-4">
            {BRAND_STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center justify-center bg-white/5 px-4 py-8 text-center">
                <span className="text-3xl font-black text-white md:text-4xl">{value}</span>
                <span className="mt-1 text-xs text-white/50">{label}</span>
              </div>
            ))}
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {QUALITY_PILLARS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-white/5 p-6">
                <Icon size={24} className="text-blue-400" />
                <h3 className="mt-3 text-base font-black text-white">{title}</h3>
                <p className="mt-1.5 text-sm text-white/55">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOOKBOOK ─────────────────────────────────── */}
      {lookbook.length > 0 && (
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Cảm hứng mặc đẹp</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-black md:text-3xl">LOOKBOOK MÙA NÀY</h2>
          </div>
          <Link to="/client/products" className="flex items-center gap-1 text-sm font-bold text-gray-400 underline underline-offset-4 hover:text-black transition">
            Khám phá <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Link to={lookbook[0]?.href ?? '/client/products'}
            className="group relative overflow-hidden rounded-3xl md:row-span-2"
            style={{ minHeight: 480 }}>
            {lookbook[0]?.image && <img src={lookbook[0].image} alt={lookbook[0].label}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute bottom-7 left-7 right-7">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/60">{lookbook[0]?.sub}</p>
              <h3 className="mt-2 text-3xl font-black uppercase leading-tight text-white">{lookbook[0]?.label}</h3>
              <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/35 px-5 py-2 text-sm font-black text-white backdrop-blur-sm transition hover:bg-white/10">
                Xem ngay <ArrowRight size={13} />
              </span>
            </div>
          </Link>
          {lookbook.slice(1).map((item) => (
            <Link key={item.id} to={item.href}
              className="group relative overflow-hidden rounded-3xl"
              style={{ minHeight: 232 }}>
              <img src={item.image} alt={item.label}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-5 left-6 right-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">{item.sub}</p>
                <h3 className="mt-1 text-xl font-black uppercase text-white">{item.label}</h3>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-black text-white/70 underline underline-offset-4">
                  Xem ngay <ArrowRight size={11} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      )}

      {/* ── GENDER SPLIT ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-12 lg:px-10">
        <div className="grid gap-4 md:grid-cols-2">
          {genderBanners.map((item) => (
            <Link key={item.label} to={item.href}
              className="group relative overflow-hidden rounded-3xl" style={{ minHeight: 360 }}>
              <div className="absolute inset-0" style={{ background: item.fallback }} />
              <img
                src={item.image}
                alt={item.label}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                style={{ objectPosition: item.objectPosition }}
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <h3 className="text-4xl font-black uppercase tracking-tight text-white">{item.label}</h3>
                <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-black text-black transition group-hover:bg-gray-100">
                  MUA NGAY <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section className="bg-[#f8f9ff] py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mb-8 text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Đánh giá thực tế</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-black md:text-3xl">KHÁCH HÀNG NÓI GÌ?</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.id} className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <Quote size={32} className="absolute right-6 top-6 text-blue-100" />
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} fill={s <= t.rating ? '#f59e0b' : 'none'} className="text-amber-400" />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">"{t.text}"</p>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-sm font-black text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.loc} · {t.product}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STYLE ADVISOR ────────────────────────────── */}
      <section className="bg-black py-16 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 text-center lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">AI Style Advisor</p>
          <h2 className="text-3xl font-black uppercase tracking-tight md:text-4xl">Cần tư vấn phối đồ?</h2>
          <p className="max-w-lg text-base text-white/60">
            Mô tả phong cách, chiều cao và dịp sử dụng — AI gợi ý size, chất liệu và sản phẩm phù hợp ngay lập tức.
          </p>
          <Link to="/client/style-advisor"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-black text-black transition hover:bg-gray-100">
            Thử ngay <Sparkles size={16} />
          </Link>
        </div>
      </section>

      {/* ── NEWS ─────────────────────────────────────── */}
      {news.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">Cảm hứng mặc đẹp</p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-black md:text-3xl">TIN TỨC & PHONG CÁCH</h2>
            </div>
            <Link to="/client/news" className="flex items-center gap-1 text-sm font-bold text-gray-500 underline underline-offset-4 hover:text-black">
              Đọc thêm <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-4">
            {news.slice(0, 4).map((item) => (
              <Link key={item.newsId} to={`/client/news/${item.slug}`}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
                <div className="relative aspect-[16/9] overflow-hidden bg-[#e8f4ff]">
                  {item.titleImageUrl
                    ? <img src={item.titleImageUrl} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    : <div className="flex h-full items-center justify-center text-blue-200"><Shirt size={40} /></div>
                  }
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Journal</p>
                  <h3 className="mt-1.5 line-clamp-2 text-sm font-black text-gray-900 group-hover:text-blue-600">{item.title}</h3>
                  {item.subTitle && <p className="mt-1.5 line-clamp-2 text-xs text-gray-500">{item.subTitle}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── SIZE GUIDE CTA ───────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-10 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl bg-[#0f172a] px-8 py-10 text-white md:flex-row md:px-12">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600">
              <Ruler size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase">Không chắc về size?</h3>
              <p className="mt-0.5 text-sm text-white/60">Xem bảng size chi tiết để tìm số đo phù hợp nhất với vóc dáng của bạn.</p>
            </div>
          </div>
          <Link to="/client/products"
            className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-black text-black transition hover:bg-gray-100">
            Xem bảng size <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <section className="bg-[#f9f9f9] py-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-10">
          <div className="mb-8 text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Hỗ trợ</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-black md:text-3xl">CÂU HỎI THƯỜNG GẶP</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white divide-y divide-gray-200">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-black text-gray-900 transition hover:bg-gray-50">
                  {item.q}
                  <ChevronDown size={16} className={'shrink-0 transition-transform ' + (openFaq === i ? 'rotate-180' : '')} />
                </button>
                {openFaq === i && (
                  <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 text-sm leading-relaxed text-gray-600">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ───────────────────────────────── */}
      <section className="bg-[#eaf2ff] py-16">
        <div className="mx-auto flex max-w-2xl flex-col items-center px-6 text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Newsletter</p>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-tight text-gray-900">Nhận ưu đãi độc quyền</h2>
          <p className="mt-3 text-sm text-gray-500">Đăng ký để nhận mã giảm giá, lookbook mới và gợi ý phối đồ hằng tuần.</p>
          <form onSubmit={handleNewsletter} className="mt-6 flex w-full max-w-md gap-2">
            <input value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)}
              type="email" placeholder="Email của bạn"
              className="min-h-[48px] flex-1 rounded-full border border-blue-200 bg-white px-5 text-sm outline-none focus:border-blue-500" />
            <button type="submit"
              className="shrink-0 rounded-full bg-blue-600 px-7 py-2 text-sm font-black text-white transition hover:bg-blue-700">
              Đăng ký
            </button>
          </form>
          {newsletterStatus && <p className="mt-3 text-sm font-semibold text-gray-600">{newsletterStatus}</p>}
        </div>
      </section>
    </div>
  );
}
