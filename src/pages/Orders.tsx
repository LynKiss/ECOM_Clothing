import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, MoreHorizontal, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { apiClient } from '../lib/api';
import { useLanguage } from '../i18n/language-context';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled' | 'returned';
type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';

type OrderItem = {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalPayment: string;
  fullName: string;
  createdAt: string;
};

type OrderResponse = {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  items: OrderItem[];
};

export default function Orders() {
  const { language } = useLanguage();
  const isVietnamese = language === 'vi';
  const currency = useMemo(
    () =>
      new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }),
    [language],
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [language],
  );

  const orderTabs: Array<{ label: string; value: 'all' | OrderStatus }> = [
    { label: isVietnamese ? 'Tất cả' : 'All', value: 'all' },
    { label: isVietnamese ? 'Chờ xử lý' : 'Pending', value: 'pending' },
    { label: isVietnamese ? 'Đang xử lý' : 'Processing', value: 'processing' },
    { label: isVietnamese ? 'Đang giao' : 'Shipping', value: 'shipping' },
    { label: isVietnamese ? 'Đã giao' : 'Delivered', value: 'delivered' },
    { label: isVietnamese ? 'Đã hủy' : 'Cancelled', value: 'cancelled' },
  ];

  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | OrderStatus>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams({
          limit: '10',
          ...(status !== 'all' ? { status } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        });

        const data = await apiClient.get<OrderResponse>(`/orders?${query.toString()}`);
        if (!cancelled) {
          setOrders(data.items);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : isVietnamese ? 'Không tải được danh sách đơn hàng' : 'Unable to load orders');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOrders();
    return () => {
      cancelled = true;
    };
  }, [search, status, isVietnamese]);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-primary">
            {isVietnamese ? 'Quản lý đơn hàng' : 'Order Management'}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-on-surface-variant">
            {isVietnamese
              ? 'Dữ liệu đang lấy trực tiếp từ API quản trị `/api/v1/orders`.'
              : 'Data is loaded directly from the admin `/api/v1/orders` endpoint.'}
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white opacity-70 shadow-xl shadow-primary/20 transition-all">
          <Plus size={20} />
          <span>{isVietnamese ? 'Đơn hàng mới' : 'New order'}</span>
        </button>
      </div>

      <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-white bg-white/50 p-3 lg:flex-row">
        <div className="flex flex-wrap rounded-xl border border-on-surface-variant/5 bg-white p-1 shadow-sm">
          {orderTabs.map((tab) => (
            <span key={tab.value}>
              <TabButton label={tab.label} active={status === tab.value} onClick={() => setStatus(tab.value)} />
            </span>
          ))}
        </div>

        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="text"
            placeholder={isVietnamese ? 'Tìm theo mã đơn, khách hàng...' : 'Search by order ID, customer...'}
            className="w-full rounded-xl border border-on-surface-variant/10 bg-white py-3 pl-12 pr-6 text-sm text-on-surface outline-none transition-all focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      <div className="rounded-[2.5rem] border border-on-surface-variant/5 bg-white p-8 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-on-surface-variant/5">
                <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
                  {isVietnamese ? 'Mã đơn' : 'Order ID'}
                </th>
                <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
                  {isVietnamese ? 'Ngày tạo' : 'Created at'}
                </th>
                <th className="px-4 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
                  {isVietnamese ? 'Khách hàng' : 'Customer'}
                </th>
                <th className="px-4 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
                  {isVietnamese ? 'Giá trị' : 'Amount'}
                </th>
                <th className="px-4 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
                  {isVietnamese ? 'Thanh toán' : 'Payment'}
                </th>
                <th className="px-4 py-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">
                  {isVietnamese ? 'Trạng thái' : 'Status'}
                </th>
                <th className="px-4 py-6"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-on-surface-variant">
                    {isVietnamese ? 'Đang tải đơn hàng...' : 'Loading orders...'}
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <ShieldAlert className="text-primary/60" size={26} />
                      <div>
                        <p className="font-black text-primary">
                          {isVietnamese ? 'Không có đơn hàng phù hợp' : 'No matching orders'}
                        </p>
                        <p className="mt-1 text-sm text-on-surface-variant">
                          {isVietnamese
                            ? 'Backend không trả về bản ghi nào với bộ lọc hiện tại.'
                            : 'The backend returned no records for the current filters.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="group transition-colors hover:bg-on-surface-variant/5"
                  >
                    <td className="px-4 py-6 font-black text-primary">{order.id}</td>
                    <td className="px-4 py-6 font-medium text-on-surface-variant">
                      {dateFormatter.format(new Date(order.createdAt))}
                    </td>
                    <td className="px-4 py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/5 bg-primary/10 text-xs font-black text-primary">
                          {getInitials(order.fullName)}
                        </div>
                        <span className="font-bold text-on-surface">{order.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-6 text-right font-black text-on-surface">
                      {currency.format(Number(order.totalPayment))}
                    </td>
                    <td className="px-4 py-6 text-center">
                      <PaymentBadge type={order.paymentStatus} isVietnamese={isVietnamese} />
                    </td>
                    <td className="px-4 py-6 text-center">
                      <StatusBadge type={order.status} isVietnamese={isVietnamese} />
                    </td>
                    <td className="px-4 py-6 text-right">
                      <button className="rounded-lg p-2 text-on-surface-variant/40 transition-colors hover:bg-primary/5 hover:text-primary">
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-2.5 text-sm font-black transition-all duration-200 ${
        active ? 'scale-105 rounded-lg bg-primary text-white shadow-lg shadow-primary/20' : 'rounded-lg text-on-surface-variant/60 hover:text-primary'
      }`}
    >
      {label}
    </button>
  );
}

function PaymentBadge({ type, isVietnamese }: { type: PaymentStatus; isVietnamese: boolean }) {
  const styles: Record<PaymentStatus, string> = {
    paid: 'bg-green-100 text-green-700',
    unpaid: 'bg-red-100 text-red-700',
    failed: 'bg-yellow-100 text-yellow-700',
    refunded: 'bg-blue-100 text-blue-700',
  };
  const labels: Record<PaymentStatus, string> = isVietnamese
    ? {
        paid: 'Đã thanh toán',
        unpaid: 'Chưa thanh toán',
        failed: 'Thất bại',
        refunded: 'Đã hoàn tiền',
      }
    : {
        paid: 'Paid',
        unpaid: 'Unpaid',
        failed: 'Failed',
        refunded: 'Refunded',
      };

  return <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${styles[type]}`}>{labels[type]}</span>;
}

function StatusBadge({ type, isVietnamese }: { type: OrderStatus; isVietnamese: boolean }) {
  const styles: Record<OrderStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-sky-100 text-sky-700',
    processing: 'bg-on-surface-variant/10 text-on-surface',
    shipping: 'bg-primary/10 text-primary',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    returned: 'bg-slate-100 text-slate-700',
  };
  const labels: Record<OrderStatus, string> = isVietnamese
    ? {
        pending: 'Chờ xử lý',
        confirmed: 'Đã xác nhận',
        processing: 'Đang xử lý',
        shipping: 'Đang giao',
        delivered: 'Đã giao',
        cancelled: 'Đã hủy',
        returned: 'Đã hoàn',
      }
    : {
        pending: 'Pending',
        confirmed: 'Confirmed',
        processing: 'Processing',
        shipping: 'Shipping',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
        returned: 'Returned',
      };

  return <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${styles[type]}`}>{labels[type]}</span>;
}
