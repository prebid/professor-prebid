import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProfPrebidLogo from './Logo';

describe('ProfPrebidLogo Component', () => {
  it('renders SVG with default props', () => {
    const { container } = render(<ProfPrebidLogo />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(screen.getByText('Professor')).toBeTruthy();
    expect(screen.getByText('Prebid')).toBeTruthy();
    expect(screen.getByText('v0.3')).toBeTruthy();
  });

  it('renders custom version, barColor, and textColor', () => {
    const { container } = render(<ProfPrebidLogo version="v1.0" barColor="#FF0000" textColor="#00FF00" />);
    expect(screen.getByText('v1.0')).toBeTruthy();
    const g = container.querySelector('g');
    expect(g?.getAttribute('fill')).toBe('#FF0000');
  });
});
