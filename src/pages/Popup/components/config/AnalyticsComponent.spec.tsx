import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AnalyticsComponent from './AnalyticsComponent';

const scrollIntoViewMock = vi.fn();
window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

const mockPrebid: any = { events: [], config: {} };

describe('AnalyticsComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the Analytics card with title and subtitle', () => {
    render(<AnalyticsComponent prebid={mockPrebid} />);
    expect(screen.getByText('Analytics')).toBeTruthy();
    expect(screen.getByText('subtitle')).toBeTruthy();
    expect(screen.getByText('Todo')).toBeTruthy();
  });

  it('renders the expand icon in the collapsed (default) state', () => {
    render(<AnalyticsComponent prebid={mockPrebid} />);
    const svgIcons = document.querySelectorAll('svg');
    expect(svgIcons.length).toBeGreaterThan(0);
  });

  it('calls scrollIntoView and toggles expand state on header click', () => {
    render(<AnalyticsComponent prebid={mockPrebid} />);

    const cardHeader = (screen.getByText('Analytics').closest('[class*="MuiCardHeader"]') as HTMLElement) || (screen.getByText('Analytics').parentElement as HTMLElement);

    fireEvent.click(cardHeader);
    vi.runAllTimers();
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });

    fireEvent.click(cardHeader);
    vi.runAllTimers();
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(2);
  });
});
