import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NoPrebidCardComponent from './NoPrebidCardComponent';

vi.mock('../utils', () => ({
  reloadPage: vi.fn(),
}));
vi.mock('@mui/material/Card', () => ({ default: ({ children }: any) => <div data-testid="card">{children}</div> }));
vi.mock('@mui/material/Box', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('@mui/material/CardHeader', () => ({
  default: ({ title, subheader }: any) => (
    <div data-testid="card-header">
      <span>{title}</span>
      <span>{subheader}</span>
    </div>
  ),
}));
vi.mock('@mui/material/IconButton', () => ({ default: ({ children, ...props }: any) => <button {...props}>{children}</button> }));
vi.mock('@mui/icons-material/RestartAlt', () => ({ default: () => <span>icon</span> }));

describe('NoPrebidCardComponent', () => {
  it('renders title text', () => {
    render(<NoPrebidCardComponent />);
    expect(screen.getByText('No Prebid.js detected on this page.')).toBeTruthy();
  });

  it('renders subheader text', () => {
    render(<NoPrebidCardComponent />);
    expect(screen.getByText('Try to scroll down or click here to refresh the page.')).toBeTruthy();
  });
});
