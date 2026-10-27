import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NavBarReload } from './NavbarReload';
import { NavbarSelector } from './NavbarSelector';
import { NavBarTabs } from './NavbarTabs';
import AppStateContext from '../../contexts/appStateContext';
import OptionsContext from '../../contexts/optionsContext';
import InspectedPageContext from '../../contexts/inspectedPageContext';
import { MemoryRouter } from 'react-router-dom';

import { getTabId } from '../../utils';

(global as any).__APP_VERSION__ = '1.0.0';

vi.mock('../../utils', () => ({
  sendChromeTabsMessage: vi.fn(),
  getTabId: vi.fn().mockResolvedValue(123),
}));

describe('NavBar components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.chrome = {
      tabs: {
        reload: vi.fn().mockResolvedValue(undefined),
        create: vi.fn().mockResolvedValue(undefined),
      },
    } as any;
  });

  describe('NavBarReload', () => {
    it('renders default refresh icon and triggers tab reload on click', async () => {
      render(
        <InspectedPageContext.Provider value={{ downloading: 'false' } as any}>
          <NavBarReload />
        </InspectedPageContext.Provider>
      );

      const buttons = screen.getAllByRole('button');
      const helpBtn = buttons[0];
      const refreshBtn = buttons[1];

      fireEvent.click(helpBtn);
      expect(global.chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://github.com/prebid/professor-prebid/issues',
      });

      await act(async () => {
        fireEvent.click(refreshBtn);
      });
      expect(getTabId).toHaveBeenCalled();
      expect(global.chrome.tabs.reload).toHaveBeenCalledWith(123);
    });

    it('renders spinning icon when downloading is "true"', () => {
      render(
        <InspectedPageContext.Provider value={{ downloading: 'true' } as any}>
          <NavBarReload />
        </InspectedPageContext.Provider>
      );
      expect(screen.getByTestId('AutorenewIcon')).toBeTruthy();
    });

    it('renders error icon when downloading is "error"', () => {
      render(
        <InspectedPageContext.Provider value={{ downloading: 'error' } as any}>
          <NavBarReload />
        </InspectedPageContext.Provider>
      );
      expect(screen.getByTestId('ErrorOutlineIcon')).toBeTruthy();
    });
  });

  describe('NavbarSelector', () => {
    it('renders logo and handles mouse enter/leave expand in popup mode', () => {
      vi.useFakeTimers();
      const mockAppState: any = {
        isPanel: false,
        prebids: { pbjs: {}, pbjs2: {} },
        pbjsNamespace: 'pbjs',
        frameId: 'top-window',
      };

      const { container } = render(
        <AppStateContext.Provider value={mockAppState}>
          <NavbarSelector />
        </AppStateContext.Provider>
      );

      expect(screen.getByText('Professor')).toBeTruthy();

      const badge = container.querySelector('.MuiBadge-root')!;
      fireEvent.mouseEnter(badge);
      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(screen.getAllByText('Frame-ID')[0]).toBeTruthy();

      fireEvent.mouseEnter(badge);
      fireEvent.mouseLeave(badge);

      fireEvent.mouseEnter(badge);

      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(screen.getAllByText('Namespace')[0]).toBeTruthy();

      const form = container.querySelector('form')!;
      fireEvent.mouseLeave(form);
      act(() => {
        vi.advanceTimersByTime(250);
      });
      expect(screen.queryByText('Namespace')).toBeNull();

      vi.useRealTimers();
    });

    it('handles frameId and pbjsNamespace changes in panel mode', () => {
      const mockSetNamespace = vi.fn();
      const mockSetFrameId = vi.fn();
      const mockAppState: any = {
        isPanel: true,
        prebids: { pbjs: {}, pbjsCustom: {} },
        pbjsNamespace: 'pbjs',
        setPbjsNamespace: mockSetNamespace,
        frameId: 'top-window',
        setIframeId: mockSetFrameId,
      };
      const mockInspectedPage: any = {
        frames: {
          'top-window': {},
          'frame-1': {},
          downloading: {},
        },
      };

      render(
        <AppStateContext.Provider value={mockAppState}>
          <InspectedPageContext.Provider value={mockInspectedPage}>
            <NavbarSelector />
          </InspectedPageContext.Provider>
        </AppStateContext.Provider>
      );

      const comboboxes = screen.getAllByRole('combobox');

      fireEvent.mouseDown(comboboxes[0]);
      const frameOption = screen.getByText('frame-1');
      fireEvent.click(frameOption);
      expect(mockSetFrameId).toHaveBeenCalledWith('frame-1');

      fireEvent.mouseDown(comboboxes[1]);
      const nsOption = screen.getByText('pbjsCustom');
      fireEvent.click(nsOption);
      expect(mockSetNamespace).toHaveBeenCalledWith('pbjsCustom');
    });
  });

  describe('NavBarTabs', () => {
    it('NavBarTabs renders tabs from OptionsContext for popup and panel', () => {
      const mockOptions: any = {
        selectedPanelNavItems: ['', 'bids', 'config'],
        selectedPopUpNavItems: ['', 'bids'],
      };
      const mockAppState: any = { isPanel: true };

      render(
        <MemoryRouter>
          <AppStateContext.Provider value={mockAppState}>
            <OptionsContext.Provider value={mockOptions}>
              <NavBarTabs />
            </OptionsContext.Provider>
          </AppStateContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByText('Ad Units')).toBeTruthy();
      expect(screen.getByText('Bids')).toBeTruthy();
      expect(screen.getByText('Config')).toBeTruthy();

      const bidsBtn = screen.getByRole('link', { name: /Bids/i });
      act(() => {
        fireEvent.click(bidsBtn);
      });

      const tabs = screen.getAllByRole('tab');
      if (tabs.length > 1) {
        act(() => {
          fireEvent.click(tabs[1]);
        });
      }
    });

    it('NavBarTabs renders in popup mode with selectedPopUpNavItems', () => {
      const mockOptions: any = {
        selectedPanelNavItems: ['bids'],
        selectedPopUpNavItems: ['', 'preAuction'],
      };
      const mockAppState: any = { isPanel: false };

      render(
        <MemoryRouter>
          <AppStateContext.Provider value={mockAppState}>
            <OptionsContext.Provider value={mockOptions}>
              <NavBarTabs />
            </OptionsContext.Provider>
          </AppStateContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByText('Ad Units')).toBeTruthy();
      expect(screen.getByText('Pre-Auction')).toBeTruthy();

      const preAuctionBtn = screen.getByRole('link', { name: /Pre-Auction/i });
      act(() => {
        fireEvent.click(preAuctionBtn);
      });
    });
  });
});
