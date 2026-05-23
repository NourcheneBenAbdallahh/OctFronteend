import Image from "next/image";

type AuthBrandAsideProps = {
  tagline?: React.ReactNode;
  footerTitle?: string;
  footerSubtitle?: string;
};

export default function AuthBrandAside({
  tagline = (
    <>
      La gestion <br />
      <span className="text-emerald-300 italic text-6xl lowercase">réinventée.</span>
    </>
  ),
  footerTitle = "Système PFE @2026",
  footerSubtitle = "Optimisé Logistique",
}: AuthBrandAsideProps) {
  return (
    <div className="hidden lg:flex w-1/2 bg-[#00A09D] relative flex-col justify-between p-20 overflow-hidden group">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/stock.png"
          alt="Stock"
          fill
          className="object-cover opacity-30 transition-transform duration-1000 group-hover:scale-110"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#00A09D] via-[#00A09D]/70 to-transparent" />
      </div>
      <div className="relative z-20">
        <div className="flex items-center gap-4 mb-14">
          <div className="bg-white p-3 rounded-[22px] shadow-2xl">
            <div className="w-12 h-12 bg-[#00A09D] rounded-[15px] flex items-center justify-center font-[1000] text-3xl italic text-white shadow-inner">
              S
            </div>
          </div>
          <div className="flex flex-col text-white">
            <span className="text-3xl font-[1000] tracking-tighter leading-none uppercase">OCT</span>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-200/90">
              Gestion des emballages
            </span>
          </div>
        </div>
        <h2 className="text-7xl font-[1000] leading-[0.95] text-white tracking-tighter uppercase">
          {tagline}
        </h2>
      </div>
      <div className="relative z-20 self-start flex items-center gap-5 bg-white/10 backdrop-blur-xl p-5 rounded-[30px] border border-white/20 transition-transform hover:translate-x-2">
        <div className="w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center font-black text-[#00A09D] text-lg shadow-lg">
          ✓
        </div>
        <p className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">
          {footerTitle}
          <br />
          <span className="text-emerald-100/70">{footerSubtitle}</span>
        </p>
      </div>
    </div>
  );
}
