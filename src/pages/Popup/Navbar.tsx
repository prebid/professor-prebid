import React, { useState, useContext } from 'react';
import { getTabId } from './utils';
import { PBJS_NAMESPACE_CHANGE } from '../Shared/constants';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
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
import StateContext from '../Shared/contexts/appStateContext';
import InspectedPageContext from '../Shared/contexts/inspectedPageContext';

const onPbjsNamespaceChange = async (pbjsNamespace: string) => {
  const tabId = await getTabId();
  chrome.tabs.sendMessage(tabId, { type: PBJS_NAMESPACE_CHANGE, pbjsNamespace });
};

export const NavBar = (): JSX.Element => {
  const [activeRoute, setActiveRoute] = useState<string>(window.location.hash.replace('#', '') || '/');
  const [pbjsNamespaceDialogOpen, setPbjsNamespaceDialogOpen] = React.useState(false);
  const { pbjsNamespace, setPbjsNamespace } = useContext(StateContext);
  const { prebids, downloading } = useContext(InspectedPageContext);

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
    >
      <Badge
        invisible={prebids && Object.keys(prebids).length < 2}
        badgeContent={(prebids && Object.keys(prebids).length) || null}
        color="primary"
        sx={{ width: '14%' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        onClick={handleClickOpen}
      >
        <img src="https://prebid.org/wp-content/uploads/2021/02/Prebid-Logo-RGB-Full-Color-Medium.svg" width={'100%'} alt="prebid logo" />
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
