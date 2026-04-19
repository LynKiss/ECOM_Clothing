import { Palette, Layout, Settings, Code, Plus, MoreVertical, GripVertical, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Interface() {
  const blocks = [
    { title: 'Harvest Yield Chart', position: 'Home (Top)', role: 'All Users', icon: Layout, status: 'active' },
    { title: 'Regional Weather Widget', position: 'Sidebar Right', role: 'Managers', icon: Layout, status: 'active' },
    { title: 'Low Inventory Alert', position: 'Inventory Page', role: 'All Users', icon: Layout, status: 'hidden' },
  ];

  return (
    <div className="space-y-12 pb-20">
      <div className="max-w-4xl">
        <h1 className="text-[3rem] font-headline font-black text-primary leading-none tracking-tight mb-4">Interface Control</h1>
        <p className="text-on-surface-variant font-medium text-lg max-w-2xl leading-relaxed">
          Fine-tune the visual experience and information structure of Harvest OS. Manage themes, high-level UI overrides, and layout blocks.
        </p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-primary flex items-center gap-3">
            <Palette className="text-accent" size={28} />
            Theme Configuration
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-10 relative overflow-hidden group border border-on-surface-variant/5">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-full md:w-5/12 shrink-0 rounded-[2rem] overflow-hidden aspect-[4/3] relative ring-1 ring-on-surface-variant/5 shadow-2xl">
              <img 
                src="https://picsum.photos/seed/interface/600/400" 
                alt="Theme Preview" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 bg-accent text-primary text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg border border-white/50">
                Active Theme
              </div>
            </div>

            <div className="flex flex-col justify-between z-10 flex-1 py-2">
              <div>
                <h3 className="text-3xl font-black text-on-surface mb-3 tracking-tighter">Botanical Enterprise v2.4</h3>
                <p className="text-sm text-on-surface-variant/80 leading-relaxed mb-8">
                  The default system identity focuses on data integrity with organic green palettes and expansive white space. Optimized for high information density.
                </p>
                <div className="flex gap-8 mb-8 pb-8 border-b border-on-surface-variant/5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Version</span>
                    <span className="text-sm font-bold text-on-surface">2.4.1 (Stable)</span>
                  </div>
                  <div className="flex flex-col gap-1 pl-8 border-l border-on-surface-variant/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Last Updated</span>
                    <span className="text-sm font-bold text-on-surface">Yesterday</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="bg-primary text-white px-8 py-3 rounded-xl text-sm font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                  Customize
                </button>
                <button className="bg-on-surface-variant/5 text-on-surface px-6 py-3 rounded-xl text-sm font-bold hover:bg-on-surface-variant/10 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <MenuCard title="Theme Library" subtitle="Browse 12 pre-built identities" icon={Settings} />
             <MenuCard title="Global Settings" subtitle="Logos, typography, branding" icon={Settings} />
             <MenuCard title="Custom Codes" subtitle="Developer override (CSS/JS)" icon={Code} />
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-black text-primary flex items-center gap-3">
              <Layout className="text-accent" size={28} />
              Block Components
            </h2>
            <p className="text-sm text-on-surface-variant font-medium mt-1">Manage modular content tiles across dashboard and reports.</p>
          </div>
          <button className="flex items-center gap-2 bg-on-surface text-white px-6 py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">
            <Plus size={18} />
            <span>Add Block</span>
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] p-6 space-y-3 border border-on-surface-variant/5">
           {blocks.map((block, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className={`flex items-center justify-between p-5 rounded-2xl transition-all border border-transparent hover:border-primary/5 hover:bg-primary/[0.02] group ${block.status === 'hidden' ? 'opacity-50' : ''}`}
             >
               <div className="flex items-center gap-6">
                 <GripVertical className="text-on-surface-variant/20 group-hover:text-primary/40 cursor-grab" size={20} />
                 <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/5">
                   <block.icon size={24} />
                 </div>
                 <div>
                   <h4 className="font-bold text-on-surface text-base">{block.title}</h4>
                   <p className="text-xs font-bold text-on-surface-variant/40 mt-1 uppercase tracking-widest leading-none">
                     Position: {block.position} • Access: {block.role}
                   </p>
                 </div>
               </div>
               <div className="flex items-center gap-6">
                 {block.status === 'active' ? (
                   <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest">
                     <CheckCircle2 size={12} /> Active
                   </span>
                 ) : (
                   <span className="px-4 py-1.5 rounded-full bg-on-surface-variant/5 text-on-surface-variant/60 text-[10px] font-black uppercase tracking-widest">
                     Hidden
                   </span>
                 )}
                 <button className="text-on-surface-variant/20 hover:text-primary transition-colors p-2 rounded-xl">
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

function MenuCard({ title, subtitle, icon: Icon }: any) {
  return (
    <a href="#" className="block bg-white rounded-[2rem] p-6 hover:bg-primary/[0.02] border border-on-surface-variant/5 transition-all group relative overflow-hidden">
      <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-on-surface-variant/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
            <Icon size={20} />
          </div>
          <div>
            <h4 className="font-bold text-on-surface mb-0.5">{title}</h4>
            <p className="text-xs font-medium text-on-surface-variant/60">{subtitle}</p>
          </div>
        </div>
        <ChevronRight className="text-on-surface-variant/20 group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
      </div>
    </a>
  );
}

function ChevronRight({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      className={className} 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
