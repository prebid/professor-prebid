import React, { useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import AdUnitsOutlinedIcon from '@mui/icons-material/AdUnitsOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import { Link } from 'react-router-dom';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import DifferenceIcon from '@mui/icons-material/Difference';

export const NavBarTabs = (): JSX.Element => {
  const [activeRoute, setActiveRoute] = useState<string>(window.location.hash.replace('#', '') || '/');

  const [selectedTab, setSelectedTab] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleRouteChange = (input: any) => {
    setActiveRoute(input);
  };

  return (
    <Tabs
      value={selectedTab}
      onChange={handleChange}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        '& .MuiTabs-indicator': { display: 'none' },
        '& .MuiTabScrollButton-root': {
          width: '19px',
        },
        'svg[data-testid="KeyboardArrowRightIcon"],svg[data-testid="KeyboardArrowLeftIcon"]': {
          fill: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <Tab
        label={
          <Button
            component={Link}
            to="/"
            size="small"
            variant={activeRoute === '/' ? 'contained' : 'outlined'}
            onClick={() => handleRouteChange('/')}
            startIcon={<AdUnitsOutlinedIcon />}
          >
            AdUnits
          </Button>
        }
        sx={{ padding: '0px 3px', minWidth: 'initial' }}
      />
      <Tab
        label={
          <Button
            to="bids"
            component={Link}
            size="small"
            variant={activeRoute === '/bids' ? 'contained' : 'outlined'}
            onClick={() => handleRouteChange('/bids')}
            startIcon={<AccountBalanceOutlinedIcon />}
          >
            Bids
          </Button>
        }
        sx={{ padding: '0px 3px', minWidth: 'initial' }}
      />
      <Tab
        label={
          <Button
            to="timeline"
            component={Link}
            size="small"
            variant={activeRoute === '/timeline' ? 'contained' : 'outlined'}
            onClick={() => handleRouteChange('/timeline')}
            startIcon={<TimelineOutlinedIcon />}
          >
            Timeline
          </Button>
        }
        sx={{ padding: '0px 3px', minWidth: 'initial' }}
      />
      <Tab
        label={
          <Button
            to="config"
            size="small"
            component={Link}
            variant={activeRoute === '/config' ? 'contained' : 'outlined'}
            onClick={() => handleRouteChange('/config')}
            startIcon={<SettingsOutlinedIcon />}
          >
            Config
          </Button>
        }
        sx={{ padding: '0px 3px', minWidth: 'initial' }}
      />
      <Tab
        label={
          <Button
            to="userId"
            component={Link}
            size="small"
            variant={activeRoute === '/userId' ? 'contained' : 'outlined'}
            onClick={() => handleRouteChange('/userId')}
            startIcon={<ContactPageOutlinedIcon />}
          >
            UserID
          </Button>
        }
        sx={{ padding: '0px 3px', minWidth: 'initial' }}
      />
      <Tab
        label={
          <Button
            component={Link}
            to="tools"
            size="small"
            variant={activeRoute === '/tools' ? 'contained' : 'outlined'}
            onClick={() => handleRouteChange('/tools')}
            startIcon={<DnsOutlinedIcon />}
          >
            Tools
          </Button>
        }
        sx={{ padding: '0px 3px', minWidth: 'initial' }}
      />
      <Tab
        label={
          <Button
            to="events"
            component={Link}
            size="small"
            variant={activeRoute === '/events' ? 'contained' : 'outlined'}
            onClick={() => handleRouteChange('/events')}
            startIcon={<WarningAmberOutlinedIcon />}
          >
            Events
          </Button>
        }
        sx={{ padding: '0px 3px', minWidth: 'initial' }}
      />
      <Tab
        label={
          <Button
            to="version"
            component={Link}
            size="small"
            variant={activeRoute === '/version' ? 'contained' : 'outlined'}
            onClick={() => handleRouteChange('/version')}
            startIcon={<DifferenceIcon />}
          >
            Version
          </Button>
        }
        sx={{ padding: '0px 3px', minWidth: 'initial' }}
      />
    </Tabs>
  );
};
