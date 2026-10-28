/**
 * Where each RTD module writes its contribution, used to check that a provider's data reached an
 * auction rather than inferring it from the module name.
 *
 * GENERATED - do not edit by hand.
 * Run `node utils/prebidMetadata/extractProviderSignals.mjs` after bumping prebid.js.
 *
 * Keys are `<componentType>:<componentName>`, matching `realTimeData.dataProviders[].name`.
 * Paths come from the module source, from its `.md`, and from a small curated map.
 * `ortb2Imp` paths are relative to a bid's `ortb2Imp`. Container paths are excluded.
 */
export interface IProviderSignal {
  /** Paths within a bid's `ortb2Imp` that this module writes. */
  ortb2Imp: string[];
  /** Paths within the bidder request's `ortb2` that this module writes. */
  ortb2: string[];
  /** ortb2 data segment names, matched exactly rather than by token. */
  segments: string[];
  /** EID sources this RTD module publishes. */
  eidSources: string[];
}

export const PROVIDER_SIGNALS: { [typeAndName: string]: IProviderSignal } = {
  'rtd:1plusX': { ortb2Imp: [], ortb2: [], segments: ['1plusx.com'], eidSources: [] },
  'rtd:51Degrees': { ortb2Imp: [], ortb2: [], segments: [], eidSources: ['51d.es'] },
  'rtd:a1Media': { ortb2Imp: [], ortb2: [], segments: ['a1mediagroup.com'], eidSources: ['a1mediagroup.com'] },
  'rtd:adagio': { ortb2Imp: ['ext.data.adg_rtd.adunit_position', 'ext.data.adg_rtd.placement', 'ext.data.divId'], ortb2: ['site.ext.data.adg_rtd'], segments: [], eidSources: [] },
  'rtd:adloox': { ortb2Imp: ['ext.data.adloox_rtd'], ortb2: ['site.ext.data.adloox_rtd', 'user.ext.data.adloox_rtd'], segments: [], eidSources: [] },
  'rtd:anonymised': { ortb2Imp: [], ortb2: [], segments: ['anonymised.io'], eidSources: [] },
  'rtd:browsi': { ortb2Imp: ['ext.data.browsi'], ortb2: [], segments: [], eidSources: [] },
  'rtd:datamage': { ortb2Imp: [], ortb2: [], segments: ['data-mage.com'], eidSources: [] },
  'rtd:dgkeyword': { ortb2Imp: ['ext.data.keywords'], ortb2: [], segments: [], eidSources: [] },
  'rtd:dynamicAdBoost': { ortb2Imp: ['ext.data.dynamicAdBoost'], ortb2: [], segments: [], eidSources: [] },
  'rtd:encypher': { ortb2Imp: [], ortb2: ['site.ext.data.c2pa'], segments: [], eidSources: [] },
  'rtd:goldfishAdsRtd': { ortb2Imp: [], ortb2: [], segments: ['goldfishads.com'], eidSources: [] },
  'rtd:greenbidsRtdProvider': { ortb2Imp: ['ext.greenbids'], ortb2: [], segments: [], eidSources: [] },
  'rtd:humansecurity': { ortb2Imp: [], ortb2: ['device.ext.hmns'], segments: [], eidSources: [] },
  'rtd:im': { ortb2Imp: [], ortb2: ['user.ext.data.im_segments', 'user.ext.data.im_uid'], segments: [], eidSources: [] },
  'rtd:liveintent': { ortb2Imp: [], ortb2: [], segments: ['liveintent.com'], eidSources: [] },
  'rtd:mgid': { ortb2Imp: [], ortb2: [], segments: ['www.mgid.com'], eidSources: [] },
  'rtd:NeuwoRTDModule': { ortb2Imp: [], ortb2: [], segments: ['www.neuwo.ai'], eidSources: [] },
  'rtd:oneKey': { ortb2Imp: ['ext.data.paf.transaction_id'], ortb2: [], segments: [], eidSources: [] },
  'rtd:optimeraRTD': { ortb2Imp: ['ext.data.optimera'], ortb2: [], segments: [], eidSources: [] },
  'rtd:rayn': { ortb2Imp: [], ortb2: [], segments: ['rayn.io'], eidSources: [] },
  'rtd:RelevadRTDModule': { ortb2Imp: ['ext.data.relevad_rtd'], ortb2: [], segments: [], eidSources: [] },
  'rtd:scope3': { ortb2Imp: [], ortb2: [], segments: ['scope3.com'], eidSources: [] },
  'rtd:SirdataRTDModule': { ortb2Imp: [], ortb2: [], segments: ['sirdata.com'], eidSources: ['sddan.com'] },
  'rtd:symitriDap': { ortb2Imp: [], ortb2: [], segments: ['dap.symitri.com'], eidSources: [] },
  'rtd:wurfl': { ortb2Imp: [], ortb2: ['device.ext.wurfl'], segments: [], eidSources: [] },
};
