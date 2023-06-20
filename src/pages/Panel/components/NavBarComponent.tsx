/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useContext } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AdUnitsOutlinedIcon from '@mui/icons-material/AdUnitsOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { Link } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { IconButton, Typography } from '@mui/material';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import InputLabel from '@mui/material/InputLabel';
import ChromeStorageContext from '../../Shared/contexts/inspectedPageContext';
import { PBJS_NAMESPACE_CHANGE } from '../../Shared/constants';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import StateContext from '../../Shared/contexts/appStateContext';
import { sendChromeTabsMessage } from '../../Shared/utils';
import LinkIcon from '@mui/icons-material/Link';

const RouterLink = ({ target, activeRoute, clickHandler, icon, label }: RouterLinkComponentProps): JSX.Element => (
  <Link to={target}>
    <Button
      variant={activeRoute === target ? 'contained' : 'outlined'}
      onClick={clickHandler}
      startIcon={icon}
      sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
    >
      {label}
    </Button>
  </Link>
);

const NavBarComponent = () => {
  const [activeRoute, setActiveRoute] = useState<string>(window.location.hash.replace('#', '') || '/');
  const inspectedPageState = useContext(ChromeStorageContext);
  const downloading = inspectedPageState?.downloading;
  const { pbjsNamespace, setPbjsNamespace } = useContext(StateContext);

  const handleRouteChange = (input: any) => {
    setActiveRoute(input);
  };

  const updatePbjsNamespace = (newValue: string) => {
    setPbjsNamespace(newValue);
    sendChromeTabsMessage(PBJS_NAMESPACE_CHANGE, newValue);
  };

  return (
    <AppBar
      sx={{
        p: 0,
        position: 'relative',
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        '& > a': { textDecoration: 'none' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', columnGap: 1 }}>
        <Box component="form">
          <FormControl variant="standard" sx={{ m: 1, minWidth: 180 }} disabled={Object.keys(inspectedPageState?.prebids || {}).length < 2}>
            <InputLabel>Prebid Global</InputLabel>
            <Select value={pbjsNamespace || 'undefined'} onChange={(e) => updatePbjsNamespace(e.target.value)} autoWidth>
              {inspectedPageState?.prebids &&
                Object.keys(inspectedPageState?.prebids).map((global, index) => (
                  <MenuItem key={index} value={global}>
                    {global}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Box>

        <RouterLink target="/" activeRoute={activeRoute} clickHandler={() => handleRouteChange('/')} icon={<AdUnitsOutlinedIcon />} label="AdUnits" />

        <RouterLink
          target="bids"
          activeRoute={activeRoute}
          clickHandler={() => handleRouteChange('/bids')}
          icon={<AccountBalanceOutlinedIcon />}
          label="Bids"
        />

        <RouterLink
          target="timeline"
          activeRoute={activeRoute}
          clickHandler={() => handleRouteChange('/timeline')}
          icon={<TimelineOutlinedIcon />}
          label="Timeline"
        />

        <RouterLink
          target="config"
          activeRoute={activeRoute}
          clickHandler={() => handleRouteChange('/config')}
          icon={<SettingsOutlinedIcon />}
          label="Config"
        />

        <RouterLink
          target="userId"
          activeRoute={activeRoute}
          clickHandler={() => handleRouteChange('/userId')}
          icon={<ContactPageOutlinedIcon />}
          label="UserID"
        />

        <RouterLink
          target="tools"
          activeRoute={activeRoute}
          clickHandler={() => handleRouteChange('/tools')}
          icon={<DnsOutlinedIcon />}
          label="Tools"
        />

        <RouterLink
          target="events"
          activeRoute={activeRoute}
          clickHandler={() => handleRouteChange('/events')}
          icon={<WarningAmberOutlinedIcon />}
          label="Events"
        />

        <RouterLink
          target="initiator"
          activeRoute={activeRoute}
          clickHandler={() => handleRouteChange('/initiator')}
          icon={<LinkIcon />}
          label="Netwok Inspector (alpha)"
        />

        <Typography variant="caption" sx={{ mr: 1, color: 'black', overflow: 'clip', textAlign: 'left' }}>
          {inspectedPageState?.syncState}
        </Typography>
      </Box>

      <Box>
        <IconButton
          aria-label="refresh"
          color="default"
          sx={{ p: 0 }}
          onClick={() => chrome.tabs.create({ url: 'https://github.com/prebid/professor-prebid/issues' })}
        >
          <HelpOutlineOutlinedIcon />
        </IconButton>

        <IconButton
          sx={{ p: 0 }}
          aria-label="refresh"
          onClick={() => chrome.devtools.inspectedWindow.reload({ ignoreCache: true })}
          color={downloading === 'true' ? 'primary' : downloading === 'error' ? 'error' : 'default'}
        >
          {downloading === 'true' ? (
            <AutorenewIcon
              sx={{
                animation: 'spin 1s linear infinite',
                '@keyframes spin': {
                  '0%': {
                    transform: 'rotate(-390deg)',
                  },
                  '100%': {
                    transform: 'rotate(-30deg)',
                  },
                },
              }}
            />
          ) : downloading === 'error' ? (
            <ErrorOutlineIcon />
          ) : (
            <RefreshIcon />
          )}
        </IconButton>
      </Box>
    </AppBar>
  );
};

export default NavBarComponent;
