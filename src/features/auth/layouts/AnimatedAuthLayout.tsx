import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AuthFrame, AuthShellContext } from './AuthLayout';

export function AnimatedAuthLayout() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const reducedMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const focusedPath = useRef(pathname);
  const [height, setHeight] = useState<number>();
  const direction = pathname === '/register' ? 1 : -1;

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setHeight(element.getBoundingClientRect().height));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <AuthFrame compactMobile>
      <AuthShellContext.Provider value={true}>
        <motion.div
          className="-mx-1 overflow-hidden px-1 max-md:!h-auto"
          animate={{ height }}
          transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div ref={contentRef}>
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              <motion.div
                key={pathname}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: reducedMotion ? 0 : d * 20 }),
                  visible: { opacity: 1, x: 0 },
                  exit: (d: number) => ({ opacity: 0, x: reducedMotion ? 0 : -d * 20 }),
                }}
                initial="enter"
                animate="visible"
                exit="exit"
                transition={{ duration: reducedMotion ? 0 : 0.16, ease: 'easeOut' }}
                onAnimationComplete={(definition) => {
                  if (definition === 'visible') {
                    if (focusedPath.current !== pathname) {
                      const heading = contentRef.current?.querySelector('h1');
                      heading?.focus({ preventScroll: true });
                      if (heading && window.matchMedia('(max-width: 767px)').matches) {
                        const bounds = heading.getBoundingClientRect();
                        if (bounds.top < 64 || bounds.bottom > window.innerHeight) {
                          heading.scrollIntoView({ block: 'center', behavior: 'instant' });
                        }
                      }
                    }
                    focusedPath.current = pathname;
                  }
                }}
              >
                {outlet}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </AuthShellContext.Provider>
    </AuthFrame>
  );
}
