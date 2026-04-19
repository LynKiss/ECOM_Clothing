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
  MessageCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const sections = [
    {
      title: 'General Config',
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      items: [
        { label: 'Website Info', icon: Globe },
        { label: 'Languages', icon: Languages },
        { label: 'Email Notifications', icon: Mail },
        { label: 'Provincial Data', icon: MapPin },
      ]
    },
    {
      title: 'Sales Config',
      icon: Store,
      color: 'text-primary',
      bg: 'bg-primary/5',
      items: [
        { label: 'Products Master', icon: Package },
        { label: 'Order Rules', icon: ShoppingCart },
        { label: 'Print Templates', icon: Printer },
        { label: 'Lead Sources', icon: Share2 },
      ]
    },
    {
      title: 'Logistics',
      icon: Truck,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      items: [
        { label: 'Shipping Carriers', icon: Truck },
        { label: 'Freight Settings', icon: Globe },
      ]
    },
    {
      title: 'Communication',
      icon: MessageSquare,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      items: [
        { label: 'SMS Brandname', icon: Smartphone },
        { label: 'Chat Templates', icon: MessageCircle },
      ]
    },
    {
      title: 'Social & Marketing',
      icon: Share2,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      items: [
        { label: 'Facebook Pixel', icon: Facebook },
        { label: 'Zalo OA', icon: MessageSquare },
      ]
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      <div className="max-w-4xl">
        <h1 className="text-4xl font-headline font-black text-primary leading-none tracking-tight mb-4">System Configuration</h1>
        <p className="text-on-surface-variant font-medium text-lg max-w-2xl leading-relaxed">
          Manage core settings, sales parameters, and third-party integrations for the operational backbone.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-[2.5rem] p-8 border border-on-surface-variant/5 hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden"
          >
            <div className={`absolute -right-12 -top-12 w-40 h-40 ${section.bg} rounded-full blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-700`} />
            
            <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className={`w-12 h-12 rounded-2xl ${section.bg} ${section.color} flex items-center justify-center border border-on-surface-variant/5 shadow-inner`}>
                <section.icon size={28} />
              </div>
              <h2 className="text-lg font-black text-on-surface">{section.title}</h2>
            </div>

            <nav className="flex flex-col gap-1 relative z-10">
              {section.items.map((item, i) => (
                <a 
                  key={i} 
                  href="#" 
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-on-surface-variant/5 transition-colors group/item"
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-on-surface-variant/40 group-hover/item:text-primary transition-colors" />
                    <span className="text-sm font-bold text-on-surface-variant/80 group-hover/item:text-primary transition-colors">{item.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-on-surface-variant/20 group-hover/item:translate-x-1 transition-all" />
                </a>
              ))}
            </nav>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
