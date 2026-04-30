import { Link } from 'react-router-dom';
import { ArrowRight, Palette, Ruler, Shirt, ShoppingBag, Sparkles } from 'lucide-react';

const styleModes = [
  { title: 'Di lam', desc: 'So mi, quan tay, blazer nhe va gam mau de phoi.', icon: Shirt },
  { title: 'Di choi', desc: 'T-shirt, denim, hoodie va sneaker-ready outfit.', icon: Palette },
  { title: 'Chon size', desc: 'Goi y size theo chieu cao, can nang va form dang mong muon.', icon: Ruler },
];

const prompts = [
  'Toi cao 1m70, nang 62kg, can outfit di lam gon gang',
  'Goi y set streetwear cuoi tuan voi quan jeans xanh',
  'Toi thich form oversize, nen chon size nao?',
];

export default function StyleAdvisor() {
  return (
    <div className="bg-[#F8FAFC] text-[#0B0F19]">
      <section className="bg-[#0B0F19] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:px-6 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#DBEAFE] ring-1 ring-white/15">
              <Sparkles size={14} /> AI Style Advisor
            </span>
            <h1 className="mt-7 max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Tu van phoi do va chon size cho tung phong cach.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
              Nhap nhu cau mac, chieu cao, can nang, mau sac ua thich hoac dip su dung. He thong se goi y nhom san pham, chat lieu, form dang va size phu hop trong Fashion Ledger.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/client/products" className="client-pill-primary inline-flex items-center gap-2 px-7 py-3 text-sm font-black">
                Mua sam ngay <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('support-chat:open'))}
                className="rounded-full border border-white/30 px-7 py-3 text-sm font-black text-white transition hover:bg-white hover:text-[#0B0F19]"
              >
                Mo chat tu van
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-white p-5 text-[#0B0F19] shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
            <div className="rounded-xl bg-[#F8FAFC] p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2563EB]">Thu goi y</p>
              <div className="mt-4 space-y-3">
                {prompts.map((item) => (
                  <button key={item} className="w-full rounded-xl border border-[#DBEAFE] bg-white px-4 py-3 text-left text-sm font-semibold text-[#0B0F19] transition hover:border-[#2563EB] hover:text-[#2563EB]">
                    {item}
                  </button>
                ))}
              </div>
              <div className="mt-5 rounded-xl bg-[#0B0F19] p-4 text-white">
                <p className="text-sm font-black">Goi y mau</p>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  Outfit smart casual: so mi oxford xanh nhat, quan chinos den, sneaker trang. Neu thich form rong, tang 1 size so voi bang size co ban.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {styleModes.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="client-card p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DBEAFE] text-[#2563EB]">
                  <Icon size={24} />
                </div>
                <h2 className="mt-5 text-xl font-black text-[#0B0F19]">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-gray-500">{item.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 lg:px-6">
        <div className="client-card grid gap-6 p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2563EB]">San pham phu hop</p>
            <h2 className="mt-2 text-3xl font-black text-[#0B0F19]">Bat dau voi bo suu tap moi</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-500">
              Loc theo thuong hieu, mau, size, chat lieu va style de tim nhanh outfit phu hop.
            </p>
          </div>
          <Link to="/client/products" className="client-pill-primary inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-black">
            Xem san pham <ShoppingBag size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
