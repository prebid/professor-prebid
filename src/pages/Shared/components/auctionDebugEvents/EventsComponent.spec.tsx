import React from 'react';
import { render, screen, fireEvent} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventsComponent from './EventsComponent';
import AppStateContext from '../../contexts/appStateContext';
import { EVENT_FIELD_MAP } from './EventsState';

import * as utils from '../../utils';

vi.spyOn(utils, 'download').mockImplementation(() => {});

describe('EventsComponent & EventsState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEvents: any = [
    {
      eventType: 'auctionInit',
      elapsedTime: 10,
      args: { auctionId: '1234567890', adUnitCodes: ['slot-1'] },
    },
    {
      eventType: 'auctionDebug',
      elapsedTime: 20,
      args: { type: 'WARNING', arguments: { msg: 'Slow bidder response' } },
    },
    {
      eventType: 'auctionDebug',
      elapsedTime: 30,
      args: { type: 'ERROR', message: 'Fatal auction error' },
    },
    {
      eventType: 'bidResponse',
      elapsedTime: 40,
      args: { bidderCode: 'rubicon', cpm: 2.5, adUnitCode: 'slot-1' },
    },
    {
      eventType: 'bidRequested',
      elapsedTime: 50,
      args: { bidderCode: 'rubicon', bids: [{ adUnitCode: 'slot-1' }] },
    },
    {
      eventType: 'bidWon',
      elapsedTime: 60,
      args: { bidder: 'rubicon', cpm: 2.5, adUnitCode: 'slot-1' },
    },
    {
      eventType: 'auctionDebug',
      elapsedTime: 70,
      args: { type: 'INFO', message: 'Info log' },
    },
    {
      eventType: 'adRenderFailed',
      elapsedTime: 80,
      args: { reason: 'timeout', slot: 'top', detail: { code: 1 } },
    },
    {
      eventType: 'adRenderSucceeded',
      elapsedTime: 90,
      args: { doc: 'iframe' },
    },
  ];

  const mockContext: any = {
    prebid: { events: mockEvents },
  };

  it('renders events stream with correct chips, summary text, and expansion', () => {
    render(
      <AppStateContext.Provider value={mockContext}>
        <EventsComponent />
      </AppStateContext.Provider>
    );

    expect(screen.getByText(/Events: 9/)).toBeTruthy();
    expect(screen.getByText(/Warning: 1/)).toBeTruthy();
    expect(screen.getByText(/Error: 1/)).toBeTruthy();

    expect(screen.getByText('+10ms')).toBeTruthy();
    expect(screen.getByText('WARNING')).toBeTruthy();
    expect(screen.getByText('ERROR')).toBeTruthy();
    expect(screen.getAllByText(/rubicon — \$2.5 — slot-1/).length).toBeGreaterThan(0);

    const eventRow = screen.getAllByText(/rubicon — \$2.5 — slot-1/)[0];
    fireEvent.click(eventRow);

    expect(screen.getByText(/"event\[3\]"/)).toBeTruthy();
  });

  it('handles quick filter button clicks', () => {
    render(
      <AppStateContext.Provider value={mockContext}>
        <EventsComponent />
      </AppStateContext.Provider>
    );

    const warningBtn = screen.getByText(/Warning: 1/);
    fireEvent.click(warningBtn);
    expect(screen.getByPlaceholderText('Filter events...')).toHaveValue('eventtype:auctionDebug argstype:WARNING');

    const errorBtn = screen.getByText(/Error: 1/);
    fireEvent.click(errorBtn);
    expect(screen.getByPlaceholderText('Filter events...')).toHaveValue('eventtype:auctionDebug argstype:ERROR');

    const eventBtn = screen.getByText(/Events: 9/);
    fireEvent.click(eventBtn);
    expect(screen.getByPlaceholderText('Filter events...')).toHaveValue('');
  });

  it('toggles raw JSON view mode and triggers download', () => {
    render(
      <AppStateContext.Provider value={mockContext}>
        <EventsComponent />
      </AppStateContext.Provider>
    );

    const codeBtn = screen.getByLabelText('Switch to raw JSON view');
    fireEvent.click(codeBtn);

    expect(screen.getByText(/9 Events/)).toBeTruthy();

    const downloadBtn = screen.getByLabelText('Download filtered events as JSON');
    fireEvent.click(downloadBtn);

    expect(utils.download).toHaveBeenCalledWith(expect.any(Array), 'filtered-events');
  });

  it('handles search query with no matching events', () => {
    render(
      <AppStateContext.Provider value={mockContext}>
        <EventsComponent />
      </AppStateContext.Provider>
    );

    const input = screen.getByPlaceholderText('Filter events...');
    fireEvent.change(input, { target: { value: 'nonexistent' } });

    expect(screen.getByText('No matching events')).toBeTruthy();
  });

  it('tests EVENT_FIELD_MAP getters', () => {
    const event: any = {
      eventType: 'auctionDebug',
      elapsedTime: '25',
      args: {
        type: 'WARNING',
        arguments: { 0: 'Warning', 1: 'message' },
      },
    };

    expect(EVENT_FIELD_MAP.eventtype(event)).toBe('auctionDebug');
    expect(EVENT_FIELD_MAP.elapsedtime(event)).toBe(25);
    expect(EVENT_FIELD_MAP.argstype(event)).toBe('WARNING');
    expect(EVENT_FIELD_MAP.argsarguments(event)).toEqual({ 0: 'Warning', 1: 'message' });
    expect(EVENT_FIELD_MAP.argsmessage(event)).toBe('Warning message');
  });
});
