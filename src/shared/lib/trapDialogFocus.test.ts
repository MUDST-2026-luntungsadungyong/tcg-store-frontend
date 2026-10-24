import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { trapDialogFocus } from './trapDialogFocus';

function setup() {
  const dialog = document.createElement('div');
  dialog.setAttribute('role', 'dialog');
  dialog.tabIndex = -1;
  dialog.innerHTML = '<button id="first">First</button><button disabled>Disabled</button><button hidden>Hidden</button><div aria-hidden="true"><button>Hidden parent</button></div><button id="last">Last</button>';
  document.body.append(dialog);
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue({ length: 1 } as DOMRectList);
  const first = dialog.querySelector<HTMLButtonElement>('#first')!;
  const last = dialog.querySelector<HTMLButtonElement>('#last')!;
  const tab = (target: HTMLElement, shiftKey = false) => {
    const preventDefault = vi.fn();
    const event = { key: 'Tab', target, currentTarget: dialog, shiftKey, preventDefault } as unknown as ReactKeyboardEvent<HTMLElement>;
    return { owned: trapDialogFocus(event), preventDefault };
  };
  return { dialog, first, last, tab };
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('trapDialogFocus', () => {
  it('wraps both boundaries while skipping disabled and hidden controls', () => {
    const { first, last, tab } = setup();
    last.focus();
    expect(tab(last).preventDefault).toHaveBeenCalledOnce();
    expect(first).toHaveFocus();
    expect(tab(first, true).preventDefault).toHaveBeenCalledOnce();
    expect(last).toHaveFocus();
  });

  it('moves initial dialog focus to the first or last control', () => {
    const { dialog, first, last, tab } = setup();
    dialog.focus();
    tab(dialog);
    expect(first).toHaveFocus();
    dialog.focus();
    tab(dialog, true);
    expect(last).toHaveFocus();
  });

  it('leaves events belonging to nested alertdialogs to the nested trap', () => {
    const { dialog, tab } = setup();
    const nested = document.createElement('div');
    nested.setAttribute('role', 'alertdialog');
    nested.innerHTML = '<button>Confirm</button>';
    dialog.append(nested);
    const confirm = nested.querySelector('button')!;
    confirm.focus();
    const result = tab(confirm);
    expect(result.owned).toBe(false);
    expect(result.preventDefault).not.toHaveBeenCalled();
    expect(confirm).toHaveFocus();
  });
});
