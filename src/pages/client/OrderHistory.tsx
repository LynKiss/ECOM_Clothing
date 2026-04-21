import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronRight, X, Leaf } from 'lucide-react';
import { clientApi } from '../../lib/client-api';
import { useClientSession } from '../../hooks/useClientSession';

type OrderItem = {
  _id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type Order = {
  _id: string;
  orderCode: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  shippingAddress: string;
  items?: OrderItem[];
  createdAt: string;
  note?: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ xử lý', color: '#b45309', bg: '#fef3c7' },
  confirmed: { label: 'Đã xác nhận', color: '#1d4ed8', bg: '#dbeafe' },
  processing: { label: 'Đang xử lý', color: '#6d28d9', bg: '#ede9fe' },
  shipping: { label: 'Đang giao', color: '#0369a1', bg: '#e0f2fe' },
  delivered: { label: 'Đã giao', color: '#15803d', bg: '#dcfce7' },
  cancelled: { label: 'Đã hủy', color: '#dc2626', bg: '#fee2e2' },
};

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'COD',
  bank_transfer: 'Chuyển khoản',
  momo: 'MoMo',
};

function formatPrice(price: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function OrderHistory() {
  const navigate = useNavigate();
  const { session } = useClientSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!session) { void navigate('/client/login'); return; }
    void clientApi
      .get<Order[] | { items: Order[] }>('/users/me/orders')
      .then((data) => setOrders(Array.isArray(data) ? data : (data.items ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, navigate]);

  if (loading) {
    return (
      <div style={{ background: '#f2f0eb', minHeight: '60vh' }} className="flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#006241] border-t-transparent" />
      </div>
    );
  }

  return (
    <div style={{ background: '#f2f0eb', minHeight: '80vh' }}>
      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: '#006241' }}>
              Cá nhân
            </p>
            <h1 className="mt-1 text-2xl font-black text-[#1E3932]">Đơn hàng của tôi</h1>
          </div>
          <Link
            to="/client/account"
            className="text-sm font-semibold text-[#006241] hover:underline"
          >
            ← Tài khoản
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 text-center">
            <Package size={48} className="mb-4 text-[#006241]/20" />
            <h2 className="font-black text-[#1E3932]">Chưa có đơn hàng</h2>
            <p className="mt-1 text-sm text-gray-500">Hãy khám phá và đặt hàng ngay!</p>
            <Link
              to="/client/products"
              className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white"
              style={{ background: '#00754A' }}
            >
              <Leaf size={16} /> Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = STATUS_LABELS[order.status] ?? { label: order.status, color: '#374151', bg: '#f3f4f6' };
              return (
                <div
                  key={order._id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-black/5 p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-full"
                        style={{ background: statusInfo.bg }}
                      >
                        <Package size={18} style={{ color: statusInfo.color }} />
                      </div>
                      <div>
                        <p className="font-black text-[#1E3932]">{order.orderCode}</p>
                        <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-[11px] font-black"
                      style={{ background: statusInfo.bg, color: statusInfo.color }}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="text-sm text-gray-500">
                      <p>
                        Thanh toán:{' '}
                        <span className="font-semibold text-[#1E3932]">
                          {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                        </span>
                      </p>
                      <p className="mt-0.5 line-clamp-1 max-w-xs text-xs">{order.shippingAddress}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#006241]">{formatPrice(order.totalAmount)}</p>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#006241] hover:underline"
                      >
                        Chi tiết <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-black/5 bg-white p-5">
              <div>
                <p className="font-black text-[#1E3932]">Đơn #{selectedOrder.orderCode}</p>
                <p className="text-xs text-gray-400">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between rounded-xl bg-[#f2f0eb] px-4 py-3">
                <span className="text-sm text-gray-500">Trạng thái</span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-black"
                  style={{
                    background: STATUS_LABELS[selectedOrder.status]?.bg ?? '#f3f4f6',
                    color: STATUS_LABELS[selectedOrder.status]?.color ?? '#374151',
                  }}
                >
                  {STATUS_LABELS[selectedOrder.status]?.label ?? selectedOrder.status}
                </span>
              </div>

              {/* Address */}
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Địa chỉ giao hàng
                </p>
                <p className="text-sm text-[#1E3932]">{selectedOrder.shippingAddress}</p>
              </div>

              {/* Note */}
              {selectedOrder.note && (
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-400">Ghi chú</p>
                  <p className="text-sm text-gray-600">{selectedOrder.note}</p>
                </div>
              )}

              {/* Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                    Sản phẩm
                  </p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item._id} className="flex justify-between text-sm">
                        <span className="text-[#1E3932]">
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="font-semibold text-[#006241]">
                          {formatPrice(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between border-t border-black/5 pt-3 text-base font-black">
                <span className="text-[#1E3932]">Tổng cộng</span>
                <span className="text-[#006241]">{formatPrice(selectedOrder.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
