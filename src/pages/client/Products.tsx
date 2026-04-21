import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Leaf,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { clientApi } from '../../lib/client-api';
import { useCart } from '../../hooks/useCart';
import { useClientSession } from '../../hooks/useClientSession';
import { useNavigate } from 'react-router-dom';

type Product = {
  _id: string;
  productName: string;
  productSlug: string;
  productPrice: number;
  discountedPrice?: number;
  images?: Array<{ imageUrl: string; isPrimary: boolean }>;
  category?: { _id: string; categoryName: string };
  origin?: { originName: string };
  activeDiscount?: { discountPercent: number };
};

type Category = { _id: string; categoryName: string; categorySlug: string };

type ProductsResponse = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

const SORT_OPTIONS = [
  { value: '', label: 'Mặc định' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'newest', label: 'Mới nhất' },
];

const PAGE_SIZE = 12;

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session } = useClientSession();
  const { addItem } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const search = searchParams.get('search') ?? '';
  const categoryId = searchParams.get('categoryId') ?? '';
  const sort = searchParams.get('sort') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10);

  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    void clientApi
      .get<Category[]>('/categories')
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      if (search) params.set('search', search);
      if (categoryId) params.set('categoryId', categoryId);
      if (sort === 'price_asc') params.set('sortBy', 'price');
      else if (sort === 'price_desc') { params.set('sortBy', 'price'); params.set('sortOrder', 'DESC'); }
      else if (sort === 'newest') params.set('sortBy', 'createdAt');

      const data = await clientApi.get<ProductsResponse>(`/products?${params.toString()}`);
      setProducts(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, sort]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    updateParam('search', localSearch.trim());
  };

  const handleAddToCart = async (productId: string) => {
    if (!session) { void navigate('/client/login'); return; }
    setAddingId(productId);
    try { await addItem(productId, 1); } finally { setAddingId(null); }
  };

  const activeFilters = [
    search && { key: 'search', label: `Tìm: "${search}"`, clear: () => { setLocalSearch(''); updateParam('search', ''); } },
    categoryId && categories.find((c) => c._id === categoryId) && {
      key: 'cat',
      label: categories.find((c) => c._id === categoryId)?.categoryName,
      clear: () => updateParam('categoryId', ''),
    },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  return (
    <div style={{ background: '#f2f0eb', minHeight: '80vh' }}>
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {/* Page header */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: '#006241' }}>
            Sản phẩm
          </p>
          <h1 className="mt-1 text-3xl font-black" style={{ color: '#1E3932' }}>
            {categoryId
              ? categories.find((c) => c._id === categoryId)?.categoryName ?? 'Danh mục'
              : search
              ? `Kết quả: "${search}"`
              : 'Tất cả sản phẩm'}
          </h1>
          {total > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              Tìm thấy <strong>{total}</strong> sản phẩm
            </p>
          )}
        </div>

        {/* Active filters */}
        {activeFilters.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                onClick={f.clear}
                className="flex items-center gap-1.5 rounded-full border border-[#006241]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#006241]"
              >
                {f.label} <X size={12} />
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar filters */}
          <aside
            className={`${
              filtersOpen ? 'fixed inset-0 z-50 overflow-y-auto' : 'hidden'
            } w-full bg-white lg:relative lg:block lg:w-64 lg:shrink-0 lg:rounded-2xl lg:bg-white lg:p-5 lg:shadow-none`}
            style={{ maxHeight: filtersOpen ? '100vh' : undefined }}
          >
            {filtersOpen && (
              <div className="flex items-center justify-between border-b p-5">
                <h3 className="font-bold">Bộ lọc</h3>
                <button onClick={() => setFiltersOpen(false)}><X size={20} /></button>
              </div>
            )}
            <div className={filtersOpen ? 'p-5' : ''}>
              {/* Search */}
              <div className="mb-5 hidden lg:block">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Tìm sản phẩm..."
                    className="w-full rounded-full border border-black/10 bg-[#f2f0eb] py-2.5 pl-4 pr-10 text-sm outline-none focus:border-[#006241]"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#006241]">
                    <Search size={16} />
                  </button>
                </form>
              </div>

              {/* Categories */}
              <div>
                <p className="mb-3 text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Danh mục
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => { updateParam('categoryId', ''); setFiltersOpen(false); }}
                    className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                      !categoryId ? 'bg-[#006241] text-white' : 'text-[#1E3932] hover:bg-[#006241]/8'
                    }`}
                  >
                    Tất cả sản phẩm
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => { updateParam('categoryId', cat._id); setFiltersOpen(false); }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                        categoryId === cat._id ? 'bg-[#006241] text-white' : 'text-[#1E3932] hover:bg-[#006241]/8'
                      }`}
                    >
                      {cat.categoryName}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="mb-5 flex items-center justify-between gap-3">
              <button
                onClick={() => setFiltersOpen(true)}
                className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#1E3932] lg:hidden"
              >
                <Filter size={15} /> Bộ lọc
              </button>
              <div className="ml-auto flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-gray-400" />
                <select
                  value={sort}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#1E3932] outline-none"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 animate-pulse rounded-2xl bg-white" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 text-center">
                <Leaf size={48} className="mb-4 text-[#006241]/20" />
                <h3 className="font-bold text-[#1E3932]">Không tìm thấy sản phẩm</h3>
                <p className="mt-1 text-sm text-gray-400">Thử thay đổi bộ lọc hoặc tìm kiếm khác.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {products.map((product) => {
                  const primaryImage =
                    product.images?.find((i) => i.isPrimary)?.imageUrl ?? product.images?.[0]?.imageUrl;
                  const hasDiscount =
                    product.discountedPrice && product.discountedPrice < product.productPrice;
                  const displayPrice = hasDiscount
                    ? (product.discountedPrice ?? product.productPrice)
                    : product.productPrice;

                  return (
                    <div
                      key={product._id}
                      className="group overflow-hidden rounded-2xl border border-black/5 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="relative overflow-hidden bg-[#f2f0eb]">
                        {primaryImage ? (
                          <img
                            src={primaryImage}
                            alt={product.productName}
                            className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-44 items-center justify-center">
                            <Leaf size={40} className="text-[#006241]/20" />
                          </div>
                        )}
                        {hasDiscount && (
                          <span className="absolute left-2 top-2 rounded-full bg-[#c82014] px-2 py-0.5 text-[10px] font-black text-white">
                            -{product.activeDiscount?.discountPercent ?? 0}%
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        {product.category && (
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#006241' }}>
                            {product.category.categoryName}
                          </p>
                        )}
                        <h3 className="line-clamp-2 text-sm font-bold" style={{ color: '#1E3932' }}>
                          {product.productName}
                        </h3>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="font-black text-[#006241]">{formatPrice(displayPrice)}</span>
                          {hasDiscount && (
                            <span className="text-xs text-gray-400 line-through">
                              {formatPrice(product.productPrice)}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Link
                            to={`/client/products/${product._id}`}
                            className="flex-1 rounded-full border border-[#006241] py-2 text-center text-xs font-bold text-[#006241] transition hover:bg-[#006241] hover:text-white"
                          >
                            Chi tiết
                          </Link>
                          <button
                            disabled={addingId === product._id}
                            onClick={() => void handleAddToCart(product._id)}
                            className="flex-1 rounded-full py-2 text-xs font-bold text-white transition disabled:opacity-60 active:scale-95"
                            style={{ background: '#00754A' }}
                          >
                            {addingId === product._id ? '...' : 'Thêm vào giỏ'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => updateParam('page', String(page - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#1E3932] disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => updateParam('page', String(p))}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                        p === page ? 'text-white' : 'border border-black/10 bg-white text-[#1E3932]'
                      }`}
                      style={p === page ? { background: '#006241' } : {}}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  disabled={page >= totalPages}
                  onClick={() => updateParam('page', String(page + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#1E3932] disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
