import { TCString } from '@iabtcf/core';
import { IHarLogEntry } from '../../../Devtools/harLog';
import { PROVIDER_HOSTS } from '../preAuction/providerHosts';

export type NetworkCategory = 'bid' | 'sync' | 'userId' | 'rtd' | 'analytics' | 'gam' | 'other';

export type PrivacyVerdict = 'valid' | 'warning' | 'missing' | 'none';

export interface IDecodedTcf {
  version?: number;
  cmpId?: number;
  cmpVersion?: number;
  consentScreen?: number;
  consentLanguage?: string;
  vendorListVersion?: number;
  tcfPolicyVersion?: number;
  isServiceSpecific?: boolean;
  useNonStandardStacks?: boolean;
  specialFeatureOptins?: number[];
  purposeConsents?: number[];
  vendorConsents?: number[];
}

export interface IPrivacyAudit {
  hasGdpr: boolean;
  gdpr?: string;
  gdprConsent?: string;
  decodedTcf?: IDecodedTcf;
  usPrivacy?: string;
  gpp?: string;
  gppSid?: string;
  coppa?: string;
  gpc?: string;
  verdict: PrivacyVerdict;
  verdictReason: string;
}

export interface IClassifiedNetworkEntry {
  entry: IHarLogEntry;
  category: NetworkCategory;
  categoryLabel: string;
  categoryColor: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' | 'default';
  providerName: string;
  isPrebid: boolean;
  privacy: IPrivacyAudit;
  queryParamsMap: { [key: string]: string };
  requestHeadersMap: { [key: string]: string };
  responseHeadersMap: { [key: string]: string };
}

export const CATEGORY_LABELS: Record<NetworkCategory, string> = {
  bid: 'Bid Request',
  sync: 'User Sync',
  userId: 'User ID Module',
  rtd: 'Real-Time Data (RTD)',
  analytics: 'Analytics',
  gam: 'Google Ad Manager',
  other: 'Other Request',
};

export const CATEGORY_COLORS: Record<NetworkCategory, 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error' | 'default'> = {
  bid: 'primary',
  sync: 'info',
  userId: 'secondary',
  rtd: 'warning',
  analytics: 'default',
  gam: 'success',
  other: 'default',
};

const VENDOR_DISPLAY_OVERRIDES: Record<string, string> = {
  ix: 'Index Exchange',
  adnxs: 'AppNexus / Xandr',
  appnexus: 'AppNexus / Xandr',
  rubicon: 'Magnite / Rubicon',
  rubiconproject: 'Magnite / Rubicon',
  smartadserver: 'Equativ / Smart',
  equativ: 'Equativ / Smart',
  identityLink: 'LiveRamp RampID',
  uid2: 'Unified ID 2.0',
  lotamePanoramaId: 'Lotame',
  criteo: 'Criteo',
  id5Id: 'ID5',
};

