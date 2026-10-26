import React, { useEffect, useState, useRef, useCallback } from 'react';
import { EVENTS, CONSOLE_TOGGLE, SAVE_MASKS } from '../Shared/constants';
import { EventBus } from '../Shared/utils';
import AdOverlayPortal from './components/AdOverlayPortal';
import PopOverComponent from './components/PopOverComponent';
import { AdOverlayComponentProps } from './components/AdOverlayComponent';
import { IPrebidAuctionEndEventData, IPrebidBidWonEventData } from '../Injected/prebid';

declare global {
  interface Window {
    [key: string]: any;
  }
}

export const getParentGamPubAds = () => {
  try {
    if (window.parent && window.parent.googletag && typeof window.parent.googletag.pubads === 'function') {
      return window.parent.googletag.pubads();
    }
  } catch (e) {
    // Cross-origin iframe blocked access to window.parent
  }
  return null;
};

const isCodeChar = (c: string | undefined) => !!c && /[a-z0-9]/i.test(c);

// True when `code` appears in `text` as a whole token, so 'div-gpt-ad-1' matches 'wrap-div-gpt-ad-1_0' but not 'div-gpt-ad-12'.
export const containsCode = (text: string, code: string): boolean => {
  if (!text || !code) return false;
  for (let i = text.indexOf(code); i !== -1; i = text.indexOf(code, i + 1)) {
    if (!isCodeChar(text[i - 1]) && !isCodeChar(text[i + code.length])) return true;
  }
  return false;
};

const slotPath = (slot: any): string => (slot?.getAdUnitPath ? slot.getAdUnitPath() : '') || '';
const slotElementId = (slot: any): string => (slot?.getSlotElementId ? slot.getSlotElementId() : '') || '';

// A GAM slot stands for an ad unit code when the code is its element id, its full ad unit path, or the last segment of that path.
const isSameGamSlot = (slot: any, adUnitCode: string): boolean => {
  const path = slotPath(slot);
  return slotElementId(slot) === adUnitCode || path === adUnitCode || (!!path && path.split('/').pop() === adUnitCode);
};

const getGamSlots = (): any[] => {
  try {
    if (window.googletag && typeof window.googletag.pubads === 'function') {
      const pubads = window.googletag.pubads();
      return pubads.getSlots ? pubads.getSlots() : [];
    }
  } catch (e) {
    // Ignored
  }
  return [];
};

/** Every code that refers to the same ad slot as `adUnitCode`: the code itself plus the path and element id of its GAM slot. */
export const equivalentAdUnitCodes = (adUnitCode: string): Set<string> => {
  const codes = new Set<string>([adUnitCode]);
  getGamSlots()
    .filter((slot) => isSameGamSlot(slot, adUnitCode))
    .forEach((slot) => {
      if (slotPath(slot)) codes.add(slotPath(slot));
      if (slotElementId(slot)) codes.add(slotElementId(slot));
    });
  return codes;
};

export const findAdContainer = (adUnitCode: string): HTMLElement | null => {
  if (!adUnitCode) return null;

  // 1. Direct ID match
  let el = document.getElementById(adUnitCode);
  if (el) {
    return el.tagName === 'IFRAME' ? el.parentElement : el;
  }

  // 2. GAM Slot matching: exact first, then whole-token matches
  const slots = getGamSlots();
  const matchedSlot =
    slots.find((s: any) => isSameGamSlot(s, adUnitCode)) ||
    slots.find((s: any) => {
      const path = slotPath(s);
      const elementId = slotElementId(s);
      return containsCode(path, adUnitCode) || containsCode(elementId, adUnitCode) || containsCode(adUnitCode, path) || containsCode(adUnitCode, elementId);
    });
  if (matchedSlot) {
    const slotEl = document.getElementById(slotElementId(matchedSlot));
    if (slotEl) {
      return slotEl.tagName === 'IFRAME' ? slotEl.parentElement : slotEl;
    }
  }

  // 3. Fallback querySelector (exclude masks, scripts, styles, and extension root)
  // Matched in JS rather than via an [id*="..."] selector so ad unit codes with quotes or backslashes cannot break the query.
  const extensionRoot = document.getElementById('professor_prebid-root');
  const candidate = Array.from(document.querySelectorAll<HTMLElement>('[id]')).find(
    (el) => containsCode(el.id, adUnitCode) && !el.id.startsWith('prpb-mask--container-') && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE' && !(extensionRoot && extensionRoot !== el && extensionRoot.contains(el))
  );
  if (candidate) {
    return candidate.tagName === 'IFRAME' ? candidate.parentElement : candidate;
  }

  return null;
};

