import React, { useContext, useState } from 'react';
import { sendChromeTabsMessage } from '../../utils';
import { PBJS_NAMESPACE_CHANGE } from '../../constants';
import Box from '@mui/material/Box';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Badge from '@mui/material/Badge';
import { InputLabel } from '@mui/material';
import StateContext from '../../contexts/appStateContext';
import InspectedPageContext from '../../contexts/inspectedPageContext';
import PrebidLogo from './Logo';
declare const __APP_VERSION__: string;
export const NavbarSelector = (): JSX.Element => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [enterDelay, setEnterDelay] = useState<NodeJS.Timeout | null>(null);
  const [leaveDelay, setLeaveDelay] = useState<NodeJS.Timeout | null>(null);
  const { pbjsNamespace, setPbjsNamespace, frameId, setIframeId, prebids, isPanel } = useContext(StateContext);
  const pageContext = useContext(InspectedPageContext);

  const handleMouseEnter = () => {
    if (leaveDelay) {
      clearTimeout(leaveDelay);
      setLeaveDelay(null);
    }
    setEnterDelay(
      setTimeout(() => {
        setExpanded(true);
      }, 200) // Delay of 200ms
    );
  };

  const handleMouseLeave = () => {
    if (enterDelay) {
      clearTimeout(enterDelay);
      setEnterDelay(null);
    }
    setLeaveDelay(
      setTimeout(() => {
        setExpanded(false);
      }, 200)
    );
  };

  const handlePbjsNamespaceChange = (event: SelectChangeEvent) => {
    sendChromeTabsMessage(PBJS_NAMESPACE_CHANGE, event.target.value);
    setPbjsNamespace(event.target.value || '');
  };

  const handleFrameIdChange = (event: SelectChangeEvent) => {
    setIframeId(event.target.value || '');
  };

  if (
    isPanel ||
    expanded
    // true
  ) {
    return (
      <Box component="form" sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', columnGap: 1, padding: '0 5px', '& MuiInputLabel': { top: '4px' } }} onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}>
        <FormControl sx={{ minWidth: 90, maxWidth: 180 }} size="small">
          <InputLabel sx={{ fontSize: '0.8rem', top: '-4px' }}>Frame-ID</InputLabel>
          <Select
            size="small"
            value={frameId}
            label="frameId"
            onChange={handleFrameIdChange}
            sx={{ fontSize: '0.8rem', height: 28, paddingY: 0 }}
            MenuProps={{
              PaperProps: {
                sx: { fontSize: '0.8rem' },
              },
            }}
          >
            {pageContext &&
              Object.keys(pageContext.frames || {})
                .filter((key) => !['downloading', 'syncState', 'initReqChainResult'].includes(key))
                .map((frameId, index) => (
                  <MenuItem value={frameId} key={index} sx={{ fontSize: '0.8rem', minHeight: 28 }}>
                    <em>{frameId}</em>
                  </MenuItem>
                ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 110, maxWidth: 330 }} size="small">
          <InputLabel sx={{ fontSize: '0.8rem', top: '-4px' }}>Namespace</InputLabel>
          <Select
            size="small"
            value={pbjsNamespace}
            onChange={handlePbjsNamespaceChange}
            autoWidth
            sx={{ fontSize: '0.8rem', height: 28, paddingY: 0 }}
            MenuProps={{
              PaperProps: {
                sx: { fontSize: '0.8rem' },
              },
            }}
          >
            {prebids &&
              Object.keys(prebids).map((global, index) => (
                <MenuItem key={index} value={global} sx={{ fontSize: '0.8rem', minHeight: 28 }}>
                  {global}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Box>
    );
  } else {
    return (
      <Badge
        invisible={prebids && Object.keys(prebids).length < 2}
        badgeContent={(prebids && Object.keys(prebids).length) || null}
        color="primary"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        children={<PrebidLogo version={`${__APP_VERSION__.split('.')[0]}.${__APP_VERSION__.split('.')[1]}`} />}
      />
    );
  }
};
