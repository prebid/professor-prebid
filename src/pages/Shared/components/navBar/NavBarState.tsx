import { useState } from 'react';
import { PAGES } from '../../constants';
import React from 'react';

const NavBarState = () => {
  const [activeRoute, setActiveRoute] = useState<string>(window.location.hash.replace('#', '') || '/');
  const [selectedTab, setSelectedTab] = React.useState(0);
  const [filteredPages, setFilteredPages] = useState(PAGES);

  return {
    activeRoute,
    setActiveRoute,
    selectedTab,
    setSelectedTab,
    filteredPages,
    setFilteredPages,
  };
};

export default NavBarState;
