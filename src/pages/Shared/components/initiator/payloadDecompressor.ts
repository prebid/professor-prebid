export const decompressPayload = async (rawText: string): Promise<{ text: string; isDecompressed: boolean }> => {
  if (!rawText || typeof rawText !== 'string') {
    return { text: rawText || '', isDecompressed: false };
  }

  if (typeof DecompressionStream === 'undefined') {
    return { text: rawText, isDecompressed: false };
  }

  try {
    const bytes = new Uint8Array(rawText.length);
    for (let i = 0; i < rawText.length; i++) {
      bytes[i] = rawText.charCodeAt(i) & 0xff;
    }

    const decompressed = await tryDecompress(bytes);
    if (decompressed) {
      return { text: decompressed, isDecompressed: true };
    }
  } catch {}

  try {
    const trimmed = rawText.trim();
    if (/^[A-Za-z0-9+/=_-]+$/.test(trimmed) && trimmed.length > 20) {
      const normalizedBase64 = trimmed.replace(/-/g, '+').replace(/_/g, '/');
      const binStr = atob(normalizedBase64);
      const bytes = new Uint8Array(binStr.length);
      for (let i = 0; i < binStr.length; i++) {
        bytes[i] = binStr.charCodeAt(i) & 0xff;
      }
      const decompressed = await tryDecompress(bytes);
      if (decompressed) {
        return { text: decompressed, isDecompressed: true };
      }
    }
  } catch {}

  return { text: rawText, isDecompressed: false };
};

const tryDecompress = async (bytes: Uint8Array): Promise<string | null> => {
  const formats: CompressionFormat[] = ['gzip', 'deflate', 'deflate-raw'];

  for (const format of formats) {
    try {
      const ds = new DecompressionStream(format);
      const stream = new Response(new Blob([bytes.buffer as ArrayBuffer])).body?.pipeThrough(ds);
      if (stream) {
        const text = await new Response(stream).text();
        if (text && text.length > 0) {
          return text;
        }
      }
    } catch {}
  }
  return null;
};
