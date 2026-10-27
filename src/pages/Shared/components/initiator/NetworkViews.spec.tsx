import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NetworkWaterfallView } from './NetworkWaterfallView';
import { NetworkCascadeView } from './NetworkCascadeView';
import { NetworkPrivacyAuditView } from './NetworkPrivacyAuditView';
import { classifyRequest, IClassifiedNetworkEntry } from './networkClassifier';
import { IHarLogEntry } from '../../../Devtools/harLog';

describe('Network Views', () => {
  const entries: IClassifiedNetworkEntry[] = [
    classifyRequest({
      id: 'req_1',
      url: 'https://ib.adnxs.com/ut/v3/prebid',
      host: 'ib.adnxs.com',
      pathname: '/ut/v3/prebid',
      method: 'POST',
      status: 200,
      startedDateTime: 1000,
      time: 150,
      queryString: [
        { name: 'gdpr', value: '1' },
        { name: 'gdpr_consent', value: 'CP12345' },
      ],
    } as IHarLogEntry),
    classifyRequest({
      id: 'req_2',
      url: 'https://sync.rubiconproject.com/usersync',
      host: 'sync.rubiconproject.com',
      pathname: '/usersync',
      method: 'GET',
      status: 302,
      redirectURL: 'https://pixel.rubiconproject.com/tap',
      startedDateTime: 1050,
      time: 40,
      queryString: [{ name: 'us_privacy', value: '1YNN' }],
    } as IHarLogEntry),
    classifyRequest({
      id: 'req_3',
      url: 'https://pixel.rubiconproject.com/tap',
      host: 'pixel.rubiconproject.com',
      pathname: '/tap',
      method: 'GET',
      status: 200,
      startedDateTime: 1090,
      time: 25,
    } as IHarLogEntry),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('NetworkWaterfallView', () => {
    it('renders empty fallback when entries are empty', () => {
      render(<NetworkWaterfallView entries={[]} selectedEntry={null} onSelectEntry={vi.fn()} />);
      expect(screen.getByText('No network requests matched your search criteria.')).toBeTruthy();
    });

    it('renders table rows and handles row selection', () => {
      const onSelect = vi.fn();
      render(<NetworkWaterfallView entries={entries} selectedEntry={null} onSelectEntry={onSelect} />);

      expect(screen.getByText('ib.adnxs.com')).toBeTruthy();
      expect(screen.getByText('sync.rubiconproject.com')).toBeTruthy();

      fireEvent.click(screen.getByText('ib.adnxs.com'));
      expect(onSelect).toHaveBeenCalledWith(entries[0]);
    });
  });

  describe('NetworkCascadeView', () => {
    it('renders tree cascade with redirect relationships and filter input', () => {
      const onSelect = vi.fn();
      render(<NetworkCascadeView entries={entries} selectedEntry={null} onSelectEntry={onSelect} />);

      expect(screen.getByText('sync.rubiconproject.com')).toBeTruthy();
      expect(screen.getByText('pixel.rubiconproject.com')).toBeTruthy();
      expect(screen.getByText('Redirect ➔')).toBeTruthy();

      const filterInput = screen.getByPlaceholderText(/Filter tree cascade/i);
      fireEvent.change(filterInput, { target: { value: 'adnxs' } });
      expect(screen.getByText('ib.adnxs.com')).toBeTruthy();
      expect(screen.queryByText('sync.rubiconproject.com')).toBeNull();

      const clearChip = screen.getByText('Clear Filter');
      fireEvent.click(clearChip);
      expect(screen.getByText('sync.rubiconproject.com')).toBeTruthy();
    });
  });

  describe('NetworkPrivacyAuditView', () => {
    it('renders empty fallback when entries are empty', () => {
      render(<NetworkPrivacyAuditView entries={[]} selectedEntry={null} onSelectEntry={vi.fn()} />);
      expect(screen.getByText('No network requests found.')).toBeTruthy();
    });

    it('renders privacy audit table with verdicts and US Privacy / TCF columns', () => {
      const onSelect = vi.fn();
      render(<NetworkPrivacyAuditView entries={entries} selectedEntry={null} onSelectEntry={onSelect} />);

      expect(screen.getByText('Endpoint & Provider')).toBeTruthy();
      expect(screen.getByText('TCF Consent (GDPR)')).toBeTruthy();
      expect(screen.getByText('US Privacy')).toBeTruthy();
      expect(screen.getByText('1YNN')).toBeTruthy();

      fireEvent.click(screen.getByText('1YNN'));
      expect(onSelect).toHaveBeenCalled();
    });
  });
});
