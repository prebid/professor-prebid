import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FirstPartyDataComponent from './FirstPartyDataComponent';

window.HTMLElement.prototype.scrollIntoView = vi.fn();

const mockFloors: any = {
  floorMin: 0.5,
  data: { currency: 'USD', schema: { fields: ['mediaType'] }, values: {} },
};

describe('Popup FirstPartyDataComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the Floors Module card with title and "Floor Data" label', () => {
    render(<FirstPartyDataComponent floors={mockFloors} />);
    expect(screen.getByText('Floors Module')).toBeTruthy();
    expect(screen.getByText('Dynamic Floors')).toBeTruthy();
    expect(screen.getByText('Floor Data')).toBeTruthy();
  });

  it('does not show the JSON viewer when collapsed (default)', () => {
    render(<FirstPartyDataComponent floors={mockFloors} />);
    expect(screen.queryByText('floorMin')).toBeNull();
  });

  it('shows the JSON viewer after expanding via header click', () => {
    render(<FirstPartyDataComponent floors={mockFloors} />);

    const cardHeader = screen.getByText('Floors Module').closest('div') as HTMLElement;
    fireEvent.click(cardHeader);
    vi.runAllTimers();

    expect(screen.queryByText('floorMin') || screen.queryByText('"floorMin"')).toBeTruthy();
  });

  it('collapses again on second header click', () => {
    render(<FirstPartyDataComponent floors={mockFloors} />);

    const cardHeader = screen.getByText('Floors Module').closest('div') as HTMLElement;
    fireEvent.click(cardHeader);
    vi.runAllTimers();
    fireEvent.click(cardHeader);
    vi.runAllTimers();

    expect(screen.queryByText('floorMin')).toBeNull();
  });

  it('renders with undefined/null floors without crashing', () => {
    render(<FirstPartyDataComponent floors={undefined as any} />);
    expect(screen.getByText('Floor Data')).toBeTruthy();
  });
});
