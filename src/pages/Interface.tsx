import { useState } from 'react';
import {
  Palette,
  Layout,
  Code,
  Plus,
  GripVertical,
  CheckCircle2,
  ChevronRight,
  Monitor,
  Smartphone,
  Sun,
  Moon,
  Type,
  Grid3X3,
  Settings2,
  Eye,
  EyeOff,
  Sliders,
} from 'lucide-react';
import { useLanguage } from '../i18n/language-context';

const THEME_OPTIONS = [
  {
    id: 'botanical',
    name: 'Botanical Enterprise',
    version: '2.4.1',
    desc: 'Bảng màu xanh hữu cơ, khoảng trắng rộng. Tối ưu cho mật độ thông tin cao.',
    descEn: 'Organic green palette with expansive white space. Optimized for high data density.',
    primary: '#1b5e20',
    accent: '#d9f7c9',
    bg: '#f4f7f1',
    active: true,
  },
  {
    id: 'harvest',
    name: 'Harvest Gold',
    version: '1.2.0',
    desc: 'Tông màu ấm vàng, phù hợp với giao diện mùa thu hoạch.',
    descEn: 'Warm golden tones, fitting for harvest season interfaces.',
    primary: '#92400e',
    accent: '#fde68a',
    bg: '#fffbeb',
    active: false,
  },
  {
    id: 'midnight',
    name: 'Midnight Field',
    version: '1.0.0',
    desc: 'Chế độ tối hoàn toàn, giảm mỏi mắt trong ca làm việc đêm.',
    descEn: 'Full dark mode, reduces eye strain for late-night shifts.',
    primary: '#8bdc8b',
    accent: '#1d3a29',
    bg: '#0f1713',
    active: false,
  },
];

type Block = {
  id: string;
  title: string;
  titleEn: string;
  position: string;
  positionEn: string;
  role: string;
  roleEn: string;
  status: 'active' | 'hidden';
};

const INITIAL_BLOCKS: Block[] = [
  {
    id: 'b1',
    title: 'Biểu đồ sản lượng thu hoạch',
    titleEn: 'Harvest Yield Chart',
    position: 'Trang chủ (đầu trang)',
    positionEn: 'Home (Top)',
    role: 'Tất cả người dùng',
    roleEn: 'All Users',
    status: 'active',
  },
  {
    id: 'b2',
    title: 'Widget thời tiết khu vực',
    titleEn: 'Regional Weather Widget',
    position: 'Thanh bên phải',
    positionEn: 'Right Sidebar',
    role: 'Quản lý',
    roleEn: 'Managers',
    status: 'active',
  },
  {
    id: 'b3',
    title: 'Cảnh báo tồn kho thấp',
    titleEn: 'Low Inventory Alert',
    position: 'Trang kho hàng',
    positionEn: 'Inventory Page',
    role: 'Tất cả người dùng',
    roleEn: 'All Users',
    status: 'hidden',
  },
  {
    id: 'b4',
    title: 'Biểu đồ xu hướng bán hàng',
    titleEn: 'Sales Trend Chart',
    position: 'Trang báo cáo',
    positionEn: 'Reports Page',
    role: 'Quản trị viên',
    roleEn: 'Administrators',
    status: 'active',
  },
];

const TYPOGRAPHY_OPTIONS = [
  { id: 'inter', label: 'Inter', preview: 'Aa' },
  { id: 'manrope', label: 'Manrope', preview: 'Aa' },
  { id: 'nunito', label: 'Nunito Sans', preview: 'Aa' },
];

