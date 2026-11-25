// Kept apart from constants.ts: the icons pull MUI and React into every bundle that imports this, and the content script and service worker need neither.
import AdUnitsOutlinedIcon from '@mui/icons-material/AdUnitsOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import DifferenceIcon from '@mui/icons-material/Difference';
import LinkIcon from '@mui/icons-material/Link';

import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import { SvgIconTypeMap } from '@mui/material';

export const PAGES: {
  label: string;
  path: string;
  Icon: OverridableComponent<SvgIconTypeMap<{}, 'svg'>> & {
    muiName: string;
  };
  beta: boolean;
}[] = [
  { label: 'Ad Units', path: '', Icon: AdUnitsOutlinedIcon, beta: false },
  { label: 'Bids', path: 'bids', Icon: AccountBalanceOutlinedIcon, beta: false },
  { label: 'Config', path: 'config', Icon: SettingsOutlinedIcon, beta: false },
  { label: 'Events', path: 'events', Icon: WarningAmberOutlinedIcon, beta: false },
  { label: 'Network Inspector', path: 'initiator', Icon: LinkIcon, beta: true },
  { label: 'Pre-Auction', path: 'preAuction', Icon: HubOutlinedIcon, beta: true },
  { label: 'Timeline', path: 'timeline', Icon: TimelineOutlinedIcon, beta: false },
  { label: 'Tools', path: 'tools', Icon: DnsOutlinedIcon, beta: false },
  { label: 'User Id', path: 'userId', Icon: ContactPageOutlinedIcon, beta: false },
  { label: 'Version', path: 'version', Icon: DifferenceIcon, beta: false },
];
