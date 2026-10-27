import { describe, it, expect } from 'vitest';
import { decompressPayload } from './payloadDecompressor';

describe('payloadDecompressor', () => {
  it('returns raw text if input is empty or plain string', async () => {
    const plain = '{"id":"test-plain","imp":[]}';
    const result = await decompressPayload(plain);
    expect(result.text).toBe(plain);
    expect(result.isDecompressed).toBe(false);
  });

  it('decompresses gzipped binary string back to original JSON', async () => {
    const originalJson = JSON.stringify({
      id: 'criteo-auction-123',
      imp: [{ id: '1', banner: { w: 300, h: 250 } }],
      user: { id: 'criteo-user-abc' },
    });

    const cs = new CompressionStream('gzip');
    const encoder = new TextEncoder();
    const stream = new Response(encoder.encode(originalJson)).body?.pipeThrough(cs);
    const compressedBuffer = await new Response(stream).arrayBuffer();
    const compressedBytes = new Uint8Array(compressedBuffer);

    let binaryStr = '';
    for (let i = 0; i < compressedBytes.length; i++) {
      binaryStr += String.fromCharCode(compressedBytes[i]);
    }

    const decompressed = await decompressPayload(binaryStr);
    expect(decompressed.isDecompressed).toBe(true);
    expect(decompressed.text).toBe(originalJson);
  });

  it('decompresses base64-encoded gzipped string', async () => {
    const originalJson = JSON.stringify({
      id: 'criteo-b64-auction',
      site: { domain: 'example.com' },
    });

    const cs = new CompressionStream('gzip');
    const encoder = new TextEncoder();
    const stream = new Response(encoder.encode(originalJson)).body?.pipeThrough(cs);
    const compressedBuffer = await new Response(stream).arrayBuffer();
    const compressedBytes = new Uint8Array(compressedBuffer);

    let binaryStr = '';
    for (let i = 0; i < compressedBytes.length; i++) {
      binaryStr += String.fromCharCode(compressedBytes[i]);
    }
    const base64Str = btoa(binaryStr);

    const decompressed = await decompressPayload(base64Str);
    expect(decompressed.isDecompressed).toBe(true);
    expect(decompressed.text).toBe(originalJson);
  });
});
