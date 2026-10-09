import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConditionLabel } from './ConditionLabel';

describe('ConditionLabel', () => {
  it('renders standard abbreviation as full name', () => {
    render(<ConditionLabel condition="NM" />);
    expect(screen.getByText('Near Mint')).toBeInTheDocument();
  });

  it('renders LP, MP, HP, DMG as full names', () => {
    const { rerender } = render(<ConditionLabel condition="LP" />);
    expect(screen.getByText('Lightly Played')).toBeInTheDocument();

    rerender(<ConditionLabel condition="MP" />);
    expect(screen.getByText('Moderately Played')).toBeInTheDocument();

    rerender(<ConditionLabel condition="HP" />);
    expect(screen.getByText('Heavily Played')).toBeInTheDocument();

    rerender(<ConditionLabel condition="DMG" />);
    expect(screen.getByText('Damaged')).toBeInTheDocument();
  });

  it('preserves custom graded labels without alteration', () => {
    render(<ConditionLabel condition="PSA 10 Gem Mint" />);
    expect(screen.getByText('PSA 10 Gem Mint')).toBeInTheDocument();
  });

  it('falls back to "Not specified" when condition is empty or undefined', () => {
    const { rerender } = render(<ConditionLabel condition="" />);
    expect(screen.getByText('Not specified')).toBeInTheDocument();

    rerender(<ConditionLabel condition={undefined} />);
    expect(screen.getByText('Not specified')).toBeInTheDocument();

    rerender(<ConditionLabel condition={null} />);
    expect(screen.getByText('Not specified')).toBeInTheDocument();
  });

  it('allows custom fallback text', () => {
    render(<ConditionLabel condition={null} fallback="Unspecified Condition" />);
    expect(screen.getByText('Unspecified Condition')).toBeInTheDocument();
  });

  it('renders in text mode without badge border classes when variant is text', () => {
    render(<ConditionLabel condition="NM" variant="text" />);
    const el = screen.getByText('Near Mint');
    expect(el).toBeInTheDocument();
  });
});
