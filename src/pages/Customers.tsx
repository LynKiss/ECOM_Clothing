import { Search, Download, Plus, ChevronRight, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export default function Customers() {
  const customers = [
    { id: 1, name: 'Valley Wheat Cooperative', email: 'contact@valleywheat.com', type: 'Supplier', role: 'Admin', status: 'Active', initial: 'VW' },
    { id: 2, name: 'Marcus Johnson', email: 'mjohnson@agrilogistics.net', type: 'Distributor', role: 'Standard', status: 'Active', initial: 'MJ', image: 'https://picsum.photos/seed/man/100/100' },
    { id: 3, name: 'Greenway Nurseries', email: 'info@greenway.com', type: 'Supplier', role: 'Admin', status: 'Inactive', initial: 'GN' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="text-[2.75rem] leading-tight font-black text-primary tracking-tight font-headline">Customers & Accounts</h2>
          <p className="text-on-surface-variant mt-2 text-sm max-w-2xl leading-relaxed">
            Manage client relationships, organization hierarchies, and role-based access control across the supply chain network.
          </p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 bg-white text-primary border border-primary/10 px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary/5 transition-all">
            <Download size={18} />
            <span>Export</span>
          </button>
          <button className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-container text-white px-6 py-3 rounded-xl text-sm font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">
            <Plus size={18} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard title="Total Organizations" value="1,248" growth="+12%" />
        <KpiCard title="Active Users" value="8,402" growth="+5%" />
        <KpiCard title="Pending Approvals" value="24" highlight="Needs Review" />
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-on-surface-variant/5 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-on-surface-variant/5 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm">
          <div className="flex bg-on-surface-variant/5 p-1 rounded-xl">
            <button className="px-6 py-2 text-sm font-black bg-white text-primary shadow-sm rounded-lg transition-all uppercase tracking-widest text-[10px]">All Clients</button>
            <button className="px-6 py-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-all uppercase tracking-widest text-[10px]">Distributors</button>
            <button className="px-6 py-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-all uppercase tracking-widest text-[10px]">Farms</button>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/30" size={16} />
              <input type="text" placeholder="Search customers..." className="w-full bg-on-surface-variant/5 border-none rounded-full py-2.5 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all font-medium" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-on-surface-variant/[0.02]">
                <th className="py-6 px-8 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">Organization / User</th>
                <th className="py-6 px-8 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">Type</th>
                <th className="py-6 px-8 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">Role & Access</th>
                <th className="py-6 px-8 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">Status</th>
                <th className="py-6 px-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-on-surface-variant/5">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-on-surface-variant/[0.02] transition-colors group">
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      {c.image ? (
                        <img src={c.image} alt={c.name} className="w-12 h-12 rounded-2xl object-cover shadow-inner border border-white" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm border border-primary/5">
                          {c.initial}
                        </div>
                      )}
                      <div>
                        <p className="text-base font-bold text-on-surface">{c.name}</p>
                        <p className="text-xs font-medium text-on-surface-variant/60">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <span className="text-xs font-black uppercase tracking-widest text-primary-container flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                       {c.type}
                    </span>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/5">
                        {c.role}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${c.status === 'Active' ? 'bg-green-500' : 'bg-on-surface-variant/20'}`} />
                      <span className="text-sm font-bold text-on-surface-variant">{c.status}</span>
                    </div>
                  </td>
                  <td className="py-6 px-8 text-right">
                    <button className="text-on-surface-variant/20 hover:text-primary p-2 rounded-xl transition-all">
                      <ChevronRight size={24} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, growth, highlight }: any) {
  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-on-surface-variant/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
      <div className="flex justify-between items-start mb-6 uppercase tracking-[0.2em] font-black text-[10px]">
        <p className="text-on-surface-variant/60">{title}</p>
        {growth ? (
          <span className="text-primary flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-lg">
            <TrendingUp size={12} /> {growth}
          </span>
        ) : (
          <span className="text-on-surface-variant/40 bg-on-surface-variant/5 px-3 py-1 rounded-lg">
            {highlight}
          </span>
        )}
      </div>
      <h3 className="text-5xl font-black text-primary tracking-tighter">{value}</h3>
    </div>
  );
}
