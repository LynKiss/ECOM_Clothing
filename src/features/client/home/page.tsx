export default function ClientHomePage() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_30px_70px_-50px_rgba(21,66,18,0.45)] backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/55">Client Base</p>
        <h2 className="mt-4 max-w-xl text-4xl font-black tracking-tight text-primary">
          FE da duoc tach base structure theo huong admin va client.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-on-surface-variant">
          Khu vuc admin su dung lai giao dien goc cua ban o route <span className="font-semibold text-primary">/admin</span>.
          Khu vuc client duoc tao rieng de tiep tuc phat trien ma khong anh huong den web hien tai.
        </p>
      </div>

      <div className="rounded-[2rem] bg-primary p-8 text-white shadow-[0_25px_60px_-35px_rgba(21,66,18,0.7)]">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/65">Workspace Map</p>
        <div className="mt-6 space-y-4 text-sm leading-7 text-white/85">
          <div>
            <p className="font-semibold text-white">Frontend</p>
            <p>`FE/src/routes`, `FE/src/layouts`, `FE/src/features/admin`, `FE/src/features/client`</p>
          </div>
          <div>
            <p className="font-semibold text-white">Backend</p>
            <p>`da_be/` duoc giu nguyen de tach biet ro phan NestJS.</p>
          </div>
          <div>
            <p className="font-semibold text-white">UI safety</p>
            <p>Trang admin hien tai khong bi viet lai, chi doi wiring route va base folder.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
