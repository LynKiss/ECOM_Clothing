import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  CreditCard,
  Banknote,
  Truck,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Leaf,
  LoaderCircle,
} from 'lucide-react';
import { clientApi } from '../../lib/client-api';
import { refreshGlobalCart } from '../../hooks/useCart';
import { useClientSession } from '../../hooks/useClientSession';

type Cart = {
  totalItems: number;
  totalAmount: number;
  items: Array<{
    _id: string;
    product: { _id: string; productName: string; images?: Array<{ imageUrl: string; isPrimary: boolean }> };
    quantity: number;
    subtotal: number;
  }>;
};

type LocationState = {
  addressId?: string;
  shippingAddress?: string;
  note?: string;
  discountCode?: string;
  cart?: Cart;
  total?: number;
};

type CreateOrderResponse = {
  _id: string;
  orderCode: string;
  totalAmount: number;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

const PAYMENT_METHODS = [
  {
    id: 'cod',
    label: 'Thanh toán khi nhận hàng (COD)',
    desc: 'Trả tiền mặt khi nhận được hàng. Không phụ thu.',
    icon: Truck,
    emoji: '💵',
  },
  {
    id: 'bank_transfer',
    label: 'Chuyển khoản ngân hàng',
    desc: 'Chuyển khoản vào tài khoản Vietcombank của chúng tôi.',
    icon: Banknote,
    emoji: '🏦',
  },
  {
    id: 'momo',
    label: 'Ví MoMo',
    desc: 'Thanh toán nhanh qua ứng dụng MoMo.',
    icon: CreditCard,
    emoji: '📱',
  },
];

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useClientSession();
  const state = (location.state as LocationState) || {};

  const [method, setMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState<{ orderCode: string; orderId: string } | null>(null);

  if (!session) {
    void navigate('/client/login');
    return null;
  }

  const cart = state.cart;
  const subtotal = cart?.totalAmount ?? 0;
  const shipping = subtotal >= 500000 ? 0 : 30000;
  const total = state.total ?? subtotal + shipping;

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const order = await clientApi.post<CreateOrderResponse>('/orders', {
        shippingAddress: state.shippingAddress ?? '',
        note: state.note,
        paymentMethod: method,
        discountCode: state.discountCode,
      });

      if (method !== 'cod') {
        try {
          await clientApi.post(`/payments/orders/${order._id}/initiate`, {
            provider: method,
          });
        } catch {}
      }

      await refreshGlobalCart();
      setSuccess({ orderCode: order.orderCode, orderId: order._id });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setPlacing(false);
    }
  };

  if (success) {
    return (
      <div style={{ background: '#f2f0eb', minHeight: '80vh' }} className="flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: '#d4e9e2' }}
          >
            <CheckCircle2 size={40} className="text-[#006241]" />
          </div>
          <h1 className="text-2xl font-black text-[#1E3932]">Đặt hàng thành công! 🎉</h1>
          <p className="mt-2 text-sm text-gray-500">
            Cảm ơn bạn đã tin tưởng Cultivated Ledger.
          </p>
          <div className="mt-6 rounded-2xl bg-white p-5 text-left shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Mã đơn hàng</p>
            <p className="mt-1 text-xl font-black text-[#006241]">{success.orderCode}</p>
            <p className="mt-3 text-sm text-gray-500">
              Chúng tôi sẽ xử lý và giao hàng trong 2–4 ngày làm việc. Bạn sẽ nhận được thông báo qua email.
            </p>
            {method === 'bank_transfer' && (
              <div className="mt-3 rounded-xl bg-[#f2f0eb] p-3">
                <p className="text-xs font-bold text-[#1E3932]">Thông tin chuyển khoản:</p>
                <p className="mt-1 text-xs text-gray-600">
                  Ngân hàng: Vietcombank · STK: 1234567890<br />
                  Tên TK: CONG TY TNHH CULTIVATED LEDGER<br />
                  Nội dung: Thanh toán đơn {success.orderCode}
                </p>
              </div>
            )}
          </div>
          <div className="mt-6 flex gap-3">
            <Link
              to="/client/orders"
              className="flex-1 rounded-full border border-[#006241] py-3 text-sm font-bold text-[#006241] transition hover:bg-[#006241] hover:text-white"
            >
              Xem đơn hàng
            </Link>
            <Link
              to="/client"
              className="flex-1 rounded-full py-3 text-sm font-bold text-white transition active:scale-95"
              style={{ background: '#00754A' }}
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f2f0eb', minHeight: '80vh' }}>
      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-6">
        {/* Steps */}
        <div className="mb-8 flex items-center justify-center gap-3 text-sm">
          {[
            { label: 'Giỏ hàng', done: true },
            { label: 'Địa chỉ giao', done: true },
            { label: 'Thanh toán', active: true },
            { label: 'Xác nhận' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              {i > 0 && <ChevronRight size={14} className="text-gray-300" />}
              <span
                className={`text-sm font-semibold ${
                  step.done ? 'text-[#006241]' : step.active ? 'text-[#1E3932] font-black' : 'text-gray-400'
                }`}
              >
                {step.done ? '✓ ' : ''}{step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Payment method */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-[#1E3932]">
              <CreditCard size={20} className="text-[#006241]" /> Phương thức thanh toán
            </h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition ${
                    method === m.id ? 'border-[#006241] bg-[#006241]/5' : 'border-transparent bg-white hover:border-[#006241]/20'
                  }`}
                >
                  <span className="mt-0.5 text-2xl">{m.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-[#1E3932]">{m.label}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{m.desc}</p>
                  </div>
                  <div
                    className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      method === m.id ? 'border-[#006241] bg-[#006241]' : 'border-gray-300'
                    }`}
                  >
                    {method === m.id && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </button>
              ))}
            </div>

            {/* Shipping info */}
            {state.shippingAddress && (
              <div className="mt-4 rounded-2xl bg-white p-4">
                <p className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">
                  Địa chỉ nhận hàng
                </p>
                <p className="text-sm text-[#1E3932]">{state.shippingAddress}</p>
              </div>
            )}

            {/* Security notice */}
            <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#d4e9e2] p-4 text-sm text-[#1E3932]">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#006241]" />
              <p>
                Thông tin thanh toán của bạn được bảo mật tuyệt đối. Chúng tôi không lưu trữ thông tin thẻ.
              </p>
            </div>

            <div className="mt-4 flex gap-3">
              <Link
                to="/client/checkout"
                className="flex items-center gap-2 rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-gray-500 hover:text-[#006241]"
              >
                <ArrowLeft size={15} /> Quay lại
              </Link>
              <button
                onClick={() => void handlePlaceOrder()}
                disabled={placing}
                className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white disabled:opacity-60 active:scale-95"
                style={{ background: '#00754A' }}
              >
                {placing ? <LoaderCircle size={16} className="animate-spin" /> : null}
                {placing ? 'Đang xử lý...' : `Đặt hàng · ${formatPrice(total)}`}
              </button>
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="mb-4 text-sm font-black uppercase tracking-wider text-gray-400">
                Xác nhận đơn hàng
              </p>
              {cart && (
                <div className="max-h-52 space-y-3 overflow-y-auto">
                  {cart.items.map((item) => {
                    const img =
                      item.product.images?.find((i) => i.isPrimary)?.imageUrl ??
                      item.product.images?.[0]?.imageUrl;
                    return (
                      <div key={item._id} className="flex items-start gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#f2f0eb]">
                          {img ? (
                            <img src={img} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Leaf size={18} className="text-[#006241]/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="line-clamp-2 text-xs font-semibold text-[#1E3932]">
                            {item.product.productName}
                          </p>
                          <p className="text-xs text-gray-400">x{item.quantity}</p>
                        </div>
                        <p className="shrink-0 text-xs font-bold text-[#006241]">
                          {formatPrice(item.subtotal)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-4 space-y-2 border-t border-black/5 pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tạm tính</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vận chuyển</span>
                  <span className={`font-semibold ${shipping === 0 ? 'text-[#006241]' : ''}`}>
                    {shipping === 0 ? 'Miễn phí' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-black/5 pt-2 text-base font-black">
                  <span className="text-[#1E3932]">Tổng cộng</span>
                  <span className="text-[#006241]">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
