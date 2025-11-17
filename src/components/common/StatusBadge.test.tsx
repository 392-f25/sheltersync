import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';


describe('StatusBadge', () => {
  it('renders "Open" text when status is "open"', () => {
    render(<StatusBadge status="open" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders "Limited" text when status is "limited"', () => {
    render(<StatusBadge status="limited" />);
    expect(screen.getByText('Limited')).toBeInTheDocument();
  });

  it('renders "Full" text when status is "full"', () => {
    render(<StatusBadge status="full" />);
    expect(screen.getByText('Full')).toBeInTheDocument();
  });

  it('renders a status indicator dot', () => {
    const { container } = render(<StatusBadge status="open" />);
    const dot = container.querySelector('.h-2.w-2.rounded-full');
    expect(dot).toBeInTheDocument();
  });

  it('applies correct classes for "open" status', () => {
    const { container } = render(<StatusBadge status="open" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-emerald-400/20');
    expect(badge.className).toContain('text-emerald-300');
  });

  it('applies correct classes for "limited" status', () => {
    const { container } = render(<StatusBadge status="limited" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-amber-400/20');
    expect(badge.className).toContain('text-amber-200');
  });

  it('applies correct classes for "full" status', () => {
    const { container } = render(<StatusBadge status="full" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-rose-500/30');
    expect(badge.className).toContain('text-rose-100');
  });
});

