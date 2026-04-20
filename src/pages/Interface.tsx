import {
  Palette,
  Layout,
  Settings,
  Code,
  Plus,
  MoreVertical,
  GripVertical,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../i18n/language-context';

export default function Interface() {
  const { language } = useLanguage();
  const isVietnamese = language === 'vi';

  const blocks = [
    {
      title: isVietnamese ? 'Biểu đồ sản lượng thu hoạch' : 'Harvest Yield Chart',
      position: isVietnamese ? 'Trang chủ (đầu trang)' : 'Home (Top)',
      role: isVietnamese ? 'Tất cả người dùng' : 'All Users',
      icon: Layout,
      status: 'active',
    },
    {
      title: isVietnamese ? 'Widget thời tiết khu vực' : 'Regional Weather Widget',
      position: isVietnamese ? 'Thanh bên phải' : 'Right sidebar',
      role: isVietnamese ? 'Quản lý' : 'Managers',
      icon: Layout,
      status: 'active',
    },
    {
      title: isVietnamese ? 'Cảnh báo tồn kho thấp' : 'Low Inventory Alert',
      position: isVietnamese ? 'Trang kho hàng' : 'Inventory page',
      role: isVietnamese ? 'Tất cả người dùng' : 'All Users',
      icon: Layout,
      status: 'hidden',
    },
  ];

  return (
    <div className="space-y-12 pb-20">
      <div className="max-w-4xl">
        <h1 className="font-headline mb-4 text-[3rem] font-black leading-none tracking-tight text-primary">
          {isVietnamese ? 'Điều khiển giao diện' : 'Interface Control'}
        </h1>
        <p className="max-w-2xl text-lg font-medium leading-relaxed text-on-surface-variant">
          {isVietnamese
            ? 'Tinh chỉnh trải nghiệm hiển thị và cấu trúc thông tin của trang quản trị. Quản lý theme, ghi đè giao diện và các khối bố cục.'
            : 'Fine-tune the visual experience and information structure of the admin UI. Manage themes, UI overrides, and layout blocks.'}
        </p>
      </div>

      <section>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="flex items-center gap-3 text-2xl font-black text-primary">
            <Palette className="text-accent" size={28} />
            {isVietnamese ? 'Cấu hình giao diện' : 'Theme Configuration'}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="group relative flex flex-col gap-10 overflow-hidden rounded-[2.5rem] border border-on-surface-variant/5 bg-white p-8 md:flex-row lg:col-span-2">
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-on-surface-variant/5 md:w-5/12">
              <img
                src="https://picsum.photos/seed/interface/600/400"
                alt="Theme Preview"
                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute left-4 top-4 rounded-full border border-white/50 bg-accent px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary shadow-lg">
                {isVietnamese ? 'Theme đang dùng' : 'Active Theme'}
              </div>
            </div>

            <div className="z-10 flex flex-1 flex-col justify-between py-2">
              <div>
                <h3 className="mb-3 text-3xl font-black tracking-tighter text-on-surface">
                  Botanical Enterprise v2.4
                </h3>
                <p className="mb-8 text-sm leading-relaxed text-on-surface-variant/80">
                  {isVietnamese
                    ? 'Bộ nhận diện mặc định tập trung vào độ tin cậy dữ liệu, dùng bảng màu xanh hữu cơ và khoảng trắng rộng. Tối ưu cho giao diện có mật độ thông tin cao.'
                    : 'The default system identity focuses on data integrity with organic green palettes and expansive white space. It is optimized for high information density.'}
                </p>
                <div className="mb-8 flex gap-8 border-b border-on-surface-variant/5 pb-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
                      {isVietnamese ? 'Phiên bản' : 'Version'}
                    </span>
                    <span className="text-sm font-bold text-on-surface">2.4.1 (Stable)</span>
                  </div>
                  <div className="flex flex-col gap-1 border-l border-on-surface-variant/5 pl-8">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">
                      {isVietnamese ? 'Cập nhật gần nhất' : 'Last Updated'}
                    </span>
                    <span className="text-sm font-bold text-on-surface">
                      {isVietnamese ? 'Hôm qua' : 'Yesterday'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:scale-105">
                  {isVietnamese ? 'Tùy chỉnh' : 'Customize'}
                </button>
                <button className="rounded-xl bg-on-surface-variant/5 px-6 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-on-surface-variant/10">
                  {isVietnamese ? 'Xem chi tiết' : 'View details'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <MenuCard
              title={isVietnamese ? 'Thư viện theme' : 'Theme Library'}
              subtitle={isVietnamese ? 'Duyệt 12 bộ nhận diện dựng sẵn' : 'Browse 12 prebuilt identities'}
              icon={Settings}
            />
            <MenuCard
              title={isVietnamese ? 'Cài đặt toàn cục' : 'Global Settings'}
              subtitle={isVietnamese ? 'Logo, kiểu chữ, thương hiệu' : 'Logos, typography, branding'}
              icon={Settings}
            />
            <MenuCard
              title={isVietnamese ? 'Mã tùy chỉnh' : 'Custom Code'}
              subtitle={isVietnamese ? 'Ghi đè cho lập trình viên (CSS/JS)' : 'Developer override (CSS/JS)'}
              icon={Code}
            />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-black text-primary">
              <Layout className="text-accent" size={28} />
              {isVietnamese ? 'Khối giao diện' : 'Block Components'}
            </h2>
            <p className="mt-1 text-sm font-medium text-on-surface-variant">
              {isVietnamese
                ? 'Quản lý các khối nội dung theo module trên dashboard và báo cáo.'
                : 'Manage modular content tiles across dashboards and reports.'}
            </p>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-on-surface px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90">
            <Plus size={18} />
            <span>{isVietnamese ? 'Thêm khối' : 'Add block'}</span>
          </button>
        </div>

        <div className="space-y-3 rounded-[2.5rem] border border-on-surface-variant/5 bg-white p-6">
          {blocks.map((block, index) => (
            <motion.div
              key={block.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`group flex items-center justify-between rounded-2xl border border-transparent p-5 transition-all hover:border-primary/5 hover:bg-primary/[0.02] ${
                block.status === 'hidden' ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-6">
                <GripVertical
                  className="cursor-grab text-on-surface-variant/20 group-hover:text-primary/40"
                  size={20}
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/5 bg-primary/5 text-primary">
                  <block.icon size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-on-surface">{block.title}</h4>
                  <p className="mt-1 text-xs font-bold uppercase leading-none tracking-widest text-on-surface-variant/40">
                    {isVietnamese ? 'Vị trí' : 'Position'}: {block.position} • {isVietnamese ? 'Truy cập' : 'Access'}: {block.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {block.status === 'active' ? (
                  <span className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-green-700">
                    <CheckCircle2 size={12} /> {isVietnamese ? 'Đang bật' : 'Active'}
                  </span>
                ) : (
                  <span className="rounded-full bg-on-surface-variant/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">
                    {isVietnamese ? 'Đang ẩn' : 'Hidden'}
                  </span>
                )}
                <button className="rounded-xl p-2 text-on-surface-variant/20 transition-colors hover:text-primary">
                  <MoreVertical size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MenuCard({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon: typeof Settings;
}) {
  return (
    <a
      href="#"
      className="group relative block overflow-hidden rounded-[2rem] border border-on-surface-variant/5 bg-white p-6 transition-all hover:bg-primary/[0.02]"
    >
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-on-surface-variant/5 text-primary transition-all group-hover:bg-primary group-hover:text-white">
            <Icon size={20} />
          </div>
          <div>
            <h4 className="mb-0.5 font-bold text-on-surface">{title}</h4>
            <p className="text-xs font-medium text-on-surface-variant/60">{subtitle}</p>
          </div>
        </div>
        <ChevronRight
          className="text-on-surface-variant/20 transition-all group-hover:translate-x-1 group-hover:text-primary"
          size={20}
        />
      </div>
    </a>
  );
}
