import type { KeyboardEvent } from 'react';

/** Returns false for events belonging to a nested dialog, including React portals. */
export function trapDialogFocus(event: KeyboardEvent<HTMLElement>): boolean {
  const dialog = event.currentTarget;
  const target = event.target as HTMLElement;
  if (target.closest('[role="dialog"], [role="alertdialog"]') !== dialog) return false;
  if (event.key !== 'Tab') return true;

  const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
    'button, a[href], input, select, textarea, [tabindex]',
  )).filter((element) => element.tabIndex >= 0
    && !element.matches(':disabled')
    && !element.closest('[hidden], [inert], [aria-hidden="true"]')
    && element.getClientRects().length > 0);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (!first) {
    event.preventDefault();
    dialog.focus();
  } else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
    event.preventDefault();
    first.focus();
  }
  return true;
}
