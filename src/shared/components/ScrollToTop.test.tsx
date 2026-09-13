import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScrollToTop } from './ScrollToTop';

describe('ScrollToTop', () => {
  afterEach(() => vi.restoreAllMocks());

  it('resets the window scroll position after navigating to another route', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    render(
      <MemoryRouter initialEntries={['/cards/1']}>
        <ScrollToTop />
        <Routes>
          <Route path="/cards/1" element={<Link to="/cards/2">Next card</Link>} />
          <Route path="/cards/2" element={<p>Card two</p>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'Next card' }));

    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'auto' });
  });

  it('keeps intentional hash navigation anchored to its target', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    });

    render(
      <MemoryRouter initialEntries={['/home#explore-section']}>
        <ScrollToTop />
        <div id="explore-section">Explore</div>
      </MemoryRouter>,
    );

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