export const isContainerVisible = (el: HTMLElement | null): boolean => {
  if (!el || !el.isConnected) return false;
  try {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    if (!isTest) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        const hasVisibleChild = Array.from(el.children).some((child) => {
          const childRect = child.getBoundingClientRect();
          return childRect.width > 0 && childRect.height > 0;
        });
        if (!hasVisibleChild) return false;
      }
    }
  } catch (e) {
    // Ignored
  }
  return true;
};

const InjectedApp = (): JSX.Element => {
  const [consoleState, setConsoleState] = useState(false);
  const [masks, setMasks] = useState<AdOverlayComponentProps[]>([]);
  const [pbjsNameSpace, setPbjsNameSpace] = useState<string>();
  const [activeModalUnit, setActiveModalUnit] = useState<AdOverlayComponentProps | null>(null);

  const consoleStateRef = useRef(consoleState);
  const lastGetEventsRef = useRef<number>(0);
  const getEventsTimeoutRef = useRef<number | null>(null);
  const pendingNamespaceRef = useRef<string | null>(null);

  const handleConsoleStateChange = (event: Event) => {
    const checked = (event as CustomEvent).detail;
    setConsoleState(checked);
  };

  const updateMasksFromPbjs = useCallback((pbjsNameSpace: string) => {
    setPbjsNameSpace(pbjsNameSpace);
    const pbsjsEvents = (window[pbjsNameSpace]?.getEvents ? window[pbjsNameSpace].getEvents() : []) as unknown[];
    const adUnitCodesSet = new Set<string>();

    // 1. From auctionEnd events
    (pbsjsEvents as IPrebidAuctionEndEventData[])
      .filter((event) => event.eventType === 'auctionEnd')
      .forEach((event) => {
        if (Array.isArray(event.args?.adUnitCodes)) {
          event.args.adUnitCodes.forEach((code: string) => adUnitCodesSet.add(code));
        }
      });

    // 2. From bidWon events
    (pbsjsEvents as IPrebidBidWonEventData[])
      .filter((event) => event.eventType === 'bidWon')
      .forEach((event) => {
        if (event.args?.adUnitCode) {
          adUnitCodesSet.add(event.args.adUnitCode);
        }
      });

    // 3. From pbjs.adUnits array
    if (Array.isArray(window[pbjsNameSpace]?.adUnits)) {
      window[pbjsNameSpace].adUnits.forEach((unit: any) => {
        if (unit?.code) adUnitCodesSet.add(unit.code);
      });
    }

    // 4. From pbjs.getAdUnits() if available
    if (typeof window[pbjsNameSpace]?.getAdUnits === 'function') {
      try {
        const units = window[pbjsNameSpace].getAdUnits();
        if (Array.isArray(units)) {
          units.forEach((unit: any) => {
            if (unit?.code) adUnitCodesSet.add(unit.code);
          });
        }
      } catch (e) {
        // Ignored
      }
    }

    // 5. From GAM slots if available
    if (window.googletag && typeof window.googletag.pubads === 'function') {
      try {
        const slots = window.googletag.pubads().getSlots ? window.googletag.pubads().getSlots() : [];
        slots.forEach((slot: any) => {
          const elementId = slot.getSlotElementId ? slot.getSlotElementId() : '';
          if (elementId) adUnitCodesSet.add(elementId);
        });
      } catch (e) {
        // Ignored
      }
    }

    const allAdunitCodes = Array.from(adUnitCodesSet);
    const masks = allAdunitCodes
      .filter((adUnitCode) => {
        const container = findAdContainer(adUnitCode);
        return isContainerVisible(container);
      })
      .map((adUnitCode) => {
        const codes = equivalentAdUnitCodes(adUnitCode);
        const slotsBidWonEvent = (pbsjsEvents as IPrebidBidWonEventData[]).filter((event) => event.eventType === 'bidWon' && codes.has(event.args?.adUnitCode)).sort((a, b) => (a.args.responseTimestamp < b.args.responseTimestamp ? 1 : -1))[0];

        return {
          elementId: adUnitCode,
          winningCPM: slotsBidWonEvent?.args.cpm ? Math.round(slotsBidWonEvent?.args.cpm * 100) / 100 : undefined,
          winningBidder: slotsBidWonEvent?.args.bidder || slotsBidWonEvent?.args.bidderCode,
          currency: slotsBidWonEvent?.args.currency,
          timeToRespond: slotsBidWonEvent?.args.timeToRespond,
        };
      });
    setMasks(masks);
    setActiveModalUnit((current) => {
      if (!current) return null;
      const updated = masks.find((m) => m.elementId === current.elementId);
      return updated ? { ...current, ...updated } : current;
    });
  }, []);

  const handleNewMasks = useCallback(
    (event: Event) => {
      const customEvent = event as CustomEvent;
      const pbjsNameSpace: string = customEvent.detail;

      if (!pbjsNameSpace || !consoleStateRef.current) {
        return;
      }

      pendingNamespaceRef.current = pbjsNameSpace;

      const now = Date.now();
      const interval = 1000;
      const last = lastGetEventsRef.current;

      if (!last || now - last >= interval) {
        lastGetEventsRef.current = now;
        const ns = pendingNamespaceRef.current;
        pendingNamespaceRef.current = null;
        if (ns) {
          updateMasksFromPbjs(ns);
        }
        return;
      }

      if (getEventsTimeoutRef.current == null) {
        const remaining = interval - (now - last);
        getEventsTimeoutRef.current = window.setTimeout(() => {
          lastGetEventsRef.current = Date.now();
          const ns = pendingNamespaceRef.current;
          pendingNamespaceRef.current = null;
          getEventsTimeoutRef.current = null;

          if (ns && consoleStateRef.current) {
            updateMasksFromPbjs(ns);
          }
        }, remaining);
      }
    },
    [updateMasksFromPbjs]
  );

  useEffect(() => {
    consoleStateRef.current = consoleState;
  }, [consoleState]);

  useEffect(() => {
    EventBus.emit(EVENTS.REQUEST_CONSOLE_STATE, null);
    document.addEventListener(CONSOLE_TOGGLE, handleConsoleStateChange);
    document.addEventListener(SAVE_MASKS, handleNewMasks);
    return () => {
      document.removeEventListener(CONSOLE_TOGGLE, handleConsoleStateChange);
      document.removeEventListener(SAVE_MASKS, handleNewMasks);
      if (getEventsTimeoutRef.current !== null) {
        clearTimeout(getEventsTimeoutRef.current);
        getEventsTimeoutRef.current = null;
      }
    };
  }, [handleNewMasks]);

  return (
    <React.Fragment>
      {masks.map((mask) => {
        return (
          <AdOverlayPortal
            key={mask.elementId}
            mask={mask}
            consoleState={consoleState}
            container={undefined as any}
            pbjsNameSpace={pbjsNameSpace}
            onOpenPopover={() => setActiveModalUnit(mask)}
          />
        );
      })}
      {activeModalUnit && (
        <PopOverComponent
          elementId={activeModalUnit.elementId}
          winningCPM={activeModalUnit.winningCPM}
          winningBidder={activeModalUnit.winningBidder}
          currency={activeModalUnit.currency}
          timeToRespond={activeModalUnit.timeToRespond}
          open={true}
          onClose={() => setActiveModalUnit(null)}
          pbjsNameSpace={pbjsNameSpace}
        />
      )}
    </React.Fragment>
  );
};

export default InjectedApp;
