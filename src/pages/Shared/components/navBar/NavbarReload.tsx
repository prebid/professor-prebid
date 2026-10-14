import React, { useContext } from 'react';
import { getTabId } from '../../utils';
import Box from '@mui/material/Box';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { IconButton } from '@mui/material';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import InspectedPageContext from '../../contexts/inspectedPageContext';

export const NavBarReload = (): JSX.Element => {
  const { downloading } = useContext(InspectedPageContext);
  const refresh = async () => {
    const tabId = await getTabId();
    await chrome.tabs.reload(tabId);
  };

  return (
    <Box flexDirection={'row'} display="flex" alignItems="top">
      <IconButton aria-label="refresh" color="default" sx={{ p: 0 }} onClick={() => chrome.tabs.create({ url: 'https://github.com/prebid/professor-prebid/issues' })}>
        <HelpOutlineOutlinedIcon />
      </IconButton>
      <IconButton sx={{ p: 0 }} aria-label="refresh" onClick={refresh} color={downloading === 'true' ? 'primary' : downloading === 'error' ? 'error' : 'default'}>
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
  );
};