export default function Interface() {
  const { language } = useLanguage();
  const isVietnamese = language === 'vi';

  const [activeTheme, setActiveTheme] = useState('botanical');
  const [blocks, setBlocks] = useState<Block[]>(INITIAL_BLOCKS);
  const [activeTypo, setActiveTypo] = useState('inter');
  const [density, setDensity] = useState<'comfortable' | 'compact' | 'spacious'>('comfortable');
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const toggleBlock = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, status: b.status === 'active' ? 'hidden' : 'active' } : b,
      ),
    );
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Page header */}
      <div className="max-w-3xl">
        <h1 className="text-[2.5rem] font-black leading-none tracking-tight text-primary">
          {isVietnamese ? 'Quản lý giao diện' : 'Interface Management'}
        </h1>
        <p className="mt-3 text-base text-on-surface-variant">
          {isVietnamese
            ? 'Tinh chỉnh trải nghiệm hiển thị, quản lý theme, bố cục và các tùy chỉnh giao diện quản trị.'
            : 'Fine-tune the visual experience, manage themes, layout blocks, and admin UI customizations.'}
        </p>
      </div>

      {/* ===== THEME GALLERY ===== */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <Palette className="text-accent" size={24} />
          <h2 className="text-xl font-black text-primary">
            {isVietnamese ? 'Bộ nhận diện (Theme)' : 'Theme Gallery'}
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {THEME_OPTIONS.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setActiveTheme(theme.id)}
              className={`group relative overflow-hidden rounded-[2rem] border-2 p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                activeTheme === theme.id
                  ? 'border-primary shadow-md'
                  : 'border-on-surface-variant/10 bg-white hover:border-primary/30'
              }`}
            >
              {/* Theme preview */}
              <div
                className="mb-4 flex h-28 items-center justify-center overflow-hidden rounded-2xl"
                style={{ background: theme.bg }}
              >
                <div className="flex gap-2">
                  <div className="h-12 w-12 rounded-xl shadow-md" style={{ background: theme.primary }} />
                  <div className="h-12 w-12 rounded-xl shadow-md" style={{ background: theme.accent }} />
                  <div className="h-12 w-3 rounded-full self-center" style={{ background: theme.primary, opacity: 0.3 }} />
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <p className="font-black text-on-surface">{theme.name}</p>
                  <p className="mt-0.5 text-xs text-on-surface-variant/60">v{theme.version}</p>
                  <p className="mt-2 text-xs leading-relaxed text-on-surface-variant/70">
                    {isVietnamese ? theme.desc : theme.descEn}
                  </p>
                </div>
                {activeTheme === theme.id && (
                  <div className="ml-3 mt-0.5 shrink-0">
                    <CheckCircle2 size={20} className="text-primary" />
                  </div>
                )}
              </div>

              {activeTheme === theme.id && (
                <div className="mt-3 rounded-full bg-primary/10 px-3 py-1.5 text-center text-[11px] font-black uppercase tracking-wider text-primary">
                  {isVietnamese ? 'Đang sử dụng' : 'Active Theme'}
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* ===== APPEARANCE SETTINGS ===== */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <Settings2 className="text-accent" size={24} />
          <h2 className="text-xl font-black text-primary">
            {isVietnamese ? 'Cài đặt hiển thị' : 'Appearance Settings'}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Color mode */}
          <div className="rounded-[1.5rem] border border-on-surface-variant/10 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              {mode === 'light' ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-indigo-400" />}
              <p className="font-bold text-on-surface">
                {isVietnamese ? 'Chế độ màu' : 'Color Mode'}
              </p>
            </div>
            <div className="flex gap-2">
              {[
                { id: 'light', icon: Sun, label: isVietnamese ? 'Sáng' : 'Light' },
                { id: 'dark', icon: Moon, label: isVietnamese ? 'Tối' : 'Dark' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as 'light' | 'dark')}
                  className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-semibold transition ${
                    mode === m.id
                      ? 'bg-primary text-white'
                      : 'bg-surface text-on-surface-variant hover:bg-primary/5'
                  }`}
                >
                  <m.icon size={16} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="rounded-[1.5rem] border border-on-surface-variant/10 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <Type size={18} className="text-primary" />
              <p className="font-bold text-on-surface">
                {isVietnamese ? 'Kiểu chữ' : 'Typography'}
              </p>
            </div>
            <div className="space-y-2">
              {TYPOGRAPHY_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTypo(t.id)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                    activeTypo === t.id
                      ? 'bg-primary/10 font-bold text-primary'
                      : 'text-on-surface-variant hover:bg-surface'
                  }`}
                >
                  <span>{t.label}</span>
                  <span className="text-base font-black">{t.preview}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Density */}
          <div className="rounded-[1.5rem] border border-on-surface-variant/10 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <Grid3X3 size={18} className="text-primary" />
              <p className="font-bold text-on-surface">
                {isVietnamese ? 'Mật độ layout' : 'Layout Density'}
              </p>
            </div>
            <div className="space-y-2">
              {[
                {
                  id: 'compact',
                  label: isVietnamese ? 'Gọn' : 'Compact',
                  bars: [3, 2],
                },
                {
                  id: 'comfortable',
                  label: isVietnamese ? 'Thoải mái' : 'Comfortable',
                  bars: [4, 3],
                },
                {
                  id: 'spacious',
                  label: isVietnamese ? 'Rộng rãi' : 'Spacious',
                  bars: [6, 4],
                },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDensity(d.id as typeof density)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                    density === d.id
                      ? 'bg-primary/10 font-bold text-primary'
                      : 'text-on-surface-variant hover:bg-surface'
                  }`}
                >
                  <span>{d.label}</span>
                  <div className="flex flex-col gap-0.5">
                    {d.bars.map((w, i) => (
                      <div
                        key={i}
                        className="h-1 rounded-full bg-current opacity-40"
                        style={{ width: `${w * 4}px` }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== PREVIEW ===== */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monitor className="text-accent" size={24} />
            <h2 className="text-xl font-black text-primary">
              {isVietnamese ? 'Xem trước giao diện' : 'Interface Preview'}
            </h2>
          </div>
          <div className="flex gap-2 rounded-xl border border-on-surface-variant/10 bg-white p-1">
            {[
              { id: 'desktop', icon: Monitor },
              { id: 'mobile', icon: Smartphone },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setPreviewDevice(d.id as 'desktop' | 'mobile')}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  previewDevice === d.id ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface'
                }`}
              >
                <d.icon size={16} />
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-on-surface-variant/10 bg-white">
          <div className="flex items-center gap-2 border-b border-on-surface-variant/8 bg-surface px-5 py-3">
            <div className="flex gap-1.5">
              {['#ef4444', '#f59e0b', '#22c55e'].map((c) => (
                <div key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <div className="ml-2 flex-1 rounded-full bg-on-surface-variant/8 px-3 py-1 text-xs text-on-surface-variant/50">
              localhost:5173/admin
            </div>
          </div>
          <div
            className="mx-auto transition-all duration-300"
            style={{ maxWidth: previewDevice === 'mobile' ? '375px' : '100%' }}
          >
            <div className="flex h-48 items-center justify-center text-center">
              <div>
                <Sliders size={36} className="mx-auto mb-3 text-on-surface-variant/20" />
                <p className="text-sm font-semibold text-on-surface-variant/40">
                  {isVietnamese ? 'Xem trước trực tiếp sẽ có ở phiên bản tiếp theo' : 'Live preview coming in next version'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BLOCKS ===== */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div className="flex items-center gap-3">
            <Layout className="text-accent" size={24} />
            <div>
              <h2 className="text-xl font-black text-primary">
                {isVietnamese ? 'Khối giao diện' : 'UI Blocks'}
              </h2>
              <p className="text-sm text-on-surface-variant">
                {isVietnamese
                  ? 'Bật/tắt và sắp xếp các widget hiển thị trên bảng điều khiển.'
                  : 'Toggle and arrange widgets displayed on the dashboard.'}
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-on-surface px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
            <Plus size={16} />
            {isVietnamese ? 'Thêm khối' : 'Add block'}
          </button>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-on-surface-variant/8 bg-white">
          {blocks.map((block, index) => (
            <div
              key={block.id}
              className={`group flex items-center justify-between px-5 py-4 transition-colors hover:bg-primary/[0.02] ${
                index > 0 ? 'border-t border-on-surface-variant/5' : ''
              } ${block.status === 'hidden' ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                <GripVertical
                  className="cursor-grab text-on-surface-variant/20 group-hover:text-primary/30"
                  size={18}
                />
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{
                    background: block.status === 'active' ? 'rgba(27,94,32,0.08)' : 'rgba(0,0,0,0.04)',
                  }}
                >
                  <Layout size={20} className={block.status === 'active' ? 'text-primary' : 'text-on-surface-variant/30'} />
                </div>
                <div>
                  <p className="font-bold text-on-surface">
                    {isVietnamese ? block.title : block.titleEn}
                  </p>
                  <p className="mt-0.5 text-xs text-on-surface-variant/50">
                    {isVietnamese ? 'Vị trí' : 'Position'}: {isVietnamese ? block.position : block.positionEn}
                    {' · '}
                    {isVietnamese ? 'Truy cập' : 'Access'}: {isVietnamese ? block.role : block.roleEn}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleBlock(block.id)}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition ${
                    block.status === 'active'
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-on-surface-variant/8 text-on-surface-variant/60 hover:bg-on-surface-variant/12'
                  }`}
                >
                  {block.status === 'active' ? (
                    <>
                      <Eye size={11} />
                      {isVietnamese ? 'Đang bật' : 'Active'}
                    </>
                  ) : (
                    <>
                      <EyeOff size={11} />
                      {isVietnamese ? 'Đang ẩn' : 'Hidden'}
                    </>
                  )}
                </button>
                <button className="rounded-xl p-1.5 text-on-surface-variant/30 transition hover:text-primary">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== ADVANCED CODE ===== */}
      <section>
        <div className="mb-6 flex items-center gap-3">
          <Code className="text-accent" size={24} />
          <h2 className="text-xl font-black text-primary">
            {isVietnamese ? 'Mã tùy chỉnh' : 'Custom Code'}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              label: isVietnamese ? 'CSS tùy chỉnh' : 'Custom CSS',
              hint: isVietnamese
                ? 'Ghi đè style mặc định của hệ thống.'
                : 'Override default system styles.',
              placeholder: '/* Nhập CSS tùy chỉnh ở đây */',
            },
            {
              label: isVietnamese ? 'JavaScript tùy chỉnh' : 'Custom JavaScript',
              hint: isVietnamese
                ? 'Script được chạy sau khi trang tải xong.'
                : 'Script executed after page load.',
              placeholder: '// Nhập JavaScript tùy chỉnh ở đây',
            },
          ].map((editor) => (
            <div key={editor.label} className="rounded-[1.5rem] border border-on-surface-variant/10 bg-white p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-bold text-on-surface">{editor.label}</p>
                <p className="text-xs text-on-surface-variant/50">{editor.hint}</p>
              </div>
              <textarea
                rows={6}
                placeholder={editor.placeholder}
                className="w-full rounded-xl border border-on-surface-variant/10 bg-surface p-3 font-mono text-xs text-on-surface outline-none focus:border-primary/30"
              />
              <button className="mt-3 rounded-xl bg-primary/8 px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary/15">
                {isVietnamese ? 'Lưu thay đổi' : 'Save changes'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
