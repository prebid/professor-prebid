import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Logo from './Logo';

describe('Logo Component', () => {
  it('renders SVG with numeric width and height props', () => {
    const { container } = render(<Logo width={100} height={50} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 512000 512000');
  });

  it('renders SVG with string width and height props', () => {
    const { container } = render(<Logo width="100px" height="50px" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders all path elements inside svg', () => {
    const { container } = render(<Logo width={200} height={200} />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });
});
