import { useEffect, useMemo, useState } from 'react';
import { Search, Download, Plus, ChevronRight, TrendingUp, Users2 } from 'lucide-react';
import { apiClient } from '../lib/api';
import { useLanguage } from '../i18n/language-context';

type UserRole = 'admin' | 'staff' | 'customer';

type Customer = {
  _id: string;
  username: string;
  email: string;
  role: {
    _id: UserRole;
    name: UserRole;
  };
  isActive: boolean;
  createdAt: string;
};

type CustomersResponse = {
  meta: {
    total: number;
  };
  items: Customer[];
};

export default function Customers() {
  const { language } = useLanguage();
  const isVietnamese = language === 'vi';
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams({
          limit: '12',
          ...(search.trim() ? { search: search.trim() } : {}),
        });
        const data = await apiClient.get<CustomersResponse>(`/users?${query.toString()}`);

        if (!cancelled) {
          setCustomers(data.items);
          setTotal(data.meta.total);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : isVietnamese ? 'Không tải được danh sách người dùng' : 'Unable to load users');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCustomers();
    return () => {
      cancelled = true;
    };
  }, [search, isVietnamese]);

  const stats = useMemo(() => {
    const activeUsers = customers.filter((customer) => customer.isActive).length;
    const admins = customers.filter((customer) => customer.role._id === 'admin').length;
    const staff = customers.filter((customer) => customer.role._id === 'staff').length;

    return { activeUsers, admins, staff };
  }, [customers]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-headline text-[2.75rem] font-black leading-tight tracking-tight text-primary">
            {isVietnamese ? 'Khách hàng và tài khoản' : 'Customers and Accounts'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
            {isVietnamese
              ? 'Trang này đang dùng dữ liệu từ API quản trị `GET /api/v1/users` của backend `da_be`.'
              : 'This page maps data from the admin `GET /api/v1/users` endpoint in the `da_be` backend.'}
          </p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 rounded-xl border border-primary/10 bg-white px-6 py-3 text-sm font-bold text-primary opacity-70 transition-all">
            <Download size={18} />
            <span>{isVietnamese ? 'Xuất dữ liệu' : 'Export'}</span>
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-container px-6 py-3 text-sm font-bold text-white opacity-70 shadow-xl shadow-primary/20 transition-all">
            <Plus size={18} />
            <span>{isVietnamese ? 'Thêm tài khoản' : 'Add customer'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <KpiCard title={isVietnamese ? 'Tổng tài khoản' : 'Total accounts'} value={String(total)} growth={isVietnamese ? '+trực tiếp' : '+live'} />
        <KpiCard title={isVietnamese ? 'Người dùng hoạt động' : 'Active users'} value={String(stats.activeUsers)} growth={isVietnamese ? '+đồng bộ' : '+synced'} />
        <KpiCard title={isVietnamese ? 'Admin / Nhân sự' : 'Admin / Staff'} value={`${stats.admins} / ${stats.staff}`} highlight={isVietnamese ? 'Phân tách vai trò' : 'Role split'} />
      </div>

      <div className="flex flex-col overflow-hidden rounded-[2.5rem] border border-on-surface-variant/5 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-on-surface-variant/5 bg-white/50 p-6 backdrop-blur-sm sm:flex-row">
          <div className="flex rounded-xl bg-on-surface-variant/5 p-1">
            <button className="rounded-lg bg-white px-6 py-2 text-[10px] font-black uppercase tracking-widest text-primary shadow-sm transition-all">
              {isVietnamese ? 'Tất cả tài khoản' : 'All accounts'}
            </button>
          </div>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30" size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                type="text"
                placeholder={isVietnamese ? 'Tìm kiếm người dùng...' : 'Search users...'}
                className="w-full rounded-full border-none bg-on-surface-variant/5 py-2.5 pl-12 pr-6 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>
        </div>

        {error ? <div className="m-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div> : null}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-on-surface-variant/[0.02]">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">{isVietnamese ? 'Tài khoản' : 'Account'}</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Email</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">{isVietnamese ? 'Vai trò' : 'Role'}</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">{isVietnamese ? 'Trạng thái' : 'Status'}</th>
                <th className="px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-on-surface-variant/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-on-surface-variant">
                    {isVietnamese ? 'Đang tải danh sách tài khoản...' : 'Loading accounts...'}
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <Users2 className="text-primary/60" size={28} />
                      <div>
                        <p className="font-black text-primary">{isVietnamese ? 'Không có tài khoản phù hợp' : 'No matching accounts'}</p>
                        <p className="mt-1 text-sm text-on-surface-variant">
                          {isVietnamese
                            ? 'Backend không trả về người dùng nào với bộ lọc hiện tại.'
                            : 'The backend returned no users for the current filters.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer._id} className="group transition-colors hover:bg-on-surface-variant/[0.02]">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/5 bg-primary/10 text-sm font-black text-primary">
                          {getInitials(customer.username)}
                        </div>
                        <div>
                          <p className="text-base font-bold text-on-surface">{customer.username}</p>
                          <p className="text-xs font-medium text-on-surface-variant/60">{customer._id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-medium text-on-surface-variant">{customer.email}</td>
                    <td className="px-8 py-6">
                      <span className="rounded-lg border border-primary/5 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                        {translateRole(customer.role.name, isVietnamese)}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${customer.isActive ? 'bg-green-500' : 'bg-on-surface-variant/20'}`} />
                        <span className="text-sm font-bold text-on-surface-variant">
                          {customer.isActive
                            ? isVietnamese
                              ? 'Hoạt động'
                              : 'Active'
                            : isVietnamese
                              ? 'Ngưng hoạt động'
                              : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="rounded-xl p-2 text-on-surface-variant/20 transition-all hover:text-primary">
                        <ChevronRight size={24} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function translateRole(role: UserRole, isVietnamese: boolean) {
  if (!isVietnamese) {
    return role;
  }

  if (role === 'admin') return 'Quản trị';
  if (role === 'staff') return 'Nhân sự';
  return 'Khách hàng';
}

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function KpiCard({ title, value, growth, highlight }: { title: string; value: string; growth?: string; highlight?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[2rem] border border-on-surface-variant/5 bg-white p-8 shadow-sm">
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-primary/5 transition-transform duration-500 group-hover:scale-125" />
      <div className="mb-6 flex items-start justify-between text-[10px] font-black uppercase tracking-[0.2em]">
        <p className="text-on-surface-variant/60">{title}</p>
        {growth ? (
          <span className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1 text-primary">
            <TrendingUp size={12} /> {growth}
          </span>
        ) : (
          <span className="rounded-lg bg-on-surface-variant/5 px-3 py-1 text-on-surface-variant/40">{highlight}</span>
        )}
      </div>
      <h3 className="text-5xl font-black tracking-tighter text-primary">{value}</h3>
    </div>
  );
}
