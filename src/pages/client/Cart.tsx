import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingCart, Leaf, ArrowRight, Tag } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useClientSession } from '../../hooks/useClientSession';
import { clientApi } from '../../lib/client-api';

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

type DiscountResult = {
  isValid: boolean;
  discountPercent?: number;
  discountAmount?: number;
  discountCode?: string;
};

export default function Cart() {
  const navigate = useNavigate();
  const { session } = useClientSession();
  const { cart, loading, updateItem, removeItem } = useCart();

  const [discountCode, setDiscountCode] = useState('');
  const [discountResult, setDiscountResult] = useState<DiscountResult | null>(null);
  const [validatingCode, setValidatingCode] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (!session) {
    return (
      <div style={{ background: '#f2f0eb', minHeight: '60vh' }} className="flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart size={48} className="mx-auto mb-4 text-[#006241]/30" />
          <h2 className="text-xl font-black text-[#1E3932]">Bạn chưa đăng nhập</h2>
          <p className="mt-2 text-sm text-gray-500">Vui lòng đăng nhập để xem giỏ hàng.</p>
          <Link
            to="/client/login"
            className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white"
            style={{ background: '#00754A' }}
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  const handleValidateCode = async () => {
    if (!discountCode.trim()) return;
    setValidatingCode(true);
    try {
      const res = await clientApi.post<DiscountResult>('/discounts/validate', {
        code: discountCode.trim(),
      });
      setDiscountResult(res);
    } catch {
      setDiscountResult({ isValid: false });
    } finally {
      setValidatingCode(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    setRemovingId(itemId);
    try { await removeItem(itemId); } finally { setRemovingId(null); }
  };

  const subtotal = cart?.totalAmount ?? 0;
  const discountAmount =
    discountResult?.isValid && discountResult.discountPercent
      ? Math.round(subtotal * (discountResult.discountPercent / 100))
      : (discountResult?.discountAmount ?? 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleCheckout = () => {
    if (!cart || cart.totalItems === 0) return;
    void navigate('/client/checkout', {
      state: { discountCode: discountResult?.isValid ? discountCode : undefined },
    });
  };

  return (
    <div style={{ background: '#f2f0eb', minHeight: '80vh' }}>
      <div className="mx-auto max-w-6xl px-4 py-10 lg:px-6">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: '#006241' }}>
            Mua sắm
          </p>
          <h1 className="mt-1 text-3xl font-black text-[#1E3932]">Giỏ hàng</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#006241] border-t-transparent" />
          </div>
        ) : !cart || cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 text-center">
            <ShoppingCart size={56} className="mb-4 text-[#006241]/20" />
            <h2 className="text-xl font-black text-[#1E3932]">Giỏ hàng trống</h2>
            <p className="mt-2 text-sm text-gray-500">Hãy khám phá và thêm sản phẩm vào giỏ hàng.</p>
            <Link
              to="/client/products"
              className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white"
              style={{ background: '#00754A' }}
            >
              <Leaf size={16} /> Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Cart items */}
            <div className="space-y-3">
              {cart.items.map((item) => {
                const img =
                  item.product.images?.find((i) => i.isPrimary)?.imageUrl ??
                  item.product.images?.[0]?.imageUrl;
                return (
                  <div
                    key={item._id}
                    className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm"
                  >
                    {/* Image */}
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f2f0eb]">
                      {img ? (
                        <img src={img} alt={item.product.productName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Leaf size={24} className="text-[#006241]/20" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/client/products/${item.product._id}`}
                        className="line-clamp-2 text-sm font-bold text-[#1E3932] hover:text-[#006241]"
                      >
                        {item.product.productName}
                      </Link>
                      <p className="mt-1 text-xs text-gray-400">
                        Đơn giá: {formatPrice(item.unitPrice)}
                      </p>

                      {/* Quantity + remove */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => void updateItem(item._id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 transition hover:border-[#006241] disabled:opacity-40"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-[#1E3932]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => void updateItem(item._id, item.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 transition hover:border-[#006241]"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-black text-[#006241]">{formatPrice(item.subtotal)}</span>
                          <button
                            onClick={() => void handleRemove(item._id)}
                            disabled={removingId === item._id}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-300 transition hover:bg-red-50 hover:text-red-400 disabled:opacity-40"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Continue shopping */}
              <Link
                to="/client/products"
                className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-[#006241]/20 bg-white px-5 py-4 text-sm font-semibold text-[#006241] transition hover:border-[#006241]/40"
              >
                <Leaf size={16} /> Tiếp tục mua sắm
              </Link>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              {/* Discount code */}
              <div className="rounded-2xl bg-white p-5">
                <p className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1E3932]">
                  <Tag size={15} /> Mã giảm giá
                </p>
                <div className="flex gap-2">
                  <input
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="Nhập mã..."
                    className="flex-1 rounded-full border border-black/10 bg-[#f2f0eb] px-4 py-2.5 text-sm outline-none focus:border-[#006241]"
                  />
                  <button
                    onClick={() => void handleValidateCode()}
                    disabled={validatingCode}
                    className="rounded-full px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                    style={{ background: '#006241' }}
                  >
                    {validatingCode ? '...' : 'Áp dụng'}
                  </button>
                </div>
                {discountResult && (
                  <p
                    className={`mt-2 text-xs font-semibold ${
                      discountResult.isValid ? 'text-[#006241]' : 'text-[#c82014]'
                    }`}
                  >
                    {discountResult.isValid
                      ? `✓ Giảm ${discountResult.discountPercent ?? 0}% — bạn tiết kiệm ${formatPrice(discountAmount)}`
                      : '✗ Mã không hợp lệ hoặc đã hết hạn'}
                  </p>
                )}
              </div>

              {/* Order summary */}
              <div className="rounded-2xl bg-white p-5">
                <p className="mb-4 text-sm font-black uppercase tracking-wider text-gray-400">
                  Tóm tắt đơn hàng
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Tạm tính ({cart.totalItems} sản phẩm)
                    </span>
                    <span className="font-semibold text-[#1E3932]">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phí vận chuyển</span>
                    <span className="font-semibold text-[#006241]">
                      {subtotal >= 500000 ? 'Miễn phí' : formatPrice(30000)}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Giảm giá</span>
                      <span className="font-semibold text-[#c82014]">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-black/5 pt-3 text-base">
                    <span className="font-black text-[#1E3932]">Tổng cộng</span>
                    <span className="font-black text-[#006241]">
                      {formatPrice(total + (subtotal < 500000 ? 30000 : 0))}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-95"
                  style={{ background: '#00754A' }}
                >
                  Tiến hành đặt hàng <ArrowRight size={16} />
                </button>
                <p className="mt-3 text-center text-[11px] text-gray-400">
                  🔒 Thanh toán bảo mật · Đổi trả 7 ngày
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
