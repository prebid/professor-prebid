import React, { useState, useContext } from 'react';
import { getTabId, sendChromeTabsMessage } from '../Shared/utils';
import { PBJS_NAMESPACE_CHANGE } from '../Shared/constants';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import AdUnitsOutlinedIcon from '@mui/icons-material/AdUnitsOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Badge from '@mui/material/Badge';
import { Link } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { IconButton } from '@mui/material';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import DifferenceIcon from '@mui/icons-material/Difference';
import StateContext from '../Shared/contexts/appStateContext';
import InspectedPageContext from '../Shared/contexts/inspectedPageContext';
import logo from '../../assets/img/logo.png';
import './Navbar.css';

const onPbjsNamespaceChange = async (pbjsNamespace: string) => {
  sendChromeTabsMessage(PBJS_NAMESPACE_CHANGE, pbjsNamespace);
};

export const NavBar = (): JSX.Element => {
  const [activeRoute, setActiveRoute] = useState<string>(window.location.hash.replace('#', '') || '/');
  const [pbjsNamespaceDialogOpen, setPbjsNamespaceDialogOpen] = React.useState(false);
  const { pbjsNamespace, setPbjsNamespace } = useContext(StateContext);
  const { prebids, downloading } = useContext(InspectedPageContext);
  const [selectedTab, setSelectedTab] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const refresh = async () => {
    const tabId = await getTabId();
    await chrome.tabs.reload(tabId);
  };

  const handleRouteChange = (input: any) => {
    setActiveRoute(input);
  };

  const handleClose = () => setPbjsNamespaceDialogOpen(false);
  const handleClickOpen = () => setPbjsNamespaceDialogOpen(true);

  const handlePbjsNamespaceChange = (event: SelectChangeEvent) => {
    onPbjsNamespaceChange(event.target.value);
    setPbjsNamespace(event.target.value);
  };

  return (
    <AppBar
      sx={{
        p: 1,
        position: 'relative',
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        '&> a  ': { textDecoration: 'none' },
      }}
      className="navbar__container"
    >
      <Badge
        invisible={prebids && Object.keys(prebids).length < 2}
        badgeContent={(prebids && Object.keys(prebids).length) || null}
        color="primary"
        sx={{ width: '14%' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        onClick={handleClickOpen}
      >
        <img src={logo} width={'100%'} alt="prebid logo" />
      </Badge>

      {prebids && (
        <Dialog disableEscapeKeyDown open={pbjsNamespaceDialogOpen} onClose={handleClose}>
          <DialogTitle>Select Prebid Instance</DialogTitle>
          <DialogContent>
            <Box component="form">
              <FormControl sx={{ m: 1, minWidth: 180 }}>
                <Select value={pbjsNamespace || undefined} onChange={handlePbjsNamespaceChange} autoWidth>
                  {Object.keys(prebids).map((global, index) => (
                    <MenuItem key={index} value={global}>
                      {global}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'space-around' }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleClose}>Ok</Button>
          </DialogActions>
        </Dialog>
      )}

      <Box sx={{ maxWidth: { xs: 320, sm: 625 }, bgcolor: 'background.paper' }}>
        <Tabs value={selectedTab} onChange={handleChange} variant="scrollable" scrollButtons="auto" className="navbar__tabs">
          <Tab
            label={
              <Link to="/">
                <Button
                  size="small"
                  variant={activeRoute === '/' ? 'contained' : 'outlined'}
                  onClick={() => handleRouteChange('/')}
                  startIcon={<AdUnitsOutlinedIcon />}
                >
                  AdUnits
                </Button>
              </Link>
            }
            className="navbar__tab"
          />
          <Tab
            label={
              <Link to="bids">
                <Button
                  size="small"
                  variant={activeRoute === '/bids' ? 'contained' : 'outlined'}
                  onClick={() => handleRouteChange('/bids')}
                  startIcon={<AccountBalanceOutlinedIcon />}
                >
                  Bids
                </Button>
              </Link>
            }
            className="navbar__tab"
          />
          <Tab
            label={
              <Link to="timeline">
                <Button
                  size="small"
                  variant={activeRoute === '/timeline' ? 'contained' : 'outlined'}
                  onClick={() => handleRouteChange('/timeline')}
                  startIcon={<TimelineOutlinedIcon />}
                >
                  Timeline
                </Button>
              </Link>
            }
            className="navbar__tab"
          />
          <Tab
            label={
              <Link to="config">
                <Button
                  size="small"
                  variant={activeRoute === '/config' ? 'contained' : 'outlined'}
                  onClick={() => handleRouteChange('/config')}
                  startIcon={<SettingsOutlinedIcon />}
                >
                  Config
                </Button>
              </Link>
            }
            className="navbar__tab"
          />
          <Tab
            label={
              <Link to="userId">
                <Button
                  size="small"
                  variant={activeRoute === '/userId' ? 'contained' : 'outlined'}
                  onClick={() => handleRouteChange('/userId')}
                  startIcon={<ContactPageOutlinedIcon />}
                >
                  UserID
                </Button>
              </Link>
            }
            className="navbar__tab"
          />
          <Tab
            label={
              <Link to="tools">
                <Button
                  size="small"
                  variant={activeRoute === '/tools' ? 'contained' : 'outlined'}
                  onClick={() => handleRouteChange('/tools')}
                  startIcon={<DnsOutlinedIcon />}
                >
                  Tools
                </Button>
              </Link>
            }
            className="navbar__tab"
          />
          <Tab
            label={
              <Link to="events">
                <Button
                  size="small"
                  variant={activeRoute === '/events' ? 'contained' : 'outlined'}
                  onClick={() => handleRouteChange('/events')}
                  startIcon={<WarningAmberOutlinedIcon />}
                >
                  Events
                </Button>
              </Link>
            }
            className="navbar__tab"
          />
          <Tab
            label={
              <Link to="version">
                <Button
                  size="small"
                  variant={activeRoute === '/version' ? 'contained' : 'outlined'}
                  onClick={() => handleRouteChange('/version')}
                  startIcon={<DifferenceIcon />}
                >
                  Version
                </Button>
              </Link>
            }
            className="navbar__tab"
          />
        </Tabs>
      </Box>

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
        onClick={refresh}
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
    </AppBar>
  );
};

