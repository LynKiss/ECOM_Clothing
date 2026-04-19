export default function ClientHomePage() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_30px_70px_-50px_rgba(21,66,18,0.45)] backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/55">Nền tảng client</p>
        <h2 className="mt-4 max-w-xl text-4xl font-black tracking-tight text-primary">
          FE đã được tách base structure theo hướng admin và client.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-on-surface-variant">
          Khu vực admin sử dụng lại giao diện gốc của bạn ở route <span className="font-semibold text-primary">/admin</span>.
          Khu vực client được tạo riêng để tiếp tục phát triển mà không ảnh hưởng đến web hiện tại.
        </p>
      </div>

      <div className="rounded-[2rem] bg-primary p-8 text-white shadow-[0_25px_60px_-35px_rgba(21,66,18,0.7)]">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/65">Sơ đồ workspace</p>
        <div className="mt-6 space-y-4 text-sm leading-7 text-white/85">
          <div>
            <p className="font-semibold text-white">Frontend</p>
            <p>`FE/src/routes`, `FE/src/layouts`, `FE/src/features/admin`, `FE/src/features/client`</p>
          </div>
          <div>
            <p className="font-semibold text-white">Backend</p>
            <p>`da_be/` được giữ nguyên để tách biệt rõ phần NestJS.</p>
          </div>
          <div>
            <p className="font-semibold text-white">An toàn giao diện</p>
            <p>Trang admin hiện tại không bị viết lại, chỉ đổi wiring route và base folder.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
