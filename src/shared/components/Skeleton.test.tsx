import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton, CardSkeleton, CardGridSkeleton, CollectionRowSkeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders with shimmer animation class by default', () => {
    const { container } = render(<Skeleton className="h-10 w-10" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('animate-shimmer');
  });

  it('renders with animate-pulse when shimmer=false', () => {
    const { container } = render(<Skeleton shimmer={false} className="h-10 w-10" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain('animate-pulse');
    expect(el.className).not.toContain('animate-shimmer');
  });

  it('applies circular variant class', () => {
    const { container } = render(<Skeleton variant="circular" className="h-10 w-10" />);
    expect((container.firstChild as HTMLElement).className).toContain('rounded-full');
  });

  it('applies text variant class', () => {
    const { container } = render(<Skeleton variant="text" className="h-4 w-24" />);
    expect((container.firstChild as HTMLElement).className).toContain('rounded-sm');
  });

  it('has aria-hidden to exclude from screen readers', () => {
    const { container } = render(<Skeleton className="h-10 w-10" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('CardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<CardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('CardGridSkeleton', () => {
  it('renders the correct number of card skeletons', () => {
    const { container } = render(<CardGridSkeleton count={4} />);
    // Each CardSkeleton is a direct child div of the grid
    expect(container.firstChild?.childNodes.length).toBe(4);
  });

  it('defaults to 6 cards', () => {
    const { container } = render(<CardGridSkeleton />);
    expect(container.firstChild?.childNodes.length).toBe(6);
  });
});

describe('CollectionRowSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<CollectionRowSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
