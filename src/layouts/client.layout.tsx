import { Outlet, NavLink } from 'react-router-dom';

export default function ClientLayout() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(188,240,174,0.45),_transparent_34%),linear-gradient(180deg,#f8f9ff_0%,#eef5ea_100%)] text-on-surface">
      <header className="border-b border-on-surface/8 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary/60">Cultivated Ledger</p>
            <h1 className="text-xl font-black tracking-tight text-primary">Client Workspace</h1>
          </div>
          <nav className="flex items-center gap-3 text-sm font-semibold">
            <NavLink to="/client" end className="rounded-full px-4 py-2 text-on-surface-variant transition hover:text-primary">
              Home
            </NavLink>
            <NavLink to="/admin" className="rounded-full bg-primary px-4 py-2 text-white transition hover:bg-primary-container">
              Admin
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
