import { describe, expect, it } from 'vitest';
import { acquireBodyScrollLock } from './bodyScrollLock';

describe('acquireBodyScrollLock', () => {
  it('keeps overlapping overlays locked for out-of-order and repeated releases', () => {
    document.body.style.overflow = 'scroll';
    const releaseOuter = acquireBodyScrollLock();
    const releaseInner = acquireBodyScrollLock();
    expect(document.body.style.overflow).toBe('hidden');
    releaseOuter();
    releaseOuter();
    expect(document.body.style.overflow).toBe('hidden');
    releaseInner();
    expect(document.body.style.overflow).toBe('scroll');
    document.body.style.overflow = '';
  });
});
