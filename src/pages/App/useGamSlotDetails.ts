import { useEffect, useState } from 'react';
import { getParentGamPubAds, isSameGamSlot } from './InjectedApp';
import { getSlotTargeting } from '../Shared/gptTargeting';

export interface IGamSlotDetails {
  slotElementId: string;
  slotAdUnitPath: string;
  /** The network codes in the ad unit path (MCM paths list two). */
  networkId: string[];
  slotTargeting: { key: string; value: string[]; id: number }[];
  slotResponseInfo: googletag.ResponseInformation | null;
  queryId: string | null;
  creativeId: number | null;
  lineItemId: number | null;
}

const EMPTY: IGamSlotDetails = { slotElementId: null, slotAdUnitPath: null, networkId: null, slotTargeting: null, slotResponseInfo: null, queryId: null, creativeId: null, lineItemId: null };

// The overlay's code may be the slot's div id, its ad unit path, or the path's last segment.
const findSlot = (pubads: googletag.PubAdsService, elementId: string): googletag.Slot | undefined => {
  const slots = pubads.getSlots ? pubads.getSlots() : [];
  return slots.find((slot) => slot.getSlotElementId() === elementId) || slots.find((slot) => isSameGamSlot(slot, elementId));
};

const readSlot = (slot: googletag.Slot): IGamSlotDetails => {
  const responseInfo = slot.getResponseInformation();
  const { creativeId, lineItemId, sourceAgnosticCreativeId, sourceAgnosticLineItemId } = (responseInfo || {}) as any;
  return {
    slotElementId: slot.getSlotElementId(),
    slotAdUnitPath: slot.getAdUnitPath(),
    networkId: slot.getAdUnitPath()?.split('/')[1]?.split(','),
    slotTargeting: Object.entries(getSlotTargeting(slot)).map(([key, value], id) => ({ key, value, id })),
    slotResponseInfo: responseInfo,
    queryId: document.getElementById(slot.getSlotElementId())?.getAttribute('data-google-query-id') || null,
    creativeId: creativeId || sourceAgnosticCreativeId || null,
    lineItemId: lineItemId || sourceAgnosticLineItemId || null,
  };
};

/** The GAM slot behind an overlay, kept current as GPT fetches and renders it; empty fields while there is none. */
export const useGamSlotDetails = (elementId: string, enabled = true): IGamSlotDetails => {
  const [details, setDetails] = useState<IGamSlotDetails>(EMPTY);

  useEffect(() => {
    if (!enabled) return;
    const pubads = getParentGamPubAds();
    if (!pubads) return;

    // Looked up again on every event: GPT may have replaced the slot since.
    const sync = () => {
      const slot = findSlot(pubads, elementId);
      if (slot) setDetails(readSlot(slot));
    };
    sync();

    const onSlotEvent = (event: googletag.events.SlotRenderEndedEvent | googletag.events.SlotResponseReceived) => {
      if (event.slot && isSameGamSlot(event.slot, elementId)) sync();
    };
    pubads.addEventListener('slotResponseReceived', onSlotEvent);
    pubads.addEventListener('slotRenderEnded', onSlotEvent);
    return () => {
      pubads.removeEventListener('slotResponseReceived', onSlotEvent);
      pubads.removeEventListener('slotRenderEnded', onSlotEvent);
    };
  }, [elementId, enabled]);

  return details;
};
