import AdUnitsOutlinedIcon from '@mui/icons-material/AdUnitsOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import DifferenceIcon from '@mui/icons-material/Difference';
import LinkIcon from '@mui/icons-material/Link';
import PrivacyTipOutlinedIcon from '@mui/icons-material/PrivacyTipOutlined';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import { SvgIconTypeMap } from '@mui/material';

interface IReplaceRuleKeyOptions {
  default: string;
  label: string;
  mediaType: string;
  options?: string[];
  subkey?: string;
  value: string;
  type: string;
}

export const EVENTS = {
  REQUEST_CONSOLE_STATE: 'requestConsoleState',
  SEND_GAM_DETAILS_TO_BACKGROUND: 'sendGamDetailsToBackground',
  SEND_PREBID_DETAILS_TO_BACKGROUND: 'sendPrebidDetailsToBackground',
  SEND_TCF_DETAILS_TO_BACKGROUND: 'sendTcfDetailsToBackground',
};
export const CONSOLE_TOGGLE = 'PP_CONSOLE_STATE';
export const STORE_RULES_TOGGLE = 'persistDebuggingRules';
export const PBJS_NAMESPACE_CHANGE = 'PBJS_NAMESPACE_CHANGE';
export const SAVE_MASKS = 'PP_SAVE_MASKS';
export const DOWNLOAD_FAILED = 'PP_DOWNLOAD_FAILED';
export const INITIATOR_TOGGLE = 'initiator_state';
export const INITIATOR_ROOT_URL = 'initiator_root_url';
export const POPUP_LOADED = 'PP_POPUP_LOADED';
export const PREBID_DETECTION_TIMEOUT = 60000;
export const PREBID_DETECTION_TIMEOUT_IFRAME = 3000;

export const replaceRuleTargets: IReplaceRuleKeyOptions[] = [
  // all mediaTypes
  { value: 'bidderCode', label: 'bidderCode', mediaType: 'allMediaTypes', default: '', type: 'string' },
  { value: 'cpm', label: 'cpm', mediaType: 'allMediaTypes', default: '20', type: 'number' },
  { value: 'currency', label: 'currency', mediaType: 'allMediaTypes', default: 'USD', type: 'string' },
  { value: 'dealId', label: 'dealId', mediaType: 'allMediaTypes', default: '', type: 'string' },
  { value: 'mediaType', label: 'mediaType', mediaType: 'allMediaTypes', default: 'banner', options: ['banner', 'native', 'video'], type: 'string' },
  { value: 'meta', label: 'meta', mediaType: 'allMediaTypes', default: '', type: 'string' },
  { value: 'netRevenue', label: 'netRevenue', mediaType: 'allMediaTypes', default: '', type: 'number' },
  { value: 'requestBidder', label: 'requestBidder', mediaType: 'allMediaTypes', default: '', type: 'string' },
  { value: 'ttl', label: 'ttl', mediaType: 'allMediaTypes', default: '', type: 'number' },
  //mediaType banner
  { value: 'ad', label: 'ad', mediaType: 'banner', default: '', type: 'string' },
  { value: 'height', label: 'height', mediaType: 'banner', default: '300', type: 'number' },
  { value: 'width', label: 'width', mediaType: 'banner', default: '', type: 'number' },
  //mediaType video
  { value: 'vastUrl', label: 'vastUrl', mediaType: 'video', default: '', type: 'string' },
  { value: 'vastXml', label: 'vastXml', mediaType: 'video', default: '', type: 'string' },
  //mediaType native
  { value: 'clickUrl', label: 'clickUrl', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
  { value: 'title', label: 'title', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
  { value: 'image', label: 'image', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
  { value: 'cta', label: 'cta', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
  { value: 'sponsoredBy', label: 'sponsoredBy', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
  { value: 'body', label: 'Body', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
  { value: 'price', label: 'Price', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
  { value: 'privacyLink', label: 'privacyLink', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
  { value: 'icon', label: 'icon', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
  { value: 'displayUrl', label: 'displayUrl', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
  { value: 'rating', label: 'rating', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
  { value: 'address', label: 'address', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
  { value: 'downloads', label: 'downloads', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
  { value: 'likes', label: 'likes', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
  { value: 'phone', label: 'phone', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
  { value: 'salePrice', label: 'salePrice', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
  { value: 'rendererUrl', label: 'rendererUrl', mediaType: 'native', default: '', subkey: 'native', type: 'string' },
];

export const PAGES: {
  label: string;
  path: string;
  Icon: OverridableComponent<SvgIconTypeMap<{}, "svg">> & {
    muiName: string;
  };
  beta: boolean;
}[] = [
    { label: 'Ad Units', path: '', Icon: AdUnitsOutlinedIcon, beta: false },
    { label: 'Bids', path: 'bids', Icon: AccountBalanceOutlinedIcon, beta: false },
    { label: 'Config', path: 'config', Icon: SettingsOutlinedIcon, beta: false },
    { label: 'Events', path: 'events', Icon: WarningAmberOutlinedIcon, beta: false },
    { label: 'Network Inspector', path: 'initiator', Icon: LinkIcon, beta: true },
    { label: 'Timeline', path: 'timeline', Icon: TimelineOutlinedIcon, beta: false },
    { label: 'Tools', path: 'tools', Icon: DnsOutlinedIcon, beta: false },
    { label: 'User Id', path: 'userId', Icon: ContactPageOutlinedIcon, beta: false },
    { label: 'Version', path: 'version', Icon: DifferenceIcon, beta: false },
  ];