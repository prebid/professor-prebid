import React, { useContext, useEffect, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import { PAGES } from '../../constants';
import AppStateContext from '../../contexts/appStateContext';
import OptionsContext from '../../contexts/optionsContext';

export const NavBarTabs = (): JSX.Element => {
  const [activeRoute, setActiveRoute] = useState<string>(window.location.hash.replace('#', '') || '/');
  const [selectedTab, setSelectedTab] = React.useState(0);
  const [filteredPages, setFilteredPages] = useState(PAGES);
  const { selectedPopUpNavItems, selectedPanelNavItems } = useContext(OptionsContext);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleRouteChange = (input: any) => {
    setActiveRoute(input);
  };

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
      {filteredPages.map(({ label, path, Icon, beta }) => (
        <Tab
          label={
            <Button component={Link} to={path} size="small" variant={activeRoute === `/${path}` ? 'contained' : 'outlined'} onClick={() => handleRouteChange(`/${path}`)} startIcon={<Icon />}>
              {label}
            </Button>
          }
          sx={{ padding: '0px 3px', minWidth: 'initial' }}
        ></Tab>
      ))}
    </Tabs>
  );
};
