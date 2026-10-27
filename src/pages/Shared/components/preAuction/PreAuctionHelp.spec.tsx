import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PreAuctionHelp from './PreAuctionHelp';
import { ATTRIBUTION_LABEL, verdictLabel } from './labels';
import { LandedVerdict } from './providerDiagnostics';

describe('PreAuctionHelp', () => {
  it('starts collapsed so it does not crowd the table', () => {
    render(<PreAuctionHelp />);
    expect(screen.getByText(/How this works/)).toBeTruthy();
    expect(screen.queryByText(/What this answers/)).toBeNull();
  });

  it('expands and collapses on click', () => {
    render(<PreAuctionHelp />);
    const header = screen.getByText(/How this works/);

    fireEvent.click(header);
    expect(screen.getByText(/What this answers/)).toBeTruthy();
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(header);
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false');
  });

  it('documents every verdict and attribution level the rows can show', () => {
    render(<PreAuctionHelp />);
    fireEvent.click(screen.getByText(/How this works/));

    (['landed', 'late', 'never', 'unknown'] as LandedVerdict[]).forEach((verdict) => {
      expect(screen.getByText(`#1 ${verdictLabel(verdict)}`)).toBeTruthy();
    });
    Object.values(ATTRIBUTION_LABEL).forEach((label) => {
      expect(screen.getByText(label)).toBeTruthy();
    });
  });

  it('explains both awaited states', () => {
    render(<PreAuctionHelp />);
    fireEvent.click(screen.getByText(/How this works/));
    expect(screen.getByText('awaited')).toBeTruthy();
    expect(screen.getByText('NOT awaited')).toBeTruthy();
  });
});
