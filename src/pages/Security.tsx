import { ShieldCheck, Info, Globe, Key, Trash, History, Activity } from 'lucide-react';
import { motion } from 'motion/react';

export default function Security() {
  return (
    <div className="space-y-12 pb-20">
      <div className="max-w-4xl">
        <h1 className="text-4xl font-headline font-black text-primary leading-none tracking-tight mb-4">Security & Protocol</h1>
        <p className="text-on-surface-variant font-medium text-lg max-w-2xl leading-relaxed">
          Manage system defenses, cryptographic configurations, and public index visibility for the cultivation network.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          {/* Access & Cryptography */}
          <section className="bg-white rounded-[2.5rem] p-10 border border-on-surface-variant/5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/5">
                <ShieldCheck size={28} />
              </div>
              <h2 className="text-2xl font-black text-primary tracking-tight">Access & Cryptography</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-on-surface mb-1">SSL Certificate Enforcement</h3>
                  <p className="text-xs font-medium text-on-surface-variant/60 leading-relaxed">Require HTTPS for all ledger transactions across nodes.</p>
                </div>
                <div className="flex items-center justify-between bg-primary/[0.03] p-6 rounded-2xl border border-primary/5">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-primary block mb-1">Status: Active</span>
                    <span className="text-[11px] font-bold text-on-surface-variant/60">Let's Encrypt Authority X3</span>
                  </div>
                  <Toggle active />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 px-1">
                   <Activity size={12} /> Certificate expires in 84 days
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-on-surface mb-1">Bot Mitigation (Captcha)</h3>
                  <p className="text-xs font-medium text-on-surface-variant/60 leading-relaxed">Configure reCAPTCHA v3 for public entry points.</p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">Site Key</label>
                    <div className="flex bg-on-surface-variant/5 rounded-xl border border-transparent focus-within:border-primary/20 transition-all">
                      <input 
                        type="text" 
                        readOnly 
                        value="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" 
                        className="flex-1 bg-transparent border-none py-3 px-4 text-xs font-mono text-on-surface outline-none"
                      />
                    </div>
                  </div>
                  <button className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary-container flex items-center gap-2 ml-1 transition-colors">
                    <Key size={14} /> Update Cryptographic keys
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Index & Discovery */}
          <section className="bg-white rounded-[2.5rem] p-10 border border-on-surface-variant/5 shadow-sm">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/5">
                <Globe size={28} />
              </div>
              <h2 className="text-2xl font-black text-primary tracking-tight">Index & Discovery</h2>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">Title Format Pattern</label>
                  <input 
                    type="text" 
                    value="%page_title% | %site_name% - Agricultural Analytics" 
                    className="w-full bg-on-surface-variant/5 border-none rounded-xl py-3.5 px-5 text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-1">Sitemap Frequency</label>
                  <select className="w-full bg-on-surface-variant/5 border-none rounded-xl py-3.5 px-5 text-sm font-bold text-on-surface outline-none cursor-pointer">
                    <option>Daily Generation</option>
                    <option>Weekly Generation</option>
                    <option>Manual Trigger Only</option>
                  </select>
                </div>
              </div>

              <div className="bg-primary/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-primary/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                    <History size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface">XML Sitemap Control</h4>
                    <p className="text-xs font-medium text-on-surface-variant/60 mt-0.5">Last successful sync: Today, 04:30 AM</p>
                  </div>
                </div>
                <button className="bg-white text-primary px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all border border-primary/10">
                  Regenerate Now
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* System Operations Rail */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-primary text-white rounded-[2.5rem] p-8 shadow-2xl shadow-primary/20">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-8 text-white/50">System Operations</h3>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <History size={18} className="text-accent" />
                  <span className="text-sm font-bold">Memory Cache</span>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                  Clear compiled templates and cached query results to force a fresh render of the frontend layer.
                </p>
                <button className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all mt-2 flex items-center justify-center gap-2">
                  <Trash size={14} /> Purge Cache
                </button>
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <Activity size={18} className="text-accent" />
                  <span className="text-sm font-bold">API Gateways</span>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                  Monitor external connection integrity and node-to-node webhook responsiveness.
                </p>
                <button className="w-full text-accent hover:text-white py-2 text-xs font-black uppercase tracking-widest transition-all text-center">
                  Configure Endpoints →
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 flex gap-4 text-on-surface-variant/40 bg-on-surface-variant/5 rounded-2xl">
            <Info size={24} className="shrink-0" />
            <p className="text-[11px] font-bold leading-relaxed">
              Modifying security protocols may require a full cluster restart. Active sessions will be invalidated upon SSL certificate rotation.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Toggle({ active }: { active?: boolean }) {
  return (
    <button className={`
      relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
      ${active ? 'bg-primary' : 'bg-on-surface-variant/10'}
    `}>
      <span className={`
        inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
        ${active ? 'translate-x-5' : 'translate-x-0'}
      `} />
    </button>
  );
}