const formatComponentName = (rawName: string): string => {
  if (VENDOR_DISPLAY_OVERRIDES[rawName]) {
    return VENDOR_DISPLAY_OVERRIDES[rawName];
  }
  const cleaned = rawName.replace(/(BidAdapter|IdSystem|RTDModule|Provider|AnalyticsAdapter|Analytics)$/i, '').replace(/([a-z])([A-Z])/g, '$1 $2');
  return VENDOR_DISPLAY_OVERRIDES[cleaned] || cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const isCanonicalOwner = (componentName: string, domain: string): boolean => {
  if (VENDOR_DISPLAY_OVERRIDES[componentName]) return true;
  const nameLower = componentName.toLowerCase();
  const domainBase = domain.split('.')[0].toLowerCase();
  return domainBase.includes(nameLower) || nameLower.includes(domainBase);
};

export const PREBID_PROVIDER_MAP: Map<string, { name: string; category: NetworkCategory }> = new Map();

if (PROVIDER_HOSTS && typeof PROVIDER_HOSTS === 'object') {
  for (const [key, domains] of Object.entries(PROVIDER_HOSTS)) {
    const [componentType, componentName] = key.split(':');
    let category: NetworkCategory = 'other';
    if (componentType === 'bidder') category = 'bid';
    else if (componentType === 'userId') category = 'userId';
    else if (componentType === 'rtd') category = 'rtd';
    else if (componentType === 'analytics') category = 'analytics';

    const friendlyName = formatComponentName(componentName || key);

    if (Array.isArray(domains)) {
      for (const domain of domains) {
        const d = domain.toLowerCase();
        if (isCanonicalOwner(componentName || key, d)) {
          PREBID_PROVIDER_MAP.set(d, { name: friendlyName, category });
        }
      }
    }
  }

  for (const [key, domains] of Object.entries(PROVIDER_HOSTS)) {
    const [componentType, componentName] = key.split(':');
    let category: NetworkCategory = 'other';
    if (componentType === 'bidder') category = 'bid';
    else if (componentType === 'userId') category = 'userId';
    else if (componentType === 'rtd') category = 'rtd';
    else if (componentType === 'analytics') category = 'analytics';

    const friendlyName = formatComponentName(componentName || key);

    if (Array.isArray(domains)) {
      for (const domain of domains) {
        const d = domain.toLowerCase();
        if (!PREBID_PROVIDER_MAP.has(d)) {
          PREBID_PROVIDER_MAP.set(d, { name: friendlyName, category });
        }
      }
    }
  }
}

export const EXTERNAL_PROVIDERS: Array<{
  name: string;
  hostPattern: RegExp;
  category: NetworkCategory;
}> = [
  { name: 'Google Ad Manager', hostPattern: /googlesyndication\.com|doubleclick\.net|googleadservices\.com/i, category: 'gam' },
  { name: 'Amazon TAM / A9', hostPattern: /amazon-adsystem\.com|a9\.com/i, category: 'bid' },
];

export const KNOWN_PROVIDERS = EXTERNAL_PROVIDERS;

export const decodeTcfString = (consentString?: string): IDecodedTcf | undefined => {
  if (!consentString || typeof consentString !== 'string' || consentString.length < 5) return undefined;
  try {
    const tcModel = TCString.decode(consentString);
    if (!tcModel) return undefined;

    const purposeConsents: number[] = [];
    if (tcModel.purposeConsents) {
      for (let i = 1; i <= 24; i++) {
        if (tcModel.purposeConsents.has(i)) purposeConsents.push(i);
      }
    }

    const specialFeatureOptins: number[] = [];
    if (tcModel.specialFeatureOptins) {
      for (let i = 1; i <= 12; i++) {
        if (tcModel.specialFeatureOptins.has(i)) specialFeatureOptins.push(i);
      }
    }

    const vendorConsents: number[] = [];
    if (tcModel.vendorConsents) {
      tcModel.vendorConsents.forEach((hasConsent, id) => {
        if (hasConsent && vendorConsents.length < 150) vendorConsents.push(id);
      });
    }

    return {
      version: Number(tcModel.version),
      cmpId: Number(tcModel.cmpId),
      cmpVersion: Number(tcModel.cmpVersion),
      consentScreen: Number(tcModel.consentScreen),
      consentLanguage: String(tcModel.consentLanguage || ''),
      vendorListVersion: Number(tcModel.vendorListVersion),
      tcfPolicyVersion: Number((tcModel as any).policyVersion ?? (tcModel as any).tcfPolicyVersion ?? 0),
      isServiceSpecific: Boolean(tcModel.isServiceSpecific),
      useNonStandardStacks: Boolean(tcModel.useNonStandardStacks),
      specialFeatureOptins,
      purposeConsents,
      vendorConsents,
    };
  } catch {
    return undefined;
  }
};

const mapHeaders = (headers?: Array<{ name: string; value: string }>): { [key: string]: string } => {
  const map: { [key: string]: string } = {};
  if (Array.isArray(headers)) {
    headers.forEach((h) => {
      if (h?.name) map[h.name.toLowerCase()] = String(h.value ?? '');
    });
  }
  return map;
};

const mapQueryParams = (params?: Array<{ name: string; value: string }>): { [key: string]: string } => {
  const map: { [key: string]: string } = {};
  if (Array.isArray(params)) {
    params.forEach((p) => {
      if (p?.name) map[p.name.toLowerCase()] = String(p.value ?? '');
    });
  }
  return map;
};

export const auditPrivacy = (queryParams: { [key: string]: string }, requestHeaders: { [key: string]: string }, postText?: string, decompressedPostText?: string, cmpConsentString?: string, url?: string): IPrivacyAudit => {
  let gdpr = queryParams['gdpr'] || queryParams['gdpr_applies'] || queryParams['gdpp_applies'] || queryParams['is_gdpr'] || queryParams['gdpr_str'];

  let usPrivacy = queryParams['us_privacy'] || queryParams['usprivacy'] || queryParams['usp'] || queryParams['ccpa'] || queryParams['ccpa_string'] || queryParams['us_privacy_str'];

  let gpp = queryParams['gpp'] || queryParams['gpp_string'] || queryParams['gpp_str'];
  let gppSid = queryParams['gpp_sid'] || queryParams['gpp_section_id'] || queryParams['gpp_section_ids'] || queryParams['gpps_sid'];
  let coppa = queryParams['coppa'] || queryParams['tfcd'] || queryParams['tfua'] || queryParams['child_directed'];
  const gpc = requestHeaders['sec-gpc'];

  let gdprConsent: string | undefined = undefined;
  let decodedTcf: IDecodedTcf | undefined = undefined;

  const knownConsentKeys = ['gdpr_consent', 'gdprstring', 'gdpr_str', 'consent_string', 'consent', 'euconsent-v2', 'euconsent_v2', 'euconsent', 'tc_string', 'tcstring', 'tcf_consent', 'cmp_consent'];

  for (const k of knownConsentKeys) {
    if (queryParams[k]) {
      gdprConsent = queryParams[k];
      decodedTcf = decodeTcfString(gdprConsent);
      if (decodedTcf) break;
    }
  }

  const textToParse = decompressedPostText || postText;
  if (textToParse) {
    try {
      const parsed = JSON.parse(textToParse);
      const user = parsed?.user;
      const regs = parsed?.regs;

      if (!gdpr && regs?.ext?.gdpr !== undefined) gdpr = String(regs.ext.gdpr);
      if (!gdprConsent && user?.ext?.consent) {
        gdprConsent = String(user.ext.consent);
        decodedTcf = decodeTcfString(gdprConsent);
      }
      if (!usPrivacy && regs?.ext?.us_privacy) usPrivacy = String(regs.ext.us_privacy);
      if (!gpp && regs?.ext?.gpp) gpp = String(regs.ext.gpp);
      if (!gppSid && regs?.ext?.gpp_sid) gppSid = Array.isArray(regs.ext.gpp_sid) ? regs.ext.gpp_sid.join(',') : String(regs.ext.gpp_sid);
      if (!coppa && regs?.coppa !== undefined) coppa = String(regs.coppa);
    } catch {}
  }

  if (!gdprConsent) {
    for (const [, val] of Object.entries(queryParams)) {
      if (val && typeof val === 'string' && val.length >= 15) {
        if (/^C[A-Za-z0-9\-_]{15,}/.test(val)) {
          gdprConsent = val;
          decodedTcf = decodeTcfString(val);
          break;
        }
      }
    }
  }

  if (!gdprConsent && textToParse) {
    const tcfRegex = /\b(C[A-Za-z0-9\-_]{20,}(?:\.[A-Za-z0-9\-_]+)*)\b/g;
    const matches = textToParse.match(tcfRegex);
    if (matches && matches.length > 0) {
      gdprConsent = matches[0];
      decodedTcf = decodeTcfString(matches[0]);
    }
  }

  if (cmpConsentString && cmpConsentString.length > 10) {
    const cmpCore = cmpConsentString.split('.')[0];
    const fullTarget = `${url || ''} ${textToParse || ''} ${JSON.stringify(queryParams)}`;

    if (fullTarget.includes(cmpConsentString) || (cmpCore.length > 15 && fullTarget.includes(cmpCore))) {
      if (!gdprConsent) gdprConsent = cmpConsentString;
      if (!decodedTcf) decodedTcf = decodeTcfString(cmpConsentString) || decodeTcfString(cmpCore);
    } else if (gdprConsent && !decodedTcf) {
      // If request has a consent param (e.g. Criteo vendor segment gdprString) and CMP is known, use CMP decode
      decodedTcf = decodeTcfString(cmpConsentString);
    }
  }

  const hasGdpr = gdpr === '1' || Boolean(gdprConsent);

  let verdict: PrivacyVerdict = 'none';
  let verdictReason = 'No privacy parameters detected';

  if (gdprConsent && decodedTcf) {
    verdict = 'valid';
    verdictReason = `Valid TCF v${decodedTcf.version || 2} String (CMP ID: ${decodedTcf.cmpId ?? 'N/A'})`;
  } else if (gdprConsent && !decodedTcf) {
    verdict = 'warning';
    verdictReason = 'GDPR consent string is present but could not be parsed as valid TCF';
  } else if (gdpr === '1' && !gdprConsent) {
    verdict = 'missing';
    verdictReason = 'GDPR applies (gdpr=1) but consent string is missing';
  } else if (gpp) {
    verdict = 'valid';
    verdictReason = `GPP String present (Sections: ${gppSid || 'default'})`;
  } else if (usPrivacy) {
    verdict = 'valid';
    verdictReason = `US Privacy string present (${usPrivacy})`;
  } else if (gpc === '1') {
    verdict = 'valid';
    verdictReason = 'Global Privacy Control (Sec-GPC: 1) header present';
  }

  return {
    hasGdpr,
    gdpr,
    gdprConsent,
    decodedTcf,
    usPrivacy,
    gpp,
    gppSid,
    coppa,
    gpc,
    verdict,
    verdictReason,
  };
};

export const classifyRequest = (entry: IHarLogEntry, decompressedPostText?: string, cmpConsentString?: string): IClassifiedNetworkEntry => {
  const url = entry.url || '';
  const host = entry.host || '';
  const pathname = entry.pathname || '';
  const method = entry.method || 'GET';
  const queryParamsMap = mapQueryParams(entry.queryString);
  const requestHeadersMap = mapHeaders(entry.requestHeaders);
  const responseHeadersMap = mapHeaders(entry.responseHeaders);
  const privacy = auditPrivacy(queryParamsMap, requestHeadersMap, entry.postData?.text, decompressedPostText, cmpConsentString, url);

  // Match Provider
  let providerName = '';
  let matchedCategory: NetworkCategory | undefined = undefined;

  // 1. Match Provider against curated KNOWN_PROVIDERS
  for (const provider of KNOWN_PROVIDERS) {
    if (provider.hostPattern.test(host) || provider.hostPattern.test(url)) {
      providerName = provider.name;
      if (provider.category) matchedCategory = provider.category;
      break;
    }
  }

  // 2. Match Provider against generated PREBID_PROVIDER_MAP (870+ modules / 1800+ domains)
  if (!providerName && host) {
    const hostParts = host.toLowerCase().split('.');
    for (let i = 0; i < hostParts.length - 1; i++) {
      const candidateDomain = hostParts.slice(i).join('.');
      const match = PREBID_PROVIDER_MAP.get(candidateDomain);
      if (match) {
        providerName = match.name;
        if (!matchedCategory && match.category !== 'other') {
          matchedCategory = match.category;
        }
        break;
      }
    }
  }

  // 3. Fallback to extracting domain name
  if (!providerName && host) {
    const parts = host.split('.');
    providerName = parts.length >= 2 ? parts[parts.length - 2].toUpperCase() : host;
  }

  // Detect Category
  let category: NetworkCategory = matchedCategory || 'other';

  const lowerUrl = url.toLowerCase();
  const lowerPath = pathname.toLowerCase();

  if (/googlesyndication|doubleclick|googleadservices/i.test(host)) {
    category = 'gam';
  } else if (/cookie_sync|usersync|setuid|getuid|(?<!id5-)sync\.|match\.|load-cookie|pixel\.rubicon|\/sync\b|\/cookie\b|idsync/i.test(lowerUrl) || /sync|match|pixel|user_sync/i.test(lowerPath)) {
    category = 'sync';
  } else if (/crwdcntrl|permutive|audigent|intentiq|browsi/i.test(lowerUrl)) {
    category = 'rtd';
  } else if (/id5-sync|liveramp|unifiedid|sharedid|criteo_id|parrable|identity/i.test(lowerUrl)) {
    category = 'userId';
  } else if (!matchedCategory) {
    if (/openrtb2\/auction|ut\/v3\/prebid|fastlane|auction|\/bid\b|\/bids\b|header/i.test(lowerUrl) || (method === 'POST' && /auction|bid|openrtb/i.test(lowerPath))) {
      category = 'bid';
    } else if (/analytics|event-tracker|prebid-analytics|beacon/i.test(lowerUrl)) {
      category = 'analytics';
    }
  }

  const isPrebid = category !== 'gam' && category !== 'other';

  return {
    entry,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    categoryColor: CATEGORY_COLORS[category],
    providerName,
    isPrebid,
    privacy,
    queryParamsMap,
    requestHeadersMap,
    responseHeadersMap,
  };
};
