import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Products() {
  const products = [
    { 
      id: 1, 
      name: 'Khang Dan 18 Rice Seed', 
      sku: 'SD-KD18-001', 
      category: 'Seeds', 
      price: '120,000 ₫', 
      stock: '850 bags', 
      status: 'In Stock',
      image: 'https://picsum.photos/seed/seeds/100/100'
    },
    { 
      id: 2, 
      name: 'NPK 15-15-15 Fertilizer', 
      sku: 'FT-NPK-1515', 
      category: 'Fertilizers', 
      price: '450,000 ₫', 
      stock: '12 bags', 
      status: 'Low Stock',
      image: 'https://picsum.photos/seed/fertilizer/100/100'
    },
    { 
      id: 3, 
      name: 'Professional Pruning Shears', 
      sku: 'TL-PRUN-01', 
      category: 'Tools', 
      price: '250,000 ₫', 
      stock: '45 units', 
      status: 'In Stock',
      image: 'https://picsum.photos/seed/tools/100/100'
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tight">Product Management</h2>
          <p className="text-on-surface-variant mt-2 text-sm max-w-xl">
            Manage seeds, fertilizers, and agricultural tools. Control inventory and update detailed pricing.
          </p>
        </div>
        <button className="bg-gradient-to-r from-primary to-primary-container text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all outline-none">
          <Plus size={20} />
          <span>Add New Product</span>
        </button>
      </div>

      <div className="bg-white/40 backdrop-blur-md rounded-[2rem] p-4 flex flex-wrap gap-4 items-center border border-white">
        <div className="flex-1 min-w-[200px]">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 mb-2 ml-4">Category Filter</p>
          <div className="flex gap-2">
            <FilterChip label="All Products" active />
            <FilterChip label="Seeds" />
            <FilterChip label="Fertilizers" />
            <FilterChip label="Tools" />
          </div>
        </div>
        <div className="min-w-[200px]">
          <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 mb-2 ml-4">Stock Status</p>
          <select className="bg-white border-2 border-primary/5 rounded-2xl px-6 py-2.5 text-sm font-bold text-on-surface outline-none cursor-pointer w-full focus:border-primary/20 transition-all">
            <option>All Statuses</option>
            <option>In Stock</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-on-surface-variant/5">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] text-on-surface-variant/40 uppercase tracking-[0.2em] font-black border-b border-on-surface-variant/5">
              <th className="pb-6 pl-4">Image</th>
              <th className="pb-6">Product / SKU</th>
              <th className="pb-6">Category</th>
              <th className="pb-6 text-right">Price</th>
              <th className="pb-6 text-center">Stock</th>
              <th className="pb-6 text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-on-surface-variant/5">
            {products.map((p) => (
              <motion.tr 
                key={p.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="group hover:bg-on-surface-variant/5 transition-colors"
                referrerPolicy="no-referrer"
              >
                <td className="py-6 pl-4">
                  <div className="w-14 h-14 rounded-2xl bg-surface-variant overflow-hidden shadow-inner border border-white">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </td>
                <td className="py-6">
                  <p className="font-bold text-primary text-base">{p.name}</p>
                  <p className="text-[11px] font-bold text-on-surface-variant/40 mt-0.5 tracking-wider">{p.sku}</p>
                </td>
                <td className="py-6">
                  <span className="bg-on-surface-variant/5 text-on-surface-variant px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest">
                    {p.category}
                  </span>
                </td>
                <td className="py-6 text-right font-black text-on-surface">{p.price}</td>
                <td className="py-6 text-center">
                  <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    p.status === 'Low Stock' 
                      ? 'bg-red-50 text-red-600' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {p.stock} {p.status === 'Low Stock' && '(Low)'}
                  </span>
                </td>
                <td className="py-6 text-right pr-4">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all">
                      <Edit2 size={18} />
                    </button>
                    <button className="p-2 rounded-xl text-on-surface-variant hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterChip({ label, active }: any) {
  return (
    <button className={`
      px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200
      ${active 
        ? 'bg-primary text-white shadow-lg shadow-primary/20 transform scale-105' 
        : 'bg-white text-on-surface-variant/70 hover:bg-on-surface-variant/10'}
    `}>
      {label}
    </button>
  );
}
