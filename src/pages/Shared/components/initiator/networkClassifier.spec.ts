import { describe, it, expect } from 'vitest';
import { classifyRequest, decodeTcfString, auditPrivacy} from './networkClassifier';
import { IHarLogEntry, toLogEntry } from '../../../Devtools/harLog';

describe('networkClassifier', () => {
  describe('decodeTcfString', () => {
    it('returns undefined for invalid or empty strings', () => {
      expect(decodeTcfString('')).toBeUndefined();
      expect(decodeTcfString('abc')).toBeUndefined();
      expect(decodeTcfString(undefined)).toBeUndefined();
      expect(decodeTcfString('not-a-valid-tcf-string')).toBeUndefined();
    });

    it('decodes a valid TCF v2.2 test string', () => {
      const tcfString = 'CP12345AP12345ABAAENA9CAAP_AAH_AAAAAGVwBgAAA';
      const result = decodeTcfString(tcfString);

      if (result) {
        expect(result.version).toBeDefined();
        expect(Array.isArray(result.purposeConsents)).toBe(true);
      }
    });
  });

  describe('auditPrivacy', () => {
    it('detects valid US Privacy string', () => {
      const audit = auditPrivacy({ us_privacy: '1YNN' }, {});
      expect(audit.usPrivacy).toBe('1YNN');
      expect(audit.verdict).toBe('valid');
      expect(audit.verdictReason).toContain('US Privacy');
    });

    it('detects missing consent when gdpr=1 without consent string', () => {
      const audit = auditPrivacy({ gdpr: '1' }, {});
      expect(audit.hasGdpr).toBe(true);
      expect(audit.verdict).toBe('missing');
      expect(audit.verdictReason).toContain('GDPR applies');
    });

    it('detects GPP parameters', () => {
      const audit = auditPrivacy({ gpp: 'DBABMA~...', gpp_sid: '2,6' }, {});
      expect(audit.gpp).toBe('DBABMA~...');
      expect(audit.gppSid).toBe('2,6');
      expect(audit.verdict).toBe('valid');
    });

    it('detects Global Privacy Control header', () => {
      const audit = auditPrivacy({}, { 'sec-gpc': '1' });
      expect(audit.gpc).toBe('1');
      expect(audit.verdict).toBe('valid');
    });

    it('detects gdprstring used by Criteo', () => {
      const audit = auditPrivacy({ gdprstring: 'CQPMXQAQPMXQAFUABAENCsFsAP_AAH_AAAAAGVwBgAAA', gdpr: '1' }, {});
      expect(audit.gdprConsent).toBe('CQPMXQAQPMXQAFUABAENCsFsAP_AAH_AAAAAGVwBgAAA');
      expect(audit.hasGdpr).toBe(true);
      expect(['valid', 'warning']).toContain(audit.verdict);
    });

    it('extracts privacy parameters from JSON post body', () => {
      const postText = JSON.stringify({
        regs: { ext: { gdpr: 1, us_privacy: '1YNN', gpp: 'DBABMA', gpp_sid: [2] } },
        user: { ext: { consent: 'CP123' } },
      });
      const audit = auditPrivacy({}, {}, postText);
      expect(audit.gdpr).toBe('1');
      expect(audit.usPrivacy).toBe('1YNN');
      expect(audit.gpp).toBe('DBABMA');
      expect(audit.gppSid).toBe('2');
      expect(audit.gdprConsent).toBe('CP123');
    });

    it('extracts privacy parameters from decompressedPostText when raw postText is binary', () => {
      const decompressedText = JSON.stringify({
        regs: { ext: { gdpr: 1, gpp: 'DBAA', gpp_sid: [-1] } },
        user: { ext: { consent: 'CQPMXQAQPMXQAFUABAENCsFsAP_AAH_AAAAAGVwBgAAA' } },
      });
      const binaryRawPostText = '\x1f\x8b\x08...binary-gibberish';
      const audit = auditPrivacy({}, {}, binaryRawPostText, decompressedText);
      expect(audit.gdpr).toBe('1');
      expect(audit.gpp).toBe('DBAA');
      expect(audit.gppSid).toBe('-1');
      expect(audit.gdprConsent).toBe('CQPMXQAQPMXQAFUABAENCsFsAP_AAH_AAAAAGVwBgAAA');
      expect(['valid', 'warning']).toContain(audit.verdict);
    });

    // A real TC string (CMP 31, vendor list 126).
    const REAL_TC_STRING = 'CPXxRfAPXxRfAAfKABENB-CgAAAAAAAAAAYgAAAAAAAA';

    it('auto-detects TCF string in arbitrary query parameter key without known name', () => {
      const audit = auditPrivacy({ custom_vendor_consent_param: REAL_TC_STRING }, {});
      expect(audit.gdprConsent).toBe(REAL_TC_STRING);
      expect(audit.hasGdpr).toBe(true);
      expect(audit.verdict).toBe('valid');
    });

    it('does not take unrelated ids starting with C for a consent string', () => {
      const query = { gclid: 'Cj0KCQjw2a6wBhCVARIsABPeH1sAbcdEFGhijkl', sig: 'CAESEJx3kq0Bn2Vt8sY9LmH5aQo' };
      const audit = auditPrivacy(query, {}, '{"id":"CABCDEFGHIJKLMNOPQRSTUVWXYZ012345"}');
      expect(audit.gdprConsent).toBeUndefined();
      expect(audit.hasGdpr).toBe(false);
      expect(audit.verdict).toBe('none');
    });

    it('finds a real consent string in a body after an unrelated C token', () => {
      const audit = auditPrivacy({}, {}, `token=CABCDEFGHIJKLMNOPQRSTUVWXYZ012345&tc=${REAL_TC_STRING}`);
      expect(audit.gdprConsent).toBe(REAL_TC_STRING);
      expect(audit.verdict).toBe('valid');
    });

    it('returns warning verdict when consent string cannot be decoded as TCF', () => {
      const audit = auditPrivacy({ gdpr: '1', gdpr_consent: 'CiQwMTlmZGMxMi0wNjY5LTcxNDEtOWU1Ny02ZWY5M2M3MzVjZDYQBBocCTkEgPA' }, {});
      expect(audit.hasGdpr).toBe(true);
      expect(audit.verdict).toBe('warning');
      expect(audit.verdictReason).toContain('could not be parsed');
    });

    it('still flags a malformed consent string when the page has a CMP', () => {
      const cmp = 'CPXxRfAPXxRfAAfKABENB-CgAAAAAAAAAAYgAAAAAAAA';
      const audit = auditPrivacy({ gdpr: '1', gdpr_consent: 'CiQwMTlmZGMxMi0wNjY5LTcxNDEtOWU1Ny02ZWY5M2M3MzVjZDYQBBocCTkEgPA' }, {}, undefined, undefined, cmp);
      expect(audit.verdict).toBe('warning');
    });

    it('uses the CMP decode when the request carries a segment of the CMP string', () => {
      const core = 'CPXxRfAPXxRfAAfKABENB-CgAAAAAAAAAAYgAAAAAAAA';
      const segment = 'IFoEUQQgAIQwgIwQABAEAAAAOIAACAIAAAAQAIAgEAACEAAAAAgAQBAAAAAAAGBAAgAAAAAAAFAAECAAAgAAQARAEQAAAAAJAAIAAgAAAYQEAAAQmAgBC3ZAYzUw';
      const audit = auditPrivacy({ gdpr: '1', gdprstring: segment }, {}, undefined, undefined, `${core}.${segment}`);
      expect(audit.gdprConsent).toBe(segment);
      expect(audit.verdict).toBe('valid');
    });
  });

  describe('classifyRequest', () => {
    // A Prebid Server auction body well over the 10,000 character storage limit, with the privacy fields at the end.
    const largePbsRequest = (privacy: { regs?: any; user?: any }) =>
      toLogEntry({
        request: {
          url: 'https://prebid-server.example.com/openrtb2/auction',
          method: 'POST',
          postData: { mimeType: 'application/json', text: JSON.stringify({ id: 'a1', imp: Array.from({ length: 200 }, (_, i) => ({ id: `imp-${i}`, banner: { format: [{ w: 300, h: 250 }] } })), ...privacy }) },
        },
        response: { status: 200 },
      });

    it('flags missing consent in a large, truncated OpenRTB body', () => {
      const entry = largePbsRequest({ regs: { ext: { gdpr: 1 } } });
      expect(entry.postData?.text?.length).toBeLessThan(10100);

      const { privacy } = classifyRequest(entry);
      expect(privacy.gdpr).toBe('1');
      expect(privacy.verdict).toBe('missing');
    });

    it('reads the consent string from a large, truncated OpenRTB body', () => {
      const consent = 'CP12345AP12345ABAAENA9CAAP_AAH_AAAAAGVwBgAAA';
      const { privacy } = classifyRequest(largePbsRequest({ regs: { ext: { gdpr: 1 } }, user: { ext: { consent } } }));
      expect(privacy.gdprConsent).toBe(consent);
      expect(privacy.verdict).not.toBe('missing');
    });

    it('classifies Google Ad Manager request', () => {
      const entry: IHarLogEntry = {
        id: '1',
        url: 'https://securepubads.g.doubleclick.net/gampad/ads?iu=123',
        host: 'securepubads.g.doubleclick.net',
        pathname: '/gampad/ads',
        method: 'GET',
        status: 200,
        startedDateTime: Date.now(),
        time: 150,
      };

      const classified = classifyRequest(entry);
      expect(classified.category).toBe('gam');
      expect(classified.providerName).toBe('Google Ad Manager');
      expect(classified.isPrebid).toBe(false);
    });

    it('attributes a cookie sync to its own host, not to a Google host in its redirect parameter', () => {
      const entry: IHarLogEntry = {
        id: 'r1',
        url: 'https://pixel.rubiconproject.com/exchange/sync.php?p=pbs&redir=https%3A%2F%2Fcm.g.doubleclick.net%2Fpixel%3Fgoogle_nid%3Drubicon',
        host: 'pixel.rubiconproject.com',
        pathname: '/exchange/sync.php',
        method: 'GET',
        status: 200,
        startedDateTime: Date.now(),
        time: 40,
      };

      const classified = classifyRequest(entry);
      expect(classified.providerName).not.toBe('Google Ad Manager');
      expect(classified.category).toBe('sync');
    });

    it('does not match hosts that only end in a provider domain name', () => {
      const entry: IHarLogEntry = { id: 'r2', url: 'https://cdn.extra9.com/x.js', host: 'cdn.extra9.com', pathname: '/x.js', method: 'GET', status: 200, startedDateTime: Date.now(), time: 5 };
      expect(classifyRequest(entry).providerName).not.toBe('Amazon TAM / A9');
    });

    it('classifies User Sync request', () => {
      const entry: IHarLogEntry = {
        id: '2',
        url: 'https://ib.adnxs.com/getuid?https%3A%2F%2Fprebid.org%2Fsetuid%3Fbidder%3Dappnexus%26uid%3D%24UID',
        host: 'ib.adnxs.com',
        pathname: '/getuid',
        method: 'GET',
        status: 200,
        startedDateTime: Date.now(),
        time: 50,
        queryString: [{ name: 'gdpr', value: '1' }],
      };

      const classified = classifyRequest(entry);
      expect(classified.category).toBe('sync');
      expect(classified.providerName).toBe('AppNexus / Xandr');
      expect(classified.isPrebid).toBe(true);
      expect(classified.privacy.hasGdpr).toBe(true);
    });

    it('classifies User ID module request', () => {
      const entry: IHarLogEntry = {
        id: '3',
        url: 'https://id5-sync.com/g/v2?gdpr_consent=CP123',
        host: 'id5-sync.com',
        pathname: '/g/v2',
        method: 'GET',
        status: 200,
        startedDateTime: Date.now(),
        time: 80,
      };

      const classified = classifyRequest(entry);
      expect(classified.category).toBe('userId');
      expect(classified.providerName).toBe('ID5');
    });

    it('classifies OpenRTB Bid request', () => {
      const entry: IHarLogEntry = {
        id: '4',
        url: 'https://fastlane.rubiconproject.com/a/api/fastlane.json',
        host: 'fastlane.rubiconproject.com',
        pathname: '/a/api/fastlane.json',
        method: 'POST',
        status: 200,
        startedDateTime: Date.now(),
        time: 120,
      };

      const classified = classifyRequest(entry);
      expect(classified.category).toBe('bid');
      expect(classified.providerName).toBe('Magnite / Rubicon');
    });

    it('classifies RTD provider request', () => {
      const entry: IHarLogEntry = {
        id: '5',
        url: 'https://bcp.crwdcntrl.net/5/c=123/pe=y',
        host: 'bcp.crwdcntrl.net',
        pathname: '/5/c=123/pe=y',
        method: 'GET',
        status: 200,
        startedDateTime: Date.now(),
        time: 60,
      };

      const classified = classifyRequest(entry);
      expect(classified.category).toBe('rtd');
      expect(classified.providerName).toBe('Lotame');
    });

    it('attributes module hostnames from Prebid PROVIDER_HOSTS metadata', () => {
      const entry: IHarLogEntry = {
        id: '6',
        url: 'https://api.pubperf.com/track',
        host: 'api.pubperf.com',
        pathname: '/track',
        method: 'POST',
        status: 200,
        startedDateTime: Date.now(),
        time: 50,
      };

      const classified = classifyRequest(entry);
      expect(classified.category).toBe('analytics');
      expect(classified.providerName.toLowerCase()).toContain('pubperf');
    });
  });
});
