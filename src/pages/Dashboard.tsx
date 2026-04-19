import { Fragment, useEffect, useMemo, useState } from 'react';
import { TrendingUp, Package, Truck, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { apiClient } from '../lib/api';
import { useLanguage } from '../i18n/language-context';

type ProductItem = {
  productId: string;
  productName: string;
  quantityAvailable: number;
};

type ProductsResponse = {
  items: ProductItem[];
  meta: {
    total: number;
  };
};

type DashboardResponse = {
  totals: {
    users: number;
    products: number;
    orders: number;
    pendingOrders: number;
    paidOrders: number;
    revenue: string;
    lowStockProducts: number;
  };
  topProducts: Array<{
    productId: string;
    productName: string;
    soldQuantity: string;
    revenue: string;
  }>;
  salesByDay: Array<{
    date: string;
    orders: string;
    revenue: string;
  }>;
};

type OrdersResponse = {
  items: Array<{
    id: string;
    fullName: string;
    totalPayment: string;
    status: string;
  }>;
};

export default function Dashboard() {
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

  const [publicProducts, setPublicProducts] = useState<ProductItem[]>([]);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrdersResponse['items']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const productData = await apiClient.get<ProductsResponse>('/products?limit=8');
        if (!cancelled) {
          setPublicProducts(productData.items);
        }

        const [dashboardData, ordersData] = await Promise.all([
          apiClient.get<DashboardResponse>('/reports/dashboard'),
          apiClient.get<OrdersResponse>('/orders?limit=5'),
        ]);

        if (!cancelled) {
          setDashboard(dashboardData);
          setRecentOrders(ordersData.items);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : isVietnamese ? 'Không tải được tổng quan' : 'Unable to load dashboard');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [isVietnamese]);

  const chartData = useMemo(
    () =>
      dashboard?.salesByDay?.slice(-7).map((item, index) => ({
        name: item.date
          ? new Date(item.date).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
              day: '2-digit',
              month: '2-digit',
            })
          : `#${index + 1}`,
        revenue: Number(item.revenue),
      })) ?? [],
    [dashboard, language],
  );

  const featuredProducts = dashboard?.topProducts?.length
    ? dashboard.topProducts.slice(0, 4).map((item) => ({
        name: item.productName,
        stock: isVietnamese ? `${item.soldQuantity} đã bán` : `${item.soldQuantity} sold`,
        icon: '🌿',
      }))
    : publicProducts.slice(0, 4).map((item) => ({
        name: item.productName,
        stock: isVietnamese ? `${item.quantityAvailable} tồn kho` : `${item.quantityAvailable} in stock`,
        icon: '📦',
      }));

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-primary">
            {isVietnamese ? 'Tổng quan điều hành' : 'Executive Overview'}
          </h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {isVietnamese
              ? 'Trang tổng quan đang kết hợp sản phẩm public với báo cáo protected từ backend Nest.'
              : 'This dashboard combines public product data with protected reports from the Nest backend.'}
          </p>
        </div>
        <button className="rounded-xl border border-primary-container/20 bg-primary-container/10 px-6 py-2.5 text-sm font-bold text-primary-container opacity-70">
          {isVietnamese ? 'Tải báo cáo' : 'Export report'}
        </button>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          title={isVietnamese ? 'Tổng doanh thu' : 'Revenue'}
          value={dashboard ? currency.format(Number(dashboard.totals.revenue)) : '-'}
          change={dashboard ? (isVietnamese ? `${dashboard.totals.paidOrders} đã thanh toán` : `${dashboard.totals.paidOrders} paid`) : '-'}
          icon={TrendingUp}
          subtitle={isVietnamese ? 'từ reports/dashboard' : 'from reports/dashboard'}
        />
        <StatCard
          title={isVietnamese ? 'Sản phẩm' : 'Products'}
          value={String(dashboard?.totals.products ?? publicProducts.length)}
          change={
            dashboard
              ? isVietnamese
                ? `${dashboard.totals.lowStockProducts} sắp hết hàng`
                : `${dashboard.totals.lowStockProducts} low stock`
              : isVietnamese
                ? `${publicProducts.length} sản phẩm public`
                : `${publicProducts.length} public products`
          }
          icon={Package}
          subtitle={isVietnamese ? 'đồng bộ từ backend' : 'synced from backend'}
        />
        <StatCard
          title={isVietnamese ? 'Đơn hàng / Người dùng' : 'Orders / Users'}
          value={dashboard ? `${dashboard.totals.orders} / ${dashboard.totals.users}` : '-'}
          change={dashboard ? (isVietnamese ? `${dashboard.totals.pendingOrders} chờ xử lý` : `${dashboard.totals.pendingOrders} pending`) : '-'}
          icon={dashboard ? Truck : Users}
          subtitle={isVietnamese ? 'chỉ số thời gian thực' : 'real-time metrics'}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-3xl border border-on-surface-variant/5 bg-white p-8 shadow-sm lg:col-span-2">
          <div className="mb-8 flex items-center justify-between">
            <h3 className="text-xl font-bold font-headline">{isVietnamese ? 'Xu hướng doanh thu' : 'Revenue trend'}</h3>
            <span className="rounded-lg bg-on-surface-variant/5 px-4 py-2 text-sm">
              {isVietnamese ? 'Dữ liệu backend trực tiếp' : 'Direct backend data'}
            </span>
          </div>
          <div className="h-80 w-full">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                {isVietnamese ? 'Đang tải dữ liệu...' : 'Loading data...'}
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                {isVietnamese ? 'Chưa có dữ liệu doanh thu.' : 'No revenue data available yet.'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}M`}
                  />
                  <Tooltip
                    cursor={{ fill: '#F3F4F6' }}
                    formatter={(value) => currency.format(Number(value))}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      fontSize: '14px',
                    }}
                  />
                  <Bar dataKey="revenue" fill="#154212" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-primary/10 bg-primary/5 p-8">
          <h3 className="mb-6 text-xl font-bold">{isVietnamese ? 'Sản phẩm nổi bật' : 'Featured products'}</h3>
          <div className="space-y-4">
            {featuredProducts.map((product) => (
              <div key={product.name}>
                <FeaturedProductCard name={product.name} stock={product.stock} icon={product.icon} />
              </div>
            ))}
          </div>
          <button className="mt-8 w-full rounded-xl border border-primary/10 bg-white py-3 text-sm font-bold text-primary transition-colors">
            {isVietnamese ? 'Xem tồn kho' : 'View inventory'}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-on-surface-variant/5 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-xl font-bold">{isVietnamese ? 'Đơn hàng gần đây' : 'Recent orders'}</h3>
          <button className="text-sm font-bold text-primary hover:underline">{isVietnamese ? 'Xem tất cả' : 'View all'}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-on-surface-variant/5 text-xs font-black uppercase tracking-widest text-on-surface-variant/50">
                <th className="pb-4">{isVietnamese ? 'Mã đơn' : 'Order ID'}</th>
                <th className="pb-4">{isVietnamese ? 'Khách hàng' : 'Customer'}</th>
                <th className="pb-4">{isVietnamese ? 'Giá trị' : 'Amount'}</th>
                <th className="pb-4">{isVietnamese ? 'Trạng thái' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-on-surface-variant/5">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <Fragment key={order.id}>
                    <RecentOrderRow
                      id={order.id}
                      customer={order.fullName}
                      amount={currency.format(Number(order.totalPayment))}
                      status={translateOrderStatus(order.status, isVietnamese)}
                      statusType={mapStatusType(order.status)}
                    />
                  </Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-on-surface-variant">
                    {isVietnamese ? 'Chưa có đơn hàng gần đây.' : 'No recent orders.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function translateOrderStatus(status: string, isVietnamese: boolean) {
  const labels: Record<string, string> = isVietnamese
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

  return labels[status] ?? status;
}

function mapStatusType(status: string) {
  if (status === 'delivered') return 'success';
  if (status === 'processing' || status === 'shipping' || status === 'confirmed') return 'warning';
  return 'error';
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string;
  change: string;
  icon: typeof TrendingUp;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-[2rem] border border-on-surface-variant/5 bg-white p-8 shadow-sm"
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 transition-transform duration-700 group-hover:scale-150" />
      <div className="relative z-10">
        <p className="mb-2 text-xs font-black uppercase tracking-widest text-on-surface-variant/60">{title}</p>
        <h3 className="mb-4 text-4xl font-black tracking-tighter text-primary">{value}</h3>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-[10px] font-black text-green-700">
            <Icon size={12} /> {change}
          </span>
          <span className="text-[10px] font-bold uppercase text-on-surface-variant/50">{subtitle}</span>
        </div>
      </div>
    </motion.div>
  );
}

function FeaturedProductCard({ name, stock, icon }: { name: string; stock: string; icon: string }) {
  return (
    <div className="flex cursor-pointer items-center gap-4 rounded-2xl border border-transparent bg-white/50 p-4 transition-colors hover:border-primary/10 hover:bg-white">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl">{icon}</div>
      <div>
        <p className="text-sm font-bold text-on-surface">{name}</p>
        <p className="text-xs text-on-surface-variant/60">{stock}</p>
      </div>
    </div>
  );
}

function RecentOrderRow({
  id,
  customer,
  amount,
  status,
  statusType,
}: {
  id: string;
  customer: string;
  amount: string;
  status: string;
  statusType: 'success' | 'warning' | 'error';
}) {
  const statusStyles: Record<'success' | 'warning' | 'error', string> = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <tr className="group transition-colors hover:bg-on-surface-variant/5">
      <td className="py-4 font-bold text-primary">{id}</td>
      <td className="py-4 text-sm font-medium">{customer}</td>
      <td className="py-4 text-sm font-black">{amount}</td>
      <td className="py-4">
        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusStyles[statusType]}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}
