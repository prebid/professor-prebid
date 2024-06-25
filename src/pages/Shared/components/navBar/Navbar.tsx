import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import { NavbarSelector } from './NavbarSelector';
import { NavBarTabs } from './NavbarTabs';
import { NavBarReload } from './NavbarReload';

export const NavBar = (): JSX.Element => {
  return (
    <AppBar
      id="floNavbar"
      sx={{
        position: 'relative',
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        '&> a  ': { textDecoration: 'none' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          maxWidth: 'calc(100vw - 48px)',
        }}
      >
        <NavbarSelector />
        <NavBarTabs />
      </Box>

      <NavBarReload />
    </AppBar>
  );
};
