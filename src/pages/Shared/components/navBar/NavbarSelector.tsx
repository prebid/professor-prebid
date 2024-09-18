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
import logo from '../../../../assets/img/logo.png';

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

  if (isPanel || expanded) {
    return (
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', columnGap: 1, padding: '0 5px' }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <FormControl sx={{ minWidth: 110, maxWidth: 330 }} size="small">
          <InputLabel>Frame-ID</InputLabel>
          <Select value={frameId} label="frameId" onChange={handleFrameIdChange}>
            {pageContext &&
              Object.keys(pageContext.frames || {})
                .filter((key) => !['downloading', 'syncState', 'initReqChainResult'].includes(key))
                .map((frameId, index) => (
                  <MenuItem value={frameId} key={index}>
                    <em>{frameId}</em>
                  </MenuItem>
                ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 110, maxWidth: 330 }} size="small">
          <InputLabel>Namespace</InputLabel>
          <Select value={pbjsNamespace} onChange={handlePbjsNamespaceChange} autoWidth>
            {prebids &&
              Object.keys(prebids).map((global, index) => (
                <MenuItem key={index} value={global}>
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
        sx={{ width: '14%', pr: '6px' }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        children={
          <img
            src={logo}
            alt="prebid logo"
            style={{
              padding: '0 5px',
              width: '100%',
              height: 'auto', // This will ensure the aspect ratio is maintained
              objectFit: 'contain', // This will ensure the image scales correctly
            }}
          />
        }
      />
    );
  }
};
