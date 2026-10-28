import { describe, it, expect } from 'vitest';
import {
  EVENTS,
  CONSOLE_TOGGLE,
  STORE_RULES_TOGGLE,
  PBJS_NAMESPACE_CHANGE,
  SAVE_MASKS,
  DOWNLOAD_FAILED,
  INITIATOR_TOGGLE,
  INITIATOR_ROOT_URL,
  POPUP_LOADED,
  PREBID_DETECTION_TIMEOUT,
  PREBID_DETECTION_TIMEOUT_IFRAME,
  PAGES,
  replaceRuleTargets,
} from './constants';

describe('Shared Constants', () => {
  describe('EVENTS', () => {
    it('has all required event keys and values', () => {
      expect(EVENTS.REQUEST_CONSOLE_STATE).toBe('requestConsoleState');
      expect(EVENTS.SEND_GAM_DETAILS_TO_BACKGROUND).toBe('sendGamDetailsToBackground');
      expect(EVENTS.SEND_PREBID_DETAILS_TO_BACKGROUND).toBe('sendPrebidDetailsToBackground');
      expect(EVENTS.SEND_TCF_DETAILS_TO_BACKGROUND).toBe('sendTcfDetailsToBackground');
    });
  });

  describe('PAGES', () => {
    it('has expected page entries', () => {
      expect(PAGES.length).toBe(10);
      const labels = PAGES.map((p) => p.label);
      expect(labels).toEqual(['Ad Units', 'Bids', 'Config', 'Events', 'Network Inspector', 'Pre-Auction', 'Timeline', 'Tools', 'User Id', 'Version']);
    });

    it('each page has required fields and correct properties', () => {
      PAGES.forEach((page) => {
        expect(page.label).toBeTruthy();
        expect(typeof page.path).toBe('string');
        expect(page.Icon).toBeDefined();
        expect(typeof page.beta).toBe('boolean');
      });
      const networkInspector = PAGES.find((p) => p.label === 'Network Inspector');
      expect(networkInspector?.beta).toBe(true);
      const adUnits = PAGES.find((p) => p.label === 'Ad Units');
      expect(adUnits?.beta).toBe(false);
    });
  });

  describe('replaceRuleTargets', () => {
    it('includes banner, video, and native media types', () => {
      const mediaTypes = [...new Set(replaceRuleTargets.map((r) => r.mediaType))];
      expect(mediaTypes).toContain('allMediaTypes');
      expect(mediaTypes).toContain('banner');
      expect(mediaTypes).toContain('video');
      expect(mediaTypes).toContain('native');
    });

    it('has correct structure and properties for replaceRuleTargets entries', () => {
      expect(replaceRuleTargets.length).toBeGreaterThan(15);
      replaceRuleTargets.forEach((target) => {
        expect(target.value).toBeTruthy();
        expect(target.label).toBeTruthy();
        expect(target.mediaType).toBeTruthy();
        expect(typeof target.default).toBe('string');
        expect(target.type).toBeTruthy();
      });

      const mediaTypeRule = replaceRuleTargets.find((r) => r.value === 'mediaType');
      expect(mediaTypeRule?.options).toEqual(['banner', 'native', 'video']);

      const nativeClickUrl = replaceRuleTargets.find((r) => r.value === 'clickUrl');
      expect(nativeClickUrl?.subkey).toBe('native');
    });
  });

  describe('exported constants', () => {
    it('tests all exported toggle, timing and string constants', () => {
      expect(CONSOLE_TOGGLE).toBe('PP_CONSOLE_STATE');
      expect(STORE_RULES_TOGGLE).toBe('persistDebuggingRules');
      expect(PBJS_NAMESPACE_CHANGE).toBe('PBJS_NAMESPACE_CHANGE');
      expect(SAVE_MASKS).toBe('PP_SAVE_MASKS');
      expect(DOWNLOAD_FAILED).toBe('PP_DOWNLOAD_FAILED');
      expect(INITIATOR_TOGGLE).toBe('initiator_state');
      expect(INITIATOR_ROOT_URL).toBe('initiator_root_url');
      expect(POPUP_LOADED).toBe('PP_POPUP_LOADED');
      expect(PREBID_DETECTION_TIMEOUT).toBe(60000);
      expect(PREBID_DETECTION_TIMEOUT_IFRAME).toBe(3000);
    });
  });
});
