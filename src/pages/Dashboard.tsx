import { TrendingUp, TrendingDown, Package, Truck, Users } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion } from 'motion/react';

const data = [
  { name: 'T1', revenue: 300 },
  { name: 'T2', revenue: 450 },
  { name: 'T3', revenue: 600 },
  { name: 'T4', revenue: 850 },
  { name: 'T5', revenue: 1000 },
  { name: 'T6', revenue: 750 },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tight">Dashboard Overview</h2>
          <p className="text-on-surface-variant mt-1 text-sm">Performance summary for today, April 19, 2026</p>
        </div>
        <button className="bg-primary-container/10 text-primary-container px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-container/20 transition-all border border-primary-container/20">
          Download Report
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Revenue" 
          value="1.2B ₫" 
          change="+14.5%" 
          trend="up" 
          icon={TrendingUp} 
          subtitle="vs last month"
        />
        <StatCard 
          title="New Orders" 
          value="842" 
          change="+5.2%" 
          trend="up" 
          icon={Truck} 
          subtitle="vs last month"
        />
        <StatCard 
          title="New Customers" 
          value="156" 
          change="-2.1%" 
          trend="down" 
          icon={Users} 
          subtitle="vs last month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-on-surface-variant/5">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold font-headline">Monthly Revenue</h3>
            <select className="bg-on-surface-variant/5 border-none rounded-lg text-sm px-4 py-2 outline-none cursor-pointer">
              <option>Year 2026</option>
              <option>Year 2025</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6B7280' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => `${value}M`}
                />
                <Tooltip 
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    fontSize: '14px'
                  }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#154212" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
          <h3 className="text-xl font-bold mb-6">Featured Products</h3>
          <div className="space-y-4">
            <ProductItem name="Organic Fertilizer" stock="1,200 bags" icon="🌱" />
            <ProductItem name="F1 Hybrid Corn Seeds" stock="500 packs" icon="🌽" />
            <ProductItem name="Drip Irrigation System" stock="45 sets" icon="💧" />
            <ProductItem name="Pruning Shears" stock="72 units" icon="✂️" />
          </div>
          <button className="w-full mt-8 py-3 bg-white border border-primary/10 rounded-xl text-primary font-bold text-sm hover:bg-primary/5 transition-colors">
            View Inventory
          </button>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-on-surface-variant/5">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold">Recent Orders</h3>
          <button className="text-primary font-bold text-sm hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-on-surface-variant/50 uppercase tracking-widest font-black border-b border-on-surface-variant/5">
                <th className="pb-4">Order ID</th>
                <th className="pb-4">Customer</th>
                <th className="pb-4">Amount</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-on-surface-variant/5">
              <TableRow id="#ORD-9823" customer="Happy Farm" amount="45.0M ₫" status="Completed" statusType="success" />
              <TableRow id="#ORD-9824" customer="Green Agri Coop" amount="120.5M ₫" status="Processing" statusType="warning" />
              <TableRow id="#ORD-9825" customer="Tan Market" amount="18.2M ₫" status="Pending" statusType="error" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, icon: Icon, subtitle }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] p-8 shadow-sm border border-on-surface-variant/5 relative overflow-hidden group"
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
      <div className="relative z-10">
        <p className="text-on-surface-variant/60 text-xs font-black uppercase tracking-widest mb-2">{title}</p>
        <h3 className="text-4xl font-black text-primary tracking-tighter mb-4">{value}</h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 ${
            trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <Icon size={12} /> {change}
          </span>
          <span className="text-on-surface-variant/50 text-[10px] uppercase font-bold">{subtitle}</span>
        </div>
      </div>
    </motion.div>
  );
}

function ProductItem({ name, stock, icon }: any) {
  return (
    <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-primary/10">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-on-surface">{name}</p>
        <p className="text-xs text-on-surface-variant/60">Stock: {stock}</p>
      </div>
    </div>
  );
}

function TableRow({ id, customer, amount, status, statusType }: any) {
  const statusStyles: any = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
  };

  return (
    <tr className="group hover:bg-on-surface-variant/5 transition-colors">
      <td className="py-4 font-bold text-primary">{id}</td>
      <td className="py-4 text-sm font-medium">{customer}</td>
      <td className="py-4 text-sm font-black">{amount}</td>
      <td className="py-4">
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusStyles[statusType]}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}
