import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Shirt,
  Minus,
  Plus,
  ShoppingCart,
  Heart,
  Star,
  Truck,
  ShieldCheck,
  ArrowLeft,
  Package,
  MessageSquare,
  Send,
  LoaderCircle,
  ThumbsUp,
  ThumbsDown,
  Camera,
  Upload,
  X,
  Sparkles,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { clientApi } from '../../lib/client-api';
import {
  createVirtualTryOnSession,
  getVirtualTryOnErrorMessage,
  getVirtualTryOnWarningLabel,
  type VirtualTryOnResult,
} from '../../lib/virtual-try-on';
import { useCart } from '../../hooks/useCart';
import { useClientSession } from '../../hooks/useClientSession';
import { useToast } from '../../hooks/useToast';

type ProductImage = {
  imageId?: string;
  productImageId?: string;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
  variantId?: string;
  variantColorId?: string | null;
  variantSizeId?: string | null;
};
type VariantImage = { imageId: string; imageUrl: string; sortOrder: number };
type ColorOption = { colorId: string; colorName: string; colorCode: string | null };
type SizeOption = { sizeId: string; sizeName: string; sizeCode: string | null; sortOrder?: number };
type ProductVariant = {
  variantId: string;
  sku: string | null;
  price: string | null;
  salePrice: string | null;
  stockQuantity: number;
  isActive: boolean;
  color: ColorOption | null;
  size: SizeOption | null;
  images: VariantImage[];
};

type Product = {
  productId: string;
  productName: string;
  productSlug: string;
  productPrice: string;
  productPriceSale: string | null;
  effectivePrice: string;
  basePrice: string;
  description: string | null;
  unit: string | null;
  quantityAvailable: number;
  isShow: boolean;
  ratingAverage: string;
  ratingCount: number;
  primaryImageUrl?: string | null;
  images: ProductImage[];
  category: { categoryId: string; categoryName: string; categorySlug: string } | null;
  subcategory: { subcategoryId: string; subcategoryName: string } | null;
  origin: { originId: string; originName: string } | null;
  tags: Array<{ tagId: string; tagName: string }>;
  appliedDiscount: {
    id: string;
    code: string;
    name: string;
    type: string;
    value: string;
  } | null;
  variants?: ProductVariant[];
  colorOptions?: ColorOption[];
  sizeOptions?: SizeOption[];
};

type RelatedProduct = {
  productId: string;
  productName: string;
  effectivePrice: string;
  basePrice?: string;
  primaryImageUrl: string | null;
};

type RecommendationResponse = {
  items?: RelatedProduct[];
};

type Review = {
  id: string;
  userId: string;
  content: string;
  rating: number;
  likeCount: number;
  dislikeCount: number;
  createdAt: string;
};

type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type MyOrder = {
  id: string;
  status: string;
  items?: OrderItem[];
};

function formatPrice(price: number | string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price));
}

function findSelectedVariant(product: Product | null, colorId: string | null, sizeId: string | null) {
  const variants = product?.variants?.filter((variant) => variant.isActive) ?? [];
  if (variants.length === 0) return null;
  return (
    variants.find((variant) => {
      const sameColor = colorId ? variant.color?.colorId === colorId : true;
      const sameSize = sizeId ? variant.size?.sizeId === sizeId : true;
      return sameColor && sameSize;
    }) ?? null
  );
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function validateTryOnImage(file: File) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP';
  }
  if (file.size > 8 * 1024 * 1024) {
    return 'Ảnh không được vượt quá 8MB';
  }
  return null;
}

function isUsableImageUrl(value?: string | null) {
  if (!value) return false;
  return !/\/\/example\.com\//i.test(value);
}

