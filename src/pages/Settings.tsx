import {
  Building2,
  Store,
  Truck,
  MessageSquare,
  Share2,
  Globe,
  Languages,
  Mail,
  MapPin,
  Package,
  ShoppingCart,
  Printer,
  ChevronRight,
  Facebook,
  Smartphone,
  MessageCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../i18n/language-context';

export default function Settings() {
  const { language } = useLanguage();
  const isVietnamese = language === 'vi';

  const sections = [
    {
      title: isVietnamese ? 'Cấu hình chung' : 'General Config',
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      items: [
        { label: isVietnamese ? 'Thông tin website' : 'Website Info', icon: Globe },
        { label: isVietnamese ? 'Ngôn ngữ' : 'Languages', icon: Languages },
        { label: isVietnamese ? 'Email thông báo' : 'Email Notifications', icon: Mail },
        { label: isVietnamese ? 'Dữ liệu tỉnh thành' : 'Provincial Data', icon: MapPin },
      ],
    },
    {
      title: isVietnamese ? 'Cấu hình bán hàng' : 'Sales Config',
      icon: Store,
      color: 'text-primary',
      bg: 'bg-primary/5',
      items: [
        { label: isVietnamese ? 'Danh mục sản phẩm' : 'Products Master', icon: Package },
        { label: isVietnamese ? 'Quy tắc đơn hàng' : 'Order Rules', icon: ShoppingCart },
        { label: isVietnamese ? 'Mẫu in' : 'Print Templates', icon: Printer },
        { label: isVietnamese ? 'Nguồn lead' : 'Lead Sources', icon: Share2 },
      ],
    },
    {
      title: isVietnamese ? 'Vận chuyển' : 'Logistics',
      icon: Truck,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      items: [
        { label: isVietnamese ? 'Đơn vị giao hàng' : 'Shipping Carriers', icon: Truck },
        { label: isVietnamese ? 'Thiết lập cước phí' : 'Freight Settings', icon: Globe },
      ],
    },
    {
      title: isVietnamese ? 'Giao tiếp' : 'Communication',
      icon: MessageSquare,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      items: [
        { label: isVietnamese ? 'SMS Brandname' : 'SMS Brandname', icon: Smartphone },
        { label: isVietnamese ? 'Mẫu hội thoại' : 'Chat Templates', icon: MessageCircle },
      ],
    },
    {
      title: isVietnamese ? 'Mạng xã hội và marketing' : 'Social and Marketing',
      icon: Share2,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      items: [
        { label: 'Facebook Pixel', icon: Facebook },
        { label: 'Zalo OA', icon: MessageSquare },
      ],
    },
  ];

  return (
    <div className="space-y-12 pb-20">
      <div className="max-w-4xl">
        <h1 className="mb-4 text-4xl font-headline font-black leading-none tracking-tight text-primary">
          {isVietnamese ? 'Cấu hình hệ thống' : 'System Configuration'}
        </h1>
        <p className="max-w-2xl text-lg font-medium leading-relaxed text-on-surface-variant">
          {isVietnamese
            ? 'Quản lý thiết lập lõi, thông số bán hàng và tích hợp bên thứ ba cho hệ thống vận hành.'
            : 'Manage core settings, sales parameters, and third-party integrations for the operational backbone.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative overflow-hidden rounded-[2.5rem] border border-on-surface-variant/5 bg-white p-8 transition-all hover:shadow-2xl hover:shadow-primary/5"
          >
            <div className={`absolute -right-12 -top-12 h-40 w-40 rounded-full blur-2xl opacity-50 transition-transform duration-700 group-hover:scale-150 ${section.bg}`} />

            <div className="relative z-10 mb-8 flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-on-surface-variant/5 shadow-inner ${section.bg} ${section.color}`}>
                <section.icon size={28} />
              </div>
              <h2 className="text-lg font-black text-on-surface">{section.title}</h2>
            </div>

            <nav className="relative z-10 flex flex-col gap-1">
              {section.items.map((item, i) => (
                <a
                  key={i}
                  href="#"
                  className="group/item flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-on-surface-variant/5"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-on-surface-variant/40 transition-colors group-hover/item:text-primary" />
                    <span className="text-sm font-bold text-on-surface-variant/80 transition-colors group-hover/item:text-primary">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-on-surface-variant/20 transition-all group-hover/item:translate-x-1" />
                </a>
              ))}
            </nav>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
