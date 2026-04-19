import { Search, Plus, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';

export default function Orders() {
  const orders = [
    { id: '#ORD-8923', date: '24 Oct, 2023', customer: 'Happy Farm', initial: 'NH', amount: '12,500,000 ₫', payment: 'Paid', status: 'Processing' },
    { id: '#ORD-8924', date: '24 Oct, 2023', customer: 'VinMart Branch 1', initial: 'VM', amount: '45,200,000 ₫', payment: 'Unpaid', status: 'Shipping' },
    { id: '#ORD-8925', date: '23 Oct, 2023', customer: 'Bach Hoa Xanh', initial: 'BH', amount: '8,950,000 ₫', payment: 'Paid', status: 'Completed' },
    { id: '#ORD-8926', date: '22 Oct, 2023', customer: 'VinaAgri Co.', initial: 'CT', amount: '112,000,000 ₫', payment: 'Pending', status: 'Inventory' },
    { id: '#ORD-8927', date: '21 Oct, 2023', customer: 'BigC Supermarket', initial: 'ST', amount: '34,500,000 ₫', payment: 'Refunded', status: 'Cancelled' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tight">Order Management</h2>
          <p className="text-on-surface-variant mt-2 text-sm max-w-xl">
            Track and process agricultural orders in the system. Ensure seamless logistics flow.
          </p>
        </div>
        <button className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all">
          <Plus size={20} />
          <span>New Order</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white/50 p-3 rounded-2xl border border-white">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-on-surface-variant/5">
          <TabButton label="All" active />
          <TabButton label="Pending" />
          <TabButton label="Shipping" />
          <TabButton label="Completed" />
          <TabButton label="Cancelled" />
        </div>
        
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={18} />
          <input 
            type="text" 
            placeholder="Search by ID, Customer..." 
            className="w-full bg-white border border-on-surface-variant/10 text-on-surface text-sm rounded-xl py-3 pl-12 pr-6 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-on-surface-variant/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-on-surface-variant/5">
                <th className="py-6 px-4 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">Order ID</th>
                <th className="py-6 px-4 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">Date</th>
                <th className="py-6 px-4 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">Customer</th>
                <th className="py-6 px-4 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] text-right">Amount</th>
                <th className="py-6 px-4 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] text-center">Payment</th>
                <th className="py-6 px-4 text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em] text-center">Status</th>
                <th className="py-6 px-4"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {orders.map((order, i) => (
                <motion.tr 
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-on-surface-variant/5 transition-colors group"
                >
                  <td className="py-6 px-4 font-black text-primary">{order.id}</td>
                  <td className="py-6 px-4 text-on-surface-variant font-medium">{order.date}</td>
                  <td className="py-6 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/5">
                        {order.initial}
                      </div>
                      <span className="font-bold text-on-surface">{order.customer}</span>
                    </div>
                  </td>
                  <td className="py-6 px-4 text-right font-black text-on-surface">{order.amount}</td>
                  <td className="py-6 px-4 text-center">
                    <PaymentBadge type={order.payment} />
                  </td>
                  <td className="py-6 px-4 text-center">
                    <StatusBadge type={order.status} />
                  </td>
                  <td className="py-6 px-4 text-right">
                    <button className="text-on-surface-variant/40 hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/5">
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 pt-6 border-t border-on-surface-variant/5 flex items-center justify-between text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">
          <div>Showing 1-5 of 248 orders</div>
          <div className="flex items-center gap-2">
            <PaginationButton label="Prev" disabled />
            <div className="flex gap-1">
              <PageNumber num={1} active />
              <PageNumber num={2} />
              <PageNumber num={3} />
              <span className="px-2">...</span>
              <PageNumber num={50} />
            </div>
            <PaginationButton label="Next" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, active }: any) {
  return (
    <button className={`
      px-6 py-2.5 rounded-lg text-sm font-black transition-all duration-200
      ${active ? 'bg-primary text-white shadow-lg shadow-primary/20 transform scale-105' : 'text-on-surface-variant/60 hover:text-primary'}
    `}>
      {label}
    </button>
  );
}

function PaymentBadge({ type }: any) {
  const styles: any = {
    'Paid': 'bg-green-100 text-green-700',
    'Unpaid': 'bg-red-100 text-red-700',
    'Pending': 'bg-yellow-100 text-yellow-700',
    'Refunded': 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[type]}`}>
      {type}
    </span>
  );
}

function StatusBadge({ type }: any) {
  const styles: any = {
    'Processing': 'bg-on-surface-variant/10 text-on-surface',
    'Shipping': 'bg-primary/10 text-primary',
    'Completed': 'bg-green-100 text-green-700',
    'Inventory': 'bg-blue-100 text-blue-700',
    'Cancelled': 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[type]}`}>
      {type}
    </span>
  );
}

function PaginationButton({ label, disabled }: any) {
  return (
    <button 
      disabled={disabled}
      className={`px-4 py-2 rounded-lg border border-on-surface-variant/10 hover:bg-on-surface-variant/5 transition-colors disabled:opacity-30`}
    >
      {label}
    </button>
  );
}

function PageNumber({ num, active }: any) {
  return (
    <button className={`
      w-8 h-8 rounded-lg flex items-center justify-center transition-all font-black text-xs
      ${active ? 'bg-primary text-white' : 'hover:bg-on-surface-variant/10 text-on-surface-variant'}
    `}>
      {num}
    </button>
  );
}
