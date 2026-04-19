import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface px-6 py-16 text-on-surface">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-on-surface/10 bg-white p-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/70">404</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-primary">Page not found</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-on-surface-variant">
          Route nay chua duoc cau hinh trong base structure moi cua FE.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            to="/admin"
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-container"
          >
            Ve admin
          </Link>
          <Link
            to="/client"
            className="rounded-full border border-on-surface/10 px-5 py-3 text-sm font-semibold text-on-surface transition hover:border-primary/30 hover:text-primary"
          >
            Ve client
          </Link>
        </div>
      </div>
    </div>
  );
}
