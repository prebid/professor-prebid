import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NetworkDetailDrawer } from './NetworkDetailDrawer';
import { IClassifiedNetworkEntry, classifyRequest } from './networkClassifier';
import { IHarLogEntry } from '../../../Devtools/harLog';

describe('NetworkDetailDrawer', () => {
  const sampleEntry: IHarLogEntry = {
    id: 'req_123',
    url: 'https://ib.adnxs.com/ut/v3/prebid?gdpr=1&gdpr_consent=CP12345&us_privacy=1YNN',
    host: 'ib.adnxs.com',
    pathname: '/ut/v3/prebid',
    method: 'POST',
    status: 200,
    statusText: 'OK',
    startedDateTime: 1000,
    time: 150.5,
    resourceType: 'fetch',
    contentSize: 2048,
    redirectURL: 'https://ib.adnxs.com/redirect',
    queryString: [
      { name: 'gdpr', value: '1' },
      { name: 'gdpr_consent', value: 'CP12345' },
      { name: 'nested', value: 'https%3A%2F%2Fexample.com%2Fcb' },
    ],
    requestHeaders: [{ name: 'Content-Type', value: 'application/json' }],
    responseHeaders: [{ name: 'Cache-Control', value: 'no-store' }],
    requestCookies: [{ name: 'uid', value: '12345' }],
    responseCookies: [{ name: 'sess', value: 'abc' }],
    postData: {
      text: '{"tags":[{"id":1}]}',
      mimeType: 'application/json',
    },
    timings: { dns: 10, connect: 20, wait: 100, receive: 20.5 },
    initiator: {
      type: 'script',
      url: 'https://cdn.example.com/prebid.js',
      stack: {
        callFrames: [{ functionName: 'requestBids', scriptId: '1', url: 'https://cdn.example.com/prebid.js', lineNumber: 42, columnNumber: 10 }],
      },
    },
  };

  const classified: IClassifiedNetworkEntry = classifyRequest(sampleEntry);

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn(),
      },
      configurable: true,
      writable: true,
    });
  });

  it('renders nothing open when selectedEntry is null', () => {
    const { container } = render(<NetworkDetailDrawer selectedEntry={null} onClose={vi.fn()} />);
    expect(screen.queryByText('General Information')).toBeNull();
  });

  it('renders overview tab with details, timings, and copy button', () => {
    const onClose = vi.fn();
    render(<NetworkDetailDrawer selectedEntry={classified} onClose={onClose} />);

    expect(screen.getByText('General Information')).toBeTruthy();
    expect(screen.getByText('ib.adnxs.com')).toBeTruthy();
    expect(screen.getByText('/ut/v3/prebid')).toBeTruthy();
    expect(screen.getByText('Timing Breakdown')).toBeTruthy();
    expect(screen.getByText('100 ms')).toBeTruthy();

    const copyBtns = screen.getAllByRole('button');
    fireEvent.click(copyBtns[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('navigates through all tabs: Privacy, Query Params, Headers, Payload, Cookies, and Initiator Stack', () => {
    const onClose = vi.fn();
    render(<NetworkDetailDrawer selectedEntry={classified} onClose={onClose} />);

    const privacyTab = screen.getByRole('tab', { name: /Privacy/i });
    fireEvent.click(privacyTab);
    expect(screen.getByText('TCF Consent String (gdpr_consent)')).toBeTruthy();

    const paramsTab = screen.getByRole('tab', { name: /Query Params/i });
    fireEvent.click(paramsTab);
    expect(screen.getByText('nested')).toBeTruthy();
    expect(screen.getByText(/URL Decoded:/)).toBeTruthy();

    const filterInput = screen.getByPlaceholderText('Search query parameters...');
    fireEvent.change(filterInput, { target: { value: 'gdpr' } });
    expect(screen.getByText('gdpr_consent')).toBeTruthy();

    const headersTab = screen.getByRole('tab', { name: /Headers/i });
    fireEvent.click(headersTab);
    expect(screen.getByText('Request Headers (1)')).toBeTruthy();
    expect(screen.getByText('Response Headers (1)')).toBeTruthy();

    const payloadTab = screen.getByRole('tab', { name: /Payload/i });
    fireEvent.click(payloadTab);
    expect(screen.getByText('MIME: application/json')).toBeTruthy();

    const cookiesTab = screen.getByRole('tab', { name: /Cookies/i });
    fireEvent.click(cookiesTab);
    expect(screen.getByText('Request Cookies (1)')).toBeTruthy();
    expect(screen.getByText('Response Cookies / Set-Cookie (1)')).toBeTruthy();

    const stackTab = screen.getByRole('tab', { name: /Initiator Stack/i });
    fireEvent.click(stackTab);
    expect(screen.getByText('requestBids')).toBeTruthy();
    expect(screen.getByText(/https:\/\/cdn.example.com\/prebid.js:42:10/)).toBeTruthy();
  });

  it('decompresses gzipped payloads and displays unzipped badge and toggle', async () => {
    const rawJson = JSON.stringify({ id: 'criteo-decompressed-test', imp: [{ id: '1' }] });
    const cs = new CompressionStream('gzip');
    const stream = new Response(new TextEncoder().encode(rawJson)).body?.pipeThrough(cs);
    const compressedBuffer = await new Response(stream).arrayBuffer();
    const bytes = new Uint8Array(compressedBuffer);
    let binStr = '';
    for (let i = 0; i < bytes.length; i++) {
      binStr += String.fromCharCode(bytes[i]);
    }

    const gzippedEntry: IClassifiedNetworkEntry = classifyRequest({
      ...sampleEntry,
      id: 'req_criteo',
      postData: { text: binStr, mimeType: 'text/plain' },
    });

    render(<NetworkDetailDrawer selectedEntry={gzippedEntry} onClose={vi.fn()} />);

    const payloadTab = screen.getByRole('tab', { name: /Payload/i });
    fireEvent.click(payloadTab);

    const badge = await screen.findByText(/Auto-Unzipped/i);
    expect(badge).toBeTruthy();

    const toggleBtn = screen.getByRole('button', { name: /Show Raw Compressed/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByRole('button', { name: /Show Unzipped JSON/i })).toBeTruthy();
  });
});
