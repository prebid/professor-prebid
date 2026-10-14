import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorCardComponent from './ErrorCardComponent';
import InspectedPageContext from '../contexts/inspectedPageContext';

vi.mock('../utils', () => ({ reloadPage: vi.fn() }));
vi.mock('../../../assets/Logo', () => ({ default: () => <span>Logo</span> }));
vi.mock('@mui/material/Card', () => ({ default: ({ children }: any) => <div data-testid="card">{children}</div> }));
vi.mock('@mui/material/Box', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('@mui/material/CardHeader', () => ({
  default: ({ title, subheader }: any) => (
    <div data-testid="card-header">
      <span data-testid="title">{title}</span>
      <span data-testid="subheader">{subheader}</span>
    </div>
  ),
}));
vi.mock('@mui/material/CardContent', () => ({ default: ({ children }: any) => <div data-testid="card-content">{children}</div> }));
vi.mock('@mui/material/IconButton', () => ({ default: ({ children }: any) => <button>{children}</button> }));
vi.mock('@mui/material/Typography', () => ({ default: ({ children }: any) => <span>{children}</span> }));
vi.mock('@mui/icons-material/RestartAlt', () => ({ default: () => <span>icon</span> }));
vi.mock('@mui/material', () => ({ Avatar: ({ children }: any) => <div>{children}</div> }));

global.chrome = { tabs: { create: vi.fn() } } as any;

describe('ErrorCardComponent', () => {
  const renderWithContext = (error?: any, syncState = '') => {
    render(
      <InspectedPageContext.Provider value={{ syncState, frames: {}, downloading: 'false', initReqChainResult: {} }}>
        <ErrorCardComponent error={error} />
      </InspectedPageContext.Provider>
    );
  };

  it('renders error title', () => {
    renderWithContext();
    expect(screen.getByText('Oops! An Error Occurred')).toBeTruthy();
  });

  it('renders error message in subheader', () => {
    renderWithContext({ message: 'Something broke!' });
    expect(screen.getByText('Error Message: Something broke!')).toBeTruthy();
  });

  it('renders apology text', () => {
    renderWithContext();
    expect(screen.getByText(/apologize for the inconvenience/)).toBeTruthy();
  });

  it('renders syncState when no error message', () => {
    renderWithContext(null, 'state123');
    expect(screen.getByText('SyncState: state123')).toBeTruthy();
  });
});
