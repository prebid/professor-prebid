import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InfoItem } from './InfoItem';

vi.mock('@mui/material', () => ({
  Typography: ({ children, ...props }: any) => (
    <p data-testid="typography" {...props}>
      {children}
    </p>
  ),
}));

describe('InfoItem', () => {
  it('renders label and content', () => {
    render(<InfoItem label="Version" content="8.0.0" />);
    expect(screen.getByText('Version:')).toBeTruthy();
    expect(screen.getByText('8.0.0')).toBeTruthy();
  });

  it('returns null when content is empty', () => {
    const { container } = render(<InfoItem label="Test" content={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when content is empty object', () => {
    const { container } = render(<InfoItem label="Test" content={{}} />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when label is empty', () => {
    const { container } = render(<InfoItem label={null} content="data" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders link when href is provided', () => {
    render(<InfoItem label="Link" content="Click me" href="https://example.com" />);
    const link = screen.getByText('Click me');
    expect(link.closest('a')).toBeTruthy();
    expect(link.closest('a')?.getAttribute('href')).toBe('https://example.com');
  });
});
