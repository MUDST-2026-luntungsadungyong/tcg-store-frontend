let activeLocks = 0;
let initialOverflow = '';

/** Each overlay releases only its own lock; closing order does not matter. */
export function acquireBodyScrollLock(): () => void {
  if (activeLocks === 0) initialOverflow = document.body.style.overflow;
  activeLocks += 1;
  document.body.style.overflow = 'hidden';
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeLocks -= 1;
    if (activeLocks === 0) document.body.style.overflow = initialOverflow;
  };
}
