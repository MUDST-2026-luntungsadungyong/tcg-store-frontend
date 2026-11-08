import { createContext, useContext, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AuthCardBackdrop, useSaleCardImages } from './AuthCardBackdrop';

export const AuthShellContext = createContext(false);

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  const sharedShell = useContext(AuthShellContext);
  const content = <><h1 tabIndex={-1} className="text-center text-2xl font-bold tracking-tight text-white outline-none">{title}</h1>{children}</>;
  return sharedShell ? content : <AuthFrame>{content}</AuthFrame>;
}

export function AuthFrame({ children, compactMobile = false }: { children: ReactNode; compactMobile?: boolean }) {
  const reducedMotion = useReducedMotion();
  const saleCardImages = useSaleCardImages(compactMobile);
  return (
    <div className={compactMobile
      ? 'relative isolate flex min-h-[calc(100dvh-65px)] items-stretch justify-center overflow-hidden md:items-center md:px-4 md:py-16'
      : 'flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-16'}>
      {compactMobile && <AuthCardBackdrop images={saleCardImages} />}
      <div className={compactMobile
        ? 'flex min-h-[calc(100dvh-65px)] w-full flex-col overflow-hidden bg-bg-card md:min-h-0 md:max-w-[760px] md:flex-row md:rounded-2xl md:shadow-2xl md:ring-1 md:ring-white/5'
        : 'glass-elevated flex w-full max-w-[760px] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/5'}>
        {compactMobile && (
          <div className="relative isolate min-h-48 flex-1 overflow-hidden bg-gradient-to-br from-brand-blue/25 via-bg-card to-bg-surface px-6 pb-12 pt-7 md:hidden">
            <AuthCardBackdrop images={saleCardImages} mobile />
            <div className="relative mb-2 h-14 w-20 overflow-hidden">
              <img src="/assets/mythix_logo_white_v3.png" alt="Mythix" width={160} height={160} className="absolute left-1/2 top-1/2 size-40 max-w-none -translate-x-1/2 -translate-y-1/2 object-contain" />
            </div>
            <p className="max-w-[15rem] text-lg font-semibold leading-6 text-white">Collect what you love.</p>
            <p className="mt-1 text-sm leading-5 text-gray-300">Your next great find starts here.</p>
          </div>
        )}
        {/* Brand panel */}
        <div className={`relative isolate hidden w-[280px] shrink-0 flex-col items-center justify-center overflow-hidden bg-bg-card md:flex ${compactMobile ? 'bg-gradient-to-br from-brand-blue/15 via-bg-card to-brand-gold/10' : ''}`}>
          {compactMobile && <div aria-hidden="true" className="pointer-events-none absolute size-44 rounded-full bg-brand-blue/10 blur-3xl" />}
          <motion.img
            src="/assets/mythix_logo_white_v3.png"
            alt="Mythix"
            className="size-[280px] object-contain"
            whileHover={compactMobile && !reducedMotion ? { scale: 1.04, rotate: -3, y: -4 } : undefined}
            transition={{ type: 'spring', stiffness: 180, damping: 18 }}
          />
        </div>

        {/* Form panel */}
        <div data-testid="auth-form-panel" className={compactMobile
          ? 'relative -mt-6 flex min-w-0 flex-none flex-col justify-center rounded-t-[2rem] bg-bg-elevated px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 shadow-[0_-12px_32px_-20px_rgba(0,0,0,0.5)] sm:px-8 md:mt-0 md:flex-1 md:rounded-none md:bg-bg-elevated md:px-10 md:py-12 md:shadow-none [&_input]:text-base md:[&_input]:text-sm [&_input]:scroll-mt-24'
          : 'flex flex-1 flex-col justify-center px-8 py-12 sm:px-10'}>
          {!compactMobile && <div className="mb-7 flex justify-center md:hidden">
            <img src="/assets/mythix_logo_white_v3.png" alt="Mythix" width={160} height={160} className="size-40 object-contain" />
          </div>}
          {children}
        </div>
      </div>
    </div>
  );
}
