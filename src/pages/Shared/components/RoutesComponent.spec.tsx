import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RoutesComponent from './RoutesComponent';

vi.mock('./adUnits/AdUnitsComponent', () => ({ default: () => <div data-testid="adunits">AdUnits</div> }));
vi.mock('./userIds/UserIdsComponent', () => ({ default: () => <div data-testid="userids">UserIds</div> }));
vi.mock('./config/ConfigComponent', () => ({ default: () => <div data-testid="config">Config</div> }));
vi.mock('./timeline/TimeLineComponent', () => ({ default: () => <div data-testid="timeline">Timeline</div> }));
vi.mock('./bids/BidsComponent', () => ({ default: () => <div data-testid="bids">Bids</div> }));
vi.mock('./tools/ToolsComponent', () => ({ default: () => <div data-testid="tools">Tools</div> }));
vi.mock('./auctionDebugEvents/EventsComponent', () => ({ default: () => <div data-testid="events">Events</div> }));
vi.mock('./initiator/InitiatorComponent', () => ({ default: () => <div data-testid="initiator">Init</div> }));
vi.mock('./pbjsVersionInfo/PbjsVersionInfoComponent', () => ({ default: () => <div data-testid="version">Version</div> }));

describe('RoutesComponent', () => {
  it('renders AdUnitsComponent at root /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <RoutesComponent />
      </MemoryRouter>
    );
    expect(screen.getByTestId('adunits')).toBeTruthy();
  });

  it('renders BidsComponent at /bids', () => {
    render(
      <MemoryRouter initialEntries={['/bids']}>
        <RoutesComponent />
      </MemoryRouter>
    );
    expect(screen.getByTestId('bids')).toBeTruthy();
  });

  it('renders ConfigComponent at /config', () => {
    render(
      <MemoryRouter initialEntries={['/config']}>
        <RoutesComponent />
      </MemoryRouter>
    );
    expect(screen.getByTestId('config')).toBeTruthy();
  });

  it('renders TimelineComponent at /timeline', () => {
    render(
      <MemoryRouter initialEntries={['/timeline']}>
        <RoutesComponent />
      </MemoryRouter>
    );
    expect(screen.getByTestId('timeline')).toBeTruthy();
  });

  it('renders ToolsComponent at /tools', () => {
    render(
      <MemoryRouter initialEntries={['/tools']}>
        <RoutesComponent />
      </MemoryRouter>
    );
    expect(screen.getByTestId('tools')).toBeTruthy();
  });

  it('renders UserIdsComponent at /userId', () => {
    render(
      <MemoryRouter initialEntries={['/userId']}>
        <RoutesComponent />
      </MemoryRouter>
    );
    expect(screen.getByTestId('userids')).toBeTruthy();
  });

  it('renders VersionInfoComponent at /version', () => {
    render(
      <MemoryRouter initialEntries={['/version']}>
        <RoutesComponent />
      </MemoryRouter>
    );
    expect(screen.getByTestId('version')).toBeTruthy();
  });
});