function uniqueImages(images: ProductImage[]) {
  const seen = new Set<string>();
  return images.filter((image) => {
    const key = image.imageUrl.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            size={18}
            fill={(hover || value) >= s ? '#1D4ED8' : 'none'}
            className={(hover || value) >= s ? 'text-[#1D4ED8]' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useClientSession();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'info' | 'reviews'>('desc');
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [addedMsg, setAddedMsg] = useState(false);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const tryOnInputRef = useRef<HTMLInputElement | null>(null);
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [tryOnFile, setTryOnFile] = useState<File | null>(null);
  const [tryOnPreviewUrl, setTryOnPreviewUrl] = useState<string | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnError, setTryOnError] = useState<string | null>(null);
  const [tryOnResult, setTryOnResult] = useState<VirtualTryOnResult | null>(null);

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [eligibleOrderItemId, setEligibleOrderItemId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  // Track voted reviews in state: reviewId -> 'like' | 'dislike' | null
  const [reviewVotes, setReviewVotes] = useState<Record<string, 'like' | 'dislike' | null>>({});
  // Local counts override from API responses
  const [reviewCounts, setReviewCounts] = useState<Record<string, { likeCount: number; dislikeCount: number }>>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void clientApi
      .get<Product>(`/products/${id}`)
      .then(async (data) => {
        setProduct(data);
        void clientApi
          .get<RecommendationResponse>(
            `/intelligence/product-recommendations?productId=${encodeURIComponent(id)}&limit=8&historyDays=180`,
          )
          .then((r) => {
            const items = (r.items ?? []).filter((p) => p.productId !== id);
            if (items.length > 0) setRelated(items);
          })
          .catch(() => {});
        if (data.category?.categoryId) {
          void clientApi
            .get<{ meta: unknown; items: RelatedProduct[] }>(`/products?categoryId=${data.category.categoryId}&limit=5`)
            .then((r) => {
              setRelated((current) =>
                current.length > 0 ? current : (r.items ?? []).filter((p) => p.productId !== id),
              );
            })
            .catch(() => {});
        }
      })
      .catch(() => { void navigate('/client/products'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    const variants = product?.variants?.filter((variant) => variant.isActive) ?? [];
    if (variants.length === 0) {
      setSelectedColorId(null);
      setSelectedSizeId(null);
      return;
    }
    const firstAvailable = variants.find((variant) => variant.stockQuantity > 0) ?? variants[0];
    setSelectedColorId(firstAvailable.color?.colorId ?? null);
    setSelectedSizeId(firstAvailable.size?.sizeId ?? null);
    setSelectedImage(0);
    setQuantity(1);
  }, [product?.productId]);

  useEffect(() => {
    return () => {
      if (tryOnPreviewUrl) URL.revokeObjectURL(tryOnPreviewUrl);
    };
  }, [tryOnPreviewUrl]);

  // Check wishlist status
  useEffect(() => {
    if (!session || !id) return;
    void clientApi
      .get<Array<{ productId: string }>>('/wishlist')
      .then((items) => {
        setWishlisted(items.some((item) => item.productId === id));
      })
      .catch(() => {});
  }, [session, id]);

  // Load reviews
  useEffect(() => {
    if (!id) return;
    setReviewsLoading(true);
    void clientApi
      .get<Review[]>(`/reviews/products/${id}`)
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [id]);

  // Check if user can review (has DELIVERED order with this product)
  useEffect(() => {
    if (!session || !id) return;
    void clientApi
      .get<MyOrder[]>('/users/me/orders')
      .then(async (orders) => {
        const deliveredOrders = orders.filter((o) => o.status === 'delivered');
        for (const order of deliveredOrders) {
          const detail = await clientApi
            .get<MyOrder & { items: OrderItem[] }>(`/users/me/orders/${order.id}`)
            .catch(() => null);
          if (!detail) continue;
          const matchingItem = detail.items?.find((item) => item.productId === id);
          if (matchingItem) {
            const alreadyDone = reviews.some((r) => r.id === matchingItem.id);
            setAlreadyReviewed(alreadyDone);
            if (!alreadyDone) setEligibleOrderItemId(matchingItem.id);
            break;
          }
        }
      })
      .catch(() => {});
  }, [session, id, reviews]);

  const handleAddToCart = async () => {
    if (!session) { void navigate('/client/login'); return; }
    const resolvedVariant = findSelectedVariant(product, selectedColorId, selectedSizeId);
    if ((product?.variants?.length ?? 0) > 0 && !resolvedVariant) {
      showToast({ tone: 'info', title: 'Vui lòng chọn màu sắc và kích thước trước khi thêm vào giỏ' });
      return;
    }
    setAdding(true);
    try {
      await addItem(id!, quantity, resolvedVariant?.variantId);
      setAddedMsg(true);
      setTimeout(() => setAddedMsg(false), 2500);
    } catch {
      showToast({ tone: 'error', title: 'Không thể thêm vào giỏ hàng, vui lòng thử lại' });
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!session) { void navigate('/client/login'); return; }
    const resolvedVariant = findSelectedVariant(product, selectedColorId, selectedSizeId);
    if ((product?.variants?.length ?? 0) > 0 && !resolvedVariant) {
      showToast({ tone: 'info', title: 'Vui lòng chọn màu sắc và kích thước' });
      return;
    }
    try {
      await addItem(id!, quantity, resolvedVariant?.variantId);
      void navigate('/client/cart');
    } catch {
      showToast({ tone: 'error', title: 'Không thể xử lý, vui lòng thử lại' });
    }
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

  const handleTryOnFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!file) return;

    const validationError = validateTryOnImage(file);
    if (validationError) {
      setTryOnError(validationError);
      setTryOnFile(null);
      setTryOnPreviewUrl(null);
      return;
    }

    setTryOnFile(file);
    setTryOnPreviewUrl(URL.createObjectURL(file));
    setTryOnResult(null);
    setTryOnError(null);
  };

  const resetTryOn = () => {
    setTryOnFile(null);
    setTryOnPreviewUrl(null);
    setTryOnResult(null);
    setTryOnError(null);
  };

  const handleCreateTryOn = async () => {
    if (!product || !id) return;
    if (!currentImage) {
      setTryOnError('Sản phẩm chưa có ảnh để thử đồ');
      return;
    }
    if (!tryOnFile) {
      setTryOnError('Vui lòng chọn ảnh của bạn');
      return;
    }

    setTryOnLoading(true);
    setTryOnError(null);
    try {
      const result = await createVirtualTryOnSession({
        productId: id,
        variantId: selectedVariant?.variantId,
        personImage: tryOnFile,
        posePreference: 'auto',
      });
      setTryOnResult(result);
    } catch (err) {
      setTryOnError(
        err instanceof Error
          ? getVirtualTryOnErrorMessage(err.message)
          : 'Không thể tạo ảnh thử đồ',
      );
    } finally {
      setTryOnLoading(false);
    }
  };

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!eligibleOrderItemId || !id) return;
    if (!reviewForm.content.trim()) {
      setReviewMsg({ type: 'error', text: 'Vui lòng nhập nội dung đánh giá' });
      return;
    }
    setSubmittingReview(true);
    try {
      await clientApi.post(`/reviews/products/${id}`, {
        orderItemId: eligibleOrderItemId,
        rating: reviewForm.rating,
        content: reviewForm.content.trim(),
      });
      setReviewMsg({ type: 'success', text: 'Đánh giá của bạn đã được gửi!' });
      setAlreadyReviewed(true);
      setEligibleOrderItemId(null);
      // Reload reviews
      const fresh = await clientApi.get<Review[]>(`/reviews/products/${id}`).catch(() => []);
      setReviews(Array.isArray(fresh) ? fresh : []);
    } catch (err) {
      setReviewMsg({ type: 'error', text: err instanceof Error ? err.message : 'Gửi đánh giá thất bại' });
    } finally {
      setSubmittingReview(false);
      setTimeout(() => setReviewMsg(null), 4000);
    }
  };

  const handleReviewVote = async (reviewId: string, voteType: 'like' | 'dislike') => {
    const current = reviewVotes[reviewId] ?? null;
    const base = reviewCounts[reviewId] ?? reviews.find((r) => r.id === reviewId) ?? { likeCount: 0, dislikeCount: 0 };

    if (current === voteType) {
      // undo vote
      try {
        const res = await clientApi.delete<{ likeCount: number; dislikeCount: number }>(
          `/reviews/${reviewId}/${voteType}`,
        );
        setReviewVotes((v) => ({ ...v, [reviewId]: null }));
        setReviewCounts((c) => ({ ...c, [reviewId]: res }));
      } catch {}
    } else {
      // undo opposite if exists, then set new
      if (current) {
        await clientApi.delete(`/reviews/${reviewId}/${current}`).catch(() => {});
      }
      try {
        const res = await clientApi.post<{ likeCount: number; dislikeCount: number }>(
          `/reviews/${reviewId}/${voteType}`,
        );
        setReviewVotes((v) => ({ ...v, [reviewId]: voteType }));
        setReviewCounts((c) => ({ ...c, [reviewId]: res }));
      } catch {}
    }
  };

  if (loading) {
    return (
      <div className="client-surface flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2563EB] border-t-transparent" />
      </div>
    );
  }

  if (!product) return null;

  const activeVariants = product.variants?.filter((variant) => variant.isActive) ?? [];
  const hasVariants = activeVariants.length > 0;
  const selectedVariant = findSelectedVariant(product, selectedColorId, selectedSizeId);
  const selectedStock = hasVariants ? selectedVariant?.stockQuantity ?? 0 : product.quantityAvailable;
  const variantImages: ProductImage[] =
    selectedVariant?.images
      ?.filter((image) => isUsableImageUrl(image.imageUrl))
      .map((image) => ({
        imageId: image.imageId,
        imageUrl: image.imageUrl,
        isPrimary: false,
        sortOrder: image.sortOrder,
        variantId: selectedVariant.variantId,
        variantColorId: selectedVariant.color?.colorId ?? null,
        variantSizeId: selectedVariant.size?.sizeId ?? null,
      })) ?? [];
  const otherVariantImages: ProductImage[] = activeVariants
    .filter((variant) => variant.variantId !== selectedVariant?.variantId)
    .flatMap((variant) =>
      (variant.images ?? [])
        .filter((image) => isUsableImageUrl(image.imageUrl))
        .map((image) => ({
          imageId: image.imageId,
          imageUrl: image.imageUrl,
          isPrimary: false,
          sortOrder: image.sortOrder,
          variantId: variant.variantId,
          variantColorId: variant.color?.colorId ?? null,
          variantSizeId: variant.size?.sizeId ?? null,
        })),
    );
  const productImages = [...(product.images ?? [])]
    .sort((a, b) => {
      if (a.isPrimary) return -1;
      if (b.isPrimary) return 1;
      return a.sortOrder - b.sortOrder;
    })
    .filter((image) => isUsableImageUrl(image.imageUrl))
    .map((image, index) => ({
      imageId: image.imageId ?? image.productImageId ?? `product-image-${index}`,
      imageUrl: image.imageUrl,
      isPrimary: Boolean(image.isPrimary),
      sortOrder: image.sortOrder ?? index,
    }));
  const fallbackImages: ProductImage[] =
    productImages.length > 0
      ? productImages
      : isUsableImageUrl(product.primaryImageUrl)
        ? [
            {
              imageId: 'primary-image',
              imageUrl: product.primaryImageUrl!,
              isPrimary: true,
              sortOrder: 0,
            },
          ]
        : [];
  const visibleImages = uniqueImages([
    ...variantImages,
    ...fallbackImages,
    ...otherVariantImages,
  ]);
  const currentImage = visibleImages[selectedImage]?.imageUrl ?? visibleImages[0]?.imageUrl;
  const tryOnOutputImage = tryOnResult?.resultImageUrl ?? tryOnResult?.resultImageDataUrl ?? null;
  const canTryOn = Boolean(currentImage);
  const displayPrice = Number(selectedVariant?.salePrice ?? selectedVariant?.price ?? product.effectivePrice);
  const originalPrice = Number(selectedVariant?.price ?? product.basePrice);
  const hasDiscount = displayPrice < originalPrice;
  const savings = hasDiscount ? originalPrice - displayPrice : 0;
  const avgRating = Number(product.ratingAverage) || 0;
  const ratingCount = product.ratingCount;
  const canPurchase = selectedStock > 0 && (!hasVariants || Boolean(selectedVariant));

  // Star distribution from reviews
  const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => { dist[r.rating] = (dist[r.rating] ?? 0) + 1; });

  return (
    <div className="client-surface min-h-[80vh]">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/client/products" className="flex items-center gap-1 hover:text-[#2563EB]">
            <ArrowLeft size={14} /> Sản phẩm
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                to={`/client/products?categoryId=${product.category.categoryId}`}
                className="hover:text-[#2563EB]"
              >
                {product.category.categoryName}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="line-clamp-1 font-semibold text-[#0B0F19]">{product.productName}</span>
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Images */}
          <div>
            <div className="client-card overflow-hidden">
              {currentImage ? (
                <img src={currentImage} alt={product.productName} className="h-96 w-full object-contain p-4" />
              ) : (
                <div className="flex h-96 items-center justify-center">
                  <Shirt size={64} className="text-[#2563EB]/20" />
                </div>
              )}
            </div>
            {visibleImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {visibleImages.map((img, idx) => (
                  <button
                    key={img.imageId}
                    onClick={() => {
                      if (img.variantId) {
                        setSelectedColorId(img.variantColorId ?? null);
                        setSelectedSizeId(img.variantSizeId ?? null);
                        setQuantity(1);
                        setSelectedImage(0);
                        return;
                      }
                      setSelectedImage(idx);
                    }}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                      selectedImage === idx ? 'border-[#2563EB]' : 'border-transparent'
                    }`}
                  >
                    <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { icon: ShieldCheck, text: 'Cam kết chính hãng' },
                { icon: Truck, text: 'Giao hàng 2-4 ngày' },
                { icon: RotateCcw, text: 'Đổi trả 7 ngày' },
                { icon: Package, text: 'Nguồn gốc rõ ràng' },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex min-h-[54px] items-center gap-3 rounded-xl border border-[#DBEAFE] bg-white px-4 py-3 text-sm font-semibold text-gray-600 shadow-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-[#2563EB]">
                    <item.icon size={16} />
                  </span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            {product.category && (
              <Link
                to={`/client/products?categoryId=${product.category.categoryId}`}
                className="mb-2 inline-block text-xs font-bold uppercase tracking-wider text-[#2563EB] hover:underline"
              >
                {product.category.categoryName}
              </Link>
            )}
            <h1 className="text-2xl font-black leading-tight text-[#0B0F19]">{product.productName}</h1>

            {/* Rating */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={14} fill={s <= Math.round(avgRating) ? '#1D4ED8' : 'none'} className="text-[#1D4ED8]" />
                ))}
              </div>
              <span className="text-xs text-gray-400">
                ({avgRating > 0 ? avgRating.toFixed(1) : '0'} · {ratingCount} đánh giá)
              </span>
              <button
                onClick={() => setActiveTab('reviews')}
                className="text-xs font-semibold text-[#2563EB] hover:underline"
              >
                Xem đánh giá
              </button>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-end gap-3">
              <span className="text-3xl font-black text-[#2563EB]">{formatPrice(displayPrice)}</span>
              {hasDiscount && (
                <div className="flex flex-col">
                  <span className="text-sm text-gray-400 line-through">{formatPrice(originalPrice)}</span>
                  <span className="text-xs font-bold text-[#c82014]">
                    Tiết kiệm {formatPrice(savings)} ({product.appliedDiscount?.value}%)
                  </span>
                </div>
              )}
            </div>
            {product.appliedDiscount && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#c82014]/10 px-3 py-1 text-xs font-bold text-[#c82014]">
                🏷️ {product.appliedDiscount.name}
              </div>
            )}

            {/* Details */}
            <div className="client-card mt-5 space-y-2 p-4">
              {product.origin && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Xuất xứ</span>
                  <span className="font-semibold text-[#0B0F19]">{product.origin.originName}</span>
                </div>
              )}
              {product.unit && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Đơn vị</span>
                  <span className="font-semibold text-[#0B0F19]">{product.unit}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Tình trạng</span>
                {selectedStock > 10 ? (
                  <span className="font-semibold text-[#2563EB]">
                    Còn hàng ({selectedStock} {product.unit ?? 'sản phẩm'})
                  </span>
                ) : selectedStock > 0 ? (
                  <span className="font-semibold text-amber-600">
                    Sắp hết hàng (còn {selectedStock} {product.unit ?? 'sản phẩm'})
                  </span>
                ) : (
                  <span className="font-semibold text-[#c82014]">Hết hàng</span>
                )}
              </div>
            </div>

            {hasVariants && (
              <div className="mt-5 space-y-4">
                {(product.colorOptions?.length ?? 0) > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-[#0B0F19]">
                      Màu sắc: <span className="font-normal text-gray-500">{selectedVariant?.color?.colorName ?? 'Chọn màu'}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.colorOptions?.map((color) => {
                        const disabled = !activeVariants.some((variant) => variant.color?.colorId === color.colorId && variant.stockQuantity > 0);
                        return (
                          <button
                            key={color.colorId}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              setSelectedColorId(color.colorId);
                              const next = activeVariants.find((variant) => variant.color?.colorId === color.colorId && variant.size?.sizeId === selectedSizeId && variant.stockQuantity > 0)
                                ?? activeVariants.find((variant) => variant.color?.colorId === color.colorId && variant.stockQuantity > 0);
                              setSelectedSizeId(next?.size?.sizeId ?? null);
                              setQuantity(1);
                              setSelectedImage(0);
                            }}
                            className={'h-10 w-14 rounded-full border-2 p-1 transition disabled:opacity-35 ' + (selectedColorId === color.colorId ? 'border-[#2563EB]' : 'border-gray-200')}
                            title={color.colorName}
                          >
                            <span
                              className="block h-full w-full rounded-full border border-black/10"
                              style={{ background: color.colorCode ?? '#e5e7eb' }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(product.sizeOptions?.length ?? 0) > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-semibold text-[#0B0F19]">
                      Kích thước: <span className="font-normal text-gray-500">{selectedVariant?.size?.sizeName ?? 'Chọn size'}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizeOptions?.map((size) => {
                        const match = activeVariants.find((variant) => (!selectedColorId || variant.color?.colorId === selectedColorId) && variant.size?.sizeId === size.sizeId);
                        const disabled = !match || match.stockQuantity <= 0;
                        return (
                          <button
                            key={size.sizeId}
                            type="button"
                            disabled={disabled}
                            onClick={() => { setSelectedSizeId(size.sizeId); setQuantity(1); setSelectedImage(0); }}
                            className={'min-w-[64px] rounded-xl px-4 py-3 text-sm font-bold transition disabled:bg-gray-100 disabled:text-gray-400 ' + (selectedSizeId === size.sizeId ? 'bg-[#0B0F19] text-white' : 'bg-white text-[#0B0F19] border border-black/10')}
                          >
                            {size.sizeCode ?? size.sizeName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span key={tag.tagId} className="rounded-full border border-[#2563EB]/20 bg-white px-2.5 py-1 text-xs text-[#2563EB]">
                    {tag.tagName}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#DBEAFE] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DBEAFE] text-[#2563EB]">
                  <Camera size={20} />
                </div>
                <div>
                  <p className="text-sm font-black text-[#0B0F19]">Virtual Try-on</p>
                  <p className="text-xs text-gray-500">
                    {selectedVariant?.color?.colorName || selectedVariant?.size?.sizeCode
                      ? [selectedVariant?.color?.colorName, selectedVariant?.size?.sizeCode ?? selectedVariant?.size?.sizeName].filter(Boolean).join(' / ')
                      : product.productName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTryOnOpen(true);
                  setTryOnError(canTryOn ? null : 'Sản phẩm chưa có ảnh để thử đồ');
                }}
                disabled={!canTryOn}
                className="client-pill-primary inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-black disabled:opacity-45"
              >
                <Sparkles size={16} />
                Thử đồ bằng ảnh
              </button>
            </div>

            {/* Quantity */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-[#0B0F19]">Số lượng</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#0B0F19] transition hover:border-[#2563EB] disabled:opacity-40"
                >
                  <Minus size={16} />
                </button>
                <input
                  key={quantity}
                  type="number"
                  min={1}
                  max={selectedStock || 1}
                  defaultValue={quantity}
                  onBlur={(e: { currentTarget: HTMLInputElement }) => {
                    const v = parseInt(e.currentTarget.value, 10);
                    const max = selectedStock > 0 ? selectedStock : Infinity;
                    setQuantity(isNaN(v) || v < 1 ? 1 : Math.min(max, v));
                  }}
                  onKeyDown={(e: { key: string; currentTarget: HTMLInputElement }) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  className="w-14 border-0 bg-transparent text-center text-lg font-bold text-[#0B0F19] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(selectedStock || 99, q + 1))}
                  disabled={selectedStock > 0 && quantity >= selectedStock}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#0B0F19] transition hover:border-[#2563EB] disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex gap-3">
              {selectedStock === 0 ? (
                <div className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 bg-gray-100 py-3.5 text-sm font-bold text-gray-400">
                  <ShoppingCart size={18} />
                  Hết hàng
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => void handleAddToCart()}
                    disabled={adding}
                    className="client-pill-outline flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-bold disabled:opacity-60"
                  >
                    <ShoppingCart size={18} />
                    {adding ? 'Đang thêm...' : addedMsg ? '✓ Đã thêm!' : 'Thêm vào giỏ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBuyNow()}
                    className="client-pill-primary flex flex-1 items-center justify-center py-3.5 text-sm font-bold"
                  >
                    Mua ngay
                  </button>
                </>
              )}
              <button
                type="button"
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

            {/* Share */}
            <div className="mt-6 flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Chia sẻ:</span>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-white transition hover:opacity-80"
                title="Chia sẻ Facebook"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a
                href={`https://zalo.me/share/url?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(product?.productName ?? '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0068FF] text-white transition hover:opacity-80"
                title="Chia sẻ Zalo"
              >
                <span className="text-xs font-black">Z</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product?.productName ?? '')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition hover:opacity-80"
                title="Chia sẻ X (Twitter)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <button
                onClick={() => { void navigator.clipboard.writeText(window.location.href); alert('Đã sao chép link!'); }}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-[#2563EB] hover:text-[#2563EB]"
                title="Sao chép link"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              </button>
            </div>

          </div>
        </div>

        {/* Tabs */}
        <div className="mt-10 rounded-2xl bg-white">
          <div className="flex border-b border-black/5">
            {([
              { key: 'desc', label: 'Mô tả sản phẩm' },
              { key: 'info', label: 'Thông tin thêm' },
              { key: 'reviews', label: `Đánh giá (${reviews.length})` },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-4 text-sm font-bold transition-all ${
                  activeTab === tab.key
                    ? 'border-b-2 border-[#2563EB] text-[#2563EB]'
                    : 'text-gray-400 hover:text-[#0B0F19]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Description */}
            {activeTab === 'desc' && (
              product.description ? (
                <div
                  className="prose max-w-none text-sm text-gray-600"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-sm italic text-gray-400">Chưa có mô tả cho sản phẩm này.</p>
              )
            )}

            {/* Info */}
            {activeTab === 'info' && (
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
                    <span className="font-semibold text-[#0B0F19]">{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews */}
            {activeTab === 'reviews' && (
              <div>
                {/* Rating summary */}
                {reviews.length > 0 && (
                  <div className="mb-8 flex flex-col gap-6 rounded-2xl bg-[#F8FAFC] p-6 sm:flex-row sm:items-center">
                    <div className="flex flex-col items-center">
                      <span className="text-5xl font-black text-[#0B0F19]">{avgRating.toFixed(1)}</span>
                      <StarRating value={Math.round(avgRating)} />
                      <span className="mt-1 text-xs text-gray-400">{reviews.length} đánh giá</span>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = dist[star] ?? 0;
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-4 text-right text-gray-500">{star}</span>
                            <Star size={11} fill="#1D4ED8" className="text-[#1D4ED8]" />
                            <div className="flex-1 overflow-hidden rounded-full bg-white" style={{ height: 6 }}>
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, background: '#1D4ED8' }}
                              />
                            </div>
                            <span className="w-6 text-gray-400">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Review form */}
                {session && eligibleOrderItemId && !alreadyReviewed && (
                  <div className="mb-6 rounded-2xl border border-[#2563EB]/20 bg-[#DBEAFE]/30 p-5">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-black text-[#0B0F19]">
                      <MessageSquare size={16} /> Viết đánh giá của bạn
                    </h4>
                    {reviewMsg && (
                      <div
                        className={`mb-3 rounded-xl px-4 py-2.5 text-sm ${
                          reviewMsg.type === 'success'
                            ? 'bg-[#DBEAFE] text-[#0B0F19]'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {reviewMsg.text}
                      </div>
                    )}
                    <form onSubmit={(e) => void handleSubmitReview(e)}>
                      <div className="mb-3">
                        <p className="mb-1.5 text-xs font-semibold text-gray-500">Đánh giá sao</p>
                        <StarRating
                          value={reviewForm.rating}
                          onChange={(v) => setReviewForm((f) => ({ ...f, rating: v }))}
                        />
                      </div>
                      <div className="mb-3">
                        <p className="mb-1.5 text-xs font-semibold text-gray-500">Nội dung đánh giá</p>
                        <textarea
                          value={reviewForm.content}
                          onChange={(e) => setReviewForm((f) => ({ ...f, content: e.target.value }))}
                          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                          rows={3}
                          maxLength={1000}
                          className="w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[#2563EB]"
                        />
                        <p className="mt-1 text-right text-[10px] text-gray-400">
                          {reviewForm.content.length}/1000
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60 active:scale-95"
                        style={{ background: '#1D4ED8' }}
                      >
                        {submittingReview ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={14} />}
                        {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                      </button>
                    </form>
                  </div>
                )}

                {alreadyReviewed && (
                  <div className="mb-6 rounded-2xl bg-[#DBEAFE] px-4 py-3 text-sm font-semibold text-[#0B0F19]">
                    ✓ Bạn đã đánh giá sản phẩm này.
                  </div>
                )}

                {!session && (
                  <div className="mb-6 rounded-2xl border border-black/8 bg-white px-4 py-4 text-center">
                    <p className="text-sm text-gray-500">
                      <Link to="/client/login" className="font-bold text-[#2563EB] hover:underline">
                        Đăng nhập
                      </Link>{' '}
                      để viết đánh giá (cần mua hàng trước)
                    </p>
                  </div>
                )}

                {/* Review list */}
                {reviewsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="py-10 text-center">
                    <Star size={40} className="mx-auto mb-3 text-[#2563EB]/20" />
                    <p className="text-sm text-gray-400">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {reviews.map((r) => (
                      <div key={r.id} className="border-b border-black/5 pb-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black text-white"
                              style={{ background: '#0B0F19' }}
                            >
                              KH
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#0B0F19]">Khách hàng</p>
                              <p className="text-[10px] text-gray-400">
                                {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>
                          <StarRating value={r.rating} />
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-gray-600">{r.content}</p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-[11px] text-gray-400">Hữu ích không?</span>
                          <button
                            type="button"
                            onClick={() => { void handleReviewVote(r.id, 'like'); }}
                            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                              reviewVotes[r.id] === 'like'
                                ? 'border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]'
                                : 'border-black/10 text-gray-400 hover:border-[#2563EB]/40 hover:text-[#2563EB]'
                            }`}
                          >
                            <ThumbsUp size={11} />
                            {(reviewCounts[r.id]?.likeCount ?? r.likeCount) > 0
                              ? reviewCounts[r.id]?.likeCount ?? r.likeCount
                              : ''}
                          </button>
                          <button
                            type="button"
                            onClick={() => { void handleReviewVote(r.id, 'dislike'); }}
                            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                              reviewVotes[r.id] === 'dislike'
                                ? 'border-red-400 bg-red-50 text-red-500'
                                : 'border-black/10 text-gray-400 hover:border-red-300 hover:text-red-400'
                            }`}
                          >
                            <ThumbsDown size={11} />
                            {(reviewCounts[r.id]?.dislikeCount ?? r.dislikeCount) > 0
                              ? reviewCounts[r.id]?.dislikeCount ?? r.dislikeCount
                              : ''}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-xl font-black text-[#0B0F19]">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.slice(0, 4).map((p) => (
                <Link
                  key={p.productId}
                  to={`/client/products/${p.productId}`}
                  className="client-card-soft group overflow-hidden transition-all"
                >
                  <div className="overflow-hidden bg-[#F8FAFC]">
                    {p.primaryImageUrl ? (
                      <img
                        src={p.primaryImageUrl}
                        alt={p.productName}
                        className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-36 items-center justify-center">
                        <Shirt size={32} className="text-[#2563EB]/20" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-xs font-semibold text-[#0B0F19]">{p.productName}</p>
                    <p className="mt-1 text-sm font-black text-[#2563EB]">{formatPrice(p.effectivePrice)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {tryOnOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-4 py-6">
          <div
            role="dialog"
            aria-modal="true"
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DBEAFE] text-[#2563EB]">
                  <Camera size={19} />
                </div>
                <div>
                  <p className="text-base font-black text-[#0B0F19]">Virtual Try-on</p>
                  <p className="line-clamp-1 text-xs text-gray-500">{product.productName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTryOnOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-black/5 hover:text-black"
                aria-label="Dong thu do"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-black text-[#0B0F19]">Ảnh của bạn</p>
                    {tryOnFile && <span className="text-xs text-gray-400">{formatFileSize(tryOnFile.size)}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => tryOnInputRef.current?.click()}
                    className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#2563EB]/40 bg-[#F8FAFC] text-[#2563EB] transition hover:border-[#2563EB]"
                  >
                    {tryOnPreviewUrl ? (
                      <img src={tryOnPreviewUrl} alt="Ảnh người mặc" className="h-full w-full object-contain" />
                    ) : (
                      <span className="flex flex-col items-center gap-3 text-sm font-black">
                        <Upload size={28} />
                        Chọn ảnh
                      </span>
                    )}
                  </button>
                  <input
                    ref={tryOnInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleTryOnFileChange}
                  />
                  {tryOnFile && (
                    <p className="mt-2 truncate text-xs text-gray-500">{tryOnFile.name}</p>
                  )}
                </div>

                <div className="rounded-xl border border-black/10 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-black text-[#0B0F19]">Sản phẩm</p>
                    <span className="text-xs font-semibold text-gray-500">
                      {selectedVariant?.sku ?? product.unit ?? 'Fashion Ledger'}
                    </span>
                  </div>
                  <div className="grid grid-cols-[96px_1fr] gap-3">
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#F8FAFC]">
                      {currentImage ? (
                        <img src={currentImage} alt={product.productName} className="h-full w-full object-contain" />
                      ) : (
                        <Shirt size={28} className="text-[#2563EB]/25" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-bold text-[#0B0F19]">{product.productName}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {[selectedVariant?.color?.colorName, selectedVariant?.size?.sizeCode ?? selectedVariant?.size?.sizeName]
                          .filter(Boolean)
                          .join(' / ') || 'Mẫu mặc định'}
                      </p>
                      <p className="mt-2 text-sm font-black text-[#2563EB]">{formatPrice(displayPrice)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-black text-[#0B0F19]">Kết quả</p>
                    {tryOnResult?.confidence !== null && tryOnResult?.confidence !== undefined && (
                      <span className="rounded-full bg-[#DBEAFE] px-2.5 py-1 text-xs font-black text-[#2563EB]">
                        {Math.round(tryOnResult.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl bg-[#0B0F19]">
                    {tryOnOutputImage ? (
                      <img src={tryOnOutputImage} alt="Ket qua thu do" className="h-full w-full object-contain" />
                    ) : tryOnLoading ? (
                      <div className="flex flex-col items-center gap-3 text-white">
                        <LoaderCircle size={32} className="animate-spin" />
                        <span className="text-sm font-semibold">Đang tạo ảnh</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-white/65">
                        <Sparkles size={34} />
                        <span className="text-sm font-semibold">Chưa có kết quả</span>
                      </div>
                    )}
                  </div>
                </div>

                {tryOnError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{tryOnError}</span>
                  </div>
                )}

                {tryOnResult && (
                  <div className="rounded-xl border border-black/10 p-4">
                    <p className="text-sm font-black text-[#0B0F19]">{tryOnResult.advisory.headline}</p>
                    <p className="mt-2 text-xs leading-5 text-gray-500">{tryOnResult.advisory.disclaimer}</p>
                    {tryOnResult.warnings.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tryOnResult.warnings.map((warning) => (
                          <span
                            key={warning}
                            className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                          >
                            {getVirtualTryOnWarningLabel(warning)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 flex flex-col gap-3 border-t border-black/10 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={resetTryOn}
                disabled={tryOnLoading || (!tryOnFile && !tryOnResult && !tryOnError)}
                className="client-pill-outline inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-black disabled:opacity-45"
              >
                <RotateCcw size={15} />
                Làm lại
              </button>
              <button
                type="button"
                onClick={() => void handleCreateTryOn()}
                disabled={tryOnLoading || !tryOnFile || !canTryOn}
                className="client-pill-primary inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-black disabled:opacity-45"
              >
                {tryOnLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {tryOnLoading ? 'Đang tạo...' : 'Tạo thử đồ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


