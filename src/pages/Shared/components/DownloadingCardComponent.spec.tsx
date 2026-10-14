import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DownloadingCardComponent from './DownloadingCardComponent';
import InspectedPageContext from '../contexts/inspectedPageContext';

vi.mock('../utils', () => ({ reloadPage: vi.fn() }));
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
vi.mock('@mui/material/IconButton', () => ({ default: ({ children }: any) => <button>{children}</button> }));
vi.mock('@mui/icons-material/RestartAlt', () => ({ default: () => <span>icon</span> }));
vi.mock('@mui/material', () => ({ CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div> }));
vi.mock('@mui/material/Typography', () => ({ default: ({ children }: any) => <span>{children}</span> }));

describe('DownloadingCardComponent', () => {
  it('renders downloading title', () => {
    render(
      <InspectedPageContext.Provider value={{ syncState: '', frames: {}, downloading: 'true', initReqChainResult: {} }}>
        <DownloadingCardComponent />
      </InspectedPageContext.Provider>
    );
    expect(screen.getByText('Downloading events...')).toBeTruthy();
  });

  it('renders syncState text', () => {
    render(
      <InspectedPageContext.Provider value={{ syncState: 'syncing 5/10', frames: {}, downloading: 'true', initReqChainResult: {} }}>
        <DownloadingCardComponent />
      </InspectedPageContext.Provider>
    );
    expect(screen.getByText('syncing 5/10')).toBeTruthy();
  });
});
