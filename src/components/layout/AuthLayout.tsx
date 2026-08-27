import type { ReactNode } from 'react';

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16">
      <div className="glass-elevated flex w-full max-w-[760px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/5">
        {/* Brand panel */}
        <div className="hidden w-[280px] shrink-0 flex-col items-center justify-center overflow-hidden bg-bg-card md:flex">
          <img
            src="/assets/mythix_logo_white_v3.png"
            alt="Mythic Market"
            className="size-[280px] object-contain"
          />
        </div>

        {/* Form panel */}
        <div className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-10">
          <div className="mb-7 flex justify-center md:hidden">
            <img src="/assets/mythix_logo_white_v3.png" alt="Mythic Market" className="size-40 object-contain" />
          </div>
          <h1 className="text-center text-2xl font-bold tracking-tight text-white">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
