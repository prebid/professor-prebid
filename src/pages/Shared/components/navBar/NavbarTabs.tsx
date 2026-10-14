import React, { useContext, useEffect } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import { PAGES } from '../../constants';
import AppStateContext from '../../contexts/appStateContext';
import OptionsContext from '../../contexts/optionsContext';
import NavBarState from './NavBarState';

export const NavBarTabs = (): JSX.Element => {
  const { activeRoute, setActiveRoute, selectedTab, setSelectedTab, filteredPages, setFilteredPages } = NavBarState();
  const { selectedPopUpNavItems, selectedPanelNavItems } = useContext(OptionsContext);
  const { isPanel } = useContext(AppStateContext);

  useEffect(() => {
    if (isPanel) {
      setFilteredPages(PAGES.filter((page) => selectedPanelNavItems.includes(page.path)));
    } else {
      setFilteredPages(PAGES.filter((page) => selectedPopUpNavItems.includes(page.path)));
    }
  }, [isPanel, selectedPanelNavItems, selectedPopUpNavItems]);

  return (
    <Tabs
      value={selectedTab}
      onChange={(event: React.SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue);
      }}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        display: 'flex',
        flexGrow: 1,
        justifyContent: 'top',
        alignContent: 'top',
        '& .MuiTabs-indicator': { display: 'none' },
        '& .MuiTabScrollButton-root': {
          width: '10px',
        },
        'svg[data-testid="KeyboardArrowRightIcon"],svg[data-testid="KeyboardArrowLeftIcon"]': {
          fill: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      {filteredPages.map(({ label, path, Icon }) => (
        <Tab
          label={
            <Button
              sx={{ paddingTop: '2px !important', paddingRight: '5px !important', paddingBottom: '2px !important', paddingLeft: '5px !important' }}
              component={Link}
              to={path}
              size="small"
              variant={activeRoute === `/${path}` ? 'contained' : 'outlined'}
              onClick={() => setActiveRoute(`/${path}`)}
              startIcon={<Icon fontSize="inherit" />}
            >
              {label}
            </Button>
          }
          sx={{ padding: '0px 3px', minWidth: 'initial' }}
          key={path}
        ></Tab>
      ))}
    </Tabs>
  );
};
