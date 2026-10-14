import React, { useContext, useState, useEffect } from 'react';
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
  const enterDelayRef = React.useRef<NodeJS.Timeout | null>(null);
  const leaveDelayRef = React.useRef<NodeJS.Timeout | null>(null);
  const { pbjsNamespace, setPbjsNamespace, frameId, setIframeId, prebids, isPanel } = useContext(StateContext);
  const pageContext = useContext(InspectedPageContext);

  useEffect(() => {
    return () => {
      if (enterDelayRef.current) clearTimeout(enterDelayRef.current);
      if (leaveDelayRef.current) clearTimeout(leaveDelayRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (leaveDelayRef.current) {
      clearTimeout(leaveDelayRef.current);
      leaveDelayRef.current = null;
    }
    enterDelayRef.current = setTimeout(() => {
      setExpanded(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (enterDelayRef.current) {
      clearTimeout(enterDelayRef.current);
      enterDelayRef.current = null;
    }
    leaveDelayRef.current = setTimeout(() => {
      setExpanded(false);
    }, 200);
  };

  const handlePbjsNamespaceChange = (event: SelectChangeEvent) => {
    sendChromeTabsMessage(PBJS_NAMESPACE_CHANGE, event.target.value);
    setPbjsNamespace(event.target.value || '');
  };

  const handleFrameIdChange = (event: SelectChangeEvent) => {
    setIframeId(event.target.value || '');
  };

  if (isPanel || expanded) {
    return (
      <Box component="form" sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', columnGap: 1, padding: '0 5px' }} onMouseEnter={() => setExpanded(true)} onMouseLeave={() => setExpanded(false)}>
        <FormControl sx={{ minWidth: 90, maxWidth: 180 }} size="small">
          <InputLabel
            id="frame-id-select-label"
            size="small"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 500,
              lineHeight: 1,
              '&.MuiInputLabel-shrink': {
                transform: 'translate(14px, -5px) scale(0.85)',
                fontWeight: 600,
                color: 'text.primary',
                backgroundColor: 'background.paper',
                paddingX: '3px',
              },
            }}
          >
            Frame-ID
          </InputLabel>
          <Select
            labelId="frame-id-select-label"
            id="frame-id-select"
            size="small"
            value={frameId}
            label="Frame-ID"
            onChange={handleFrameIdChange}
            sx={{
              fontSize: '0.8rem',
              height: 28,
              paddingY: 0,
              '& .MuiSelect-select': {
                paddingY: '3px',
                display: 'flex',
                alignItems: 'center',
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: { fontSize: '0.8rem' },
              },
            }}
          >
            {pageContext &&
              Object.keys(pageContext.frames || {})
                .filter((key) => !['downloading', 'syncState', 'initReqChainResult'].includes(key))
                .map((frameId) => (
                  <MenuItem value={frameId} key={frameId} sx={{ fontSize: '0.8rem', minHeight: 28 }}>
                    <em>{frameId}</em>
                  </MenuItem>
                ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 110, maxWidth: 330 }} size="small">
          <InputLabel
            id="namespace-select-label"
            size="small"
            sx={{
              fontSize: '0.75rem',
              fontWeight: 500,
              lineHeight: 1,
              '&.MuiInputLabel-shrink': {
                transform: 'translate(14px, -5px) scale(0.85)',
                fontWeight: 600,
                color: 'text.primary',
                backgroundColor: 'background.paper',
                paddingX: '3px',
              },
            }}
          >
            Namespace
          </InputLabel>
          <Select
            labelId="namespace-select-label"
            id="namespace-select"
            size="small"
            value={pbjsNamespace}
            label="Namespace"
            onChange={handlePbjsNamespaceChange}
            autoWidth
            sx={{
              fontSize: '0.8rem',
              height: 28,
              paddingY: 0,
              '& .MuiSelect-select': {
                paddingY: '3px',
                display: 'flex',
                alignItems: 'center',
              },
            }}
            MenuProps={{
              PaperProps: {
                sx: { fontSize: '0.8rem' },
              },
            }}
          >
            {prebids &&
              Object.keys(prebids).map((global) => (
                <MenuItem key={global} value={global} sx={{ fontSize: '0.8rem', minHeight: 28 }}>
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
