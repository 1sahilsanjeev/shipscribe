import React from 'react';
import { X } from 'lucide-react';

// --- TYPE DEFINITIONS ---

interface AuthLayoutProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  heroVideoSrc?: string;
  children: React.ReactNode;
}

// --- MAIN COMPONENT ---

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title = <span className="font-light text-foreground tracking-tighter text-white">Welcome</span>,
  description = "Access your account and continue your journey with us",
  heroImageSrc,
  heroVideoSrc,
  children,
}) => {
  return (
    <div className="h-[100dvh] flex flex-col md:flex-row w-[100dvw] bg-zinc-950 font-body text-zinc-300 overflow-hidden dark">
      {/* Left column: form content */}
      <section className="flex-1 flex items-center justify-center p-8 relative z-10 overflow-y-auto scrollbar-hide">
        {/* Back Button */}
        <a 
          href="/" 
          className="absolute top-8 left-8 p-2 rounded-full bg-white/5 border border-white/10 text-zinc-500 hover:text-white hover:bg-white/10 transition-all z-20 group"
          title="Back to home"
        >
          <X size={16} className="transition-transform group-hover:scale-110" />
        </a>

        {/* Subtle background glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[100px] rounded-full" />
        </div>

        <div className="w-full max-w-[380px] py-12 relative z-10">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-headline font-light tracking-tight text-white leading-[1.1] drop-shadow-2xl">{title}</h1>
            <p className="animate-element animate-delay-200 text-sm text-zinc-400 font-body leading-relaxed max-w-[95%]">{description}</p>
            {children}
          </div>
        </div>
      </section>

      {/* Right column: hero image/video + testimonials */}
      {(heroImageSrc || heroVideoSrc) && (
        <section className="hidden md:block flex-1 relative p-4 m-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-0 rounded-[32px] bg-cover bg-center shadow-2xl overflow-hidden bg-zinc-900">
             {heroVideoSrc ? (
               <video 
                 src={heroVideoSrc} 
                 autoPlay 
                 muted 
                 loop 
                 playsInline
                 className="absolute inset-0 w-full h-full object-cover opacity-80"
               />
             ) : (
               <div 
                 className="absolute inset-0 bg-cover bg-center" 
                 style={{ backgroundImage: `url(${heroImageSrc})` }} 
               />
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        </section>
      )}
    </div>
  );
};
