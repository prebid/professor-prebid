import React from 'react';
import { render, screen, fireEvent} from '@testing-library/react';
import { describe, it, expect, vi} from 'vitest';
import AdUnitsComponent from './AdUnitsComponent';
import { HeaderGridItem } from './AdUnitsGridComponent';
import AppStateContext from '../../contexts/appStateContext';

import * as utils from '../../utils';

vi.spyOn(utils, 'download').mockImplementation(() => {});

describe('AdUnitsComponent & Grid', () => {
  const mockContext: any = {
    isPanel: true,
    prebid: { version: '8.0.0', events: [] },
    prebidReleaseInfo: { latestVersion: '8.0.0', versions: [] },
    allAdUnitCodes: ['unit-1'],
    allBidderEvents: ['rubicon'],
    allBidResponseEvents: [],
    allNoBidEvents: [],
    auctionEndEvents: [],
    bidderWonEvents: [],
    allWinningBids: [],
    allBidRequestedEvents: [],
    adsRendered: [],
    googleAdManager: {
      slots: [{ name: 'unit-1', elementId: 'unit-1' }],
    },
    auctionInitEvents: [
      {
        args: {
          adUnits: [
            {
              code: 'unit-1',
              sizes: [[300, 250]],
              mediaTypes: {
                banner: { sizes: [[300, 250]] },
                video: { playerSize: [[640, 480]] },
              },
              bids: [{ bidder: 'rubicon', params: {} }],
              ortb2Imp: { ext: { gpid: '/123/slot' } },
            },
          ],
        },
      },
    ],
  };

  it('renders AdUnitsComponent with version info, headers, and ad units', () => {
    render(
      <AppStateContext.Provider value={mockContext}>
        <AdUnitsComponent />
      </AppStateContext.Provider>
    );

    expect(screen.getByText(/Version: 8.0.0/)).toBeTruthy();
    expect(screen.getAllByText('unit-1').length).toBeGreaterThan(0);
    expect(screen.getByText('Ad Server')).toBeTruthy();
    expect(screen.getByText('OpenRtb2 Imp')).toBeTruthy();
  });

  it('handles filtering in search bar and empty results', () => {
    render(
      <AppStateContext.Provider value={mockContext}>
        <AdUnitsComponent />
      </AppStateContext.Provider>
    );

    const input = screen.getByPlaceholderText('Filter Ad Units...');
    fireEvent.change(input, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No matching adunits')).toBeTruthy();
  });

  it('triggers download button click', () => {
    render(
      <AppStateContext.Provider value={mockContext}>
        <AdUnitsComponent />
      </AppStateContext.Provider>
    );

    const downloadBtn = screen.getByLabelText('Download filtered bids as JSON');
    fireEvent.click(downloadBtn);

    expect(utils.download).toHaveBeenCalled();
  });

  it('opens PBJS version popup on version cell click', () => {
    render(
      <AppStateContext.Provider value={mockContext}>
        <AdUnitsComponent />
      </AppStateContext.Provider>
    );

    const versionCell = screen.getByText(/Version: 8.0.0/);
    fireEvent.click(versionCell);
  });

  it('renders HeaderGridItem with tooltip and click handler', () => {
    const onClick = vi.fn();
    render(<HeaderGridItem label="Custom Header" tooltip="Header tooltip" onClick={onClick} xs={4} />);

    const header = screen.getByText('Custom Header');
    expect(header).toBeTruthy();
    fireEvent.click(header);
    expect(onClick).toHaveBeenCalled();

    render(
      <HeaderGridItem>
        <div>Child Content</div>
      </HeaderGridItem>
    );
    expect(screen.getByText('Child Content')).toBeTruthy();
  });
});
