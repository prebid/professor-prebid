import { IPrebidDetails, IPrebidDebugConfig } from '../../../../../inject/scripts/prebid';
import BidderFilterComponent from './BidderFilterComponent';
import BidOverWriteComponent from './BidOverWriteComponent';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import React, { useEffect, useState } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import logger from '../../../../../logger';
import { getTabId } from '../../../utils';
import { useTheme } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';
import FormControl from '@mui/material/FormControl';

const ModifyBidResponsesComponent = ({ prebid }: ModifyBidResponsesComponentProps): JSX.Element => {
  const theme = useTheme();
  const [debugConfgigState, setDebugConfigState] = useState<IPrebidDebugConfig>(null);

  const handleChange = async (input: IPrebidDebugConfig) => {
    input = { ...debugConfgigState, ...input };
    setDebugConfigState(input);
    const tabId = await getTabId();
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (namespace: string, input: object) => {
        sessionStorage.setItem(`${namespace}:debugging`, `${JSON.stringify(input)}`);
      },
      args: [prebid.namespace, input],
    });
  };

  const handleEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleChange({ enabled: event.target.checked });
  };

  // read config from session storage & set states on mount
  useEffect(() => {
    const getInitialState = async () => {
      const tabId = await getTabId();
      const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: (namespace: string) => {
          return sessionStorage.getItem(`${namespace}:debugging`);
        },
        args: [prebid.namespace],
      });

      const savedConfig: IPrebidDebugConfig = JSON.parse(result[0].result);
      setDebugConfigState(savedConfig);
    };
    getInitialState();
  }, [prebid.namespace]);

  logger.log(`[PopUp][ModifyBidResponsesComponent]: render `, debugConfgigState);
  return (
    <React.Fragment>
      <Grid item md={1} xs={1}>
        <Box sx={{ alignContent: 'center', [theme.breakpoints.down('sm')]: { transform: 'rotate(90deg)' } }}>
          <FormControl>
            <FormControlLabel control={<Switch checked={!!debugConfgigState?.enabled || false} onChange={handleEnabledChange} />} label="" />
          </FormControl>
        </Box>
      </Grid>
      <Grid item xs={11} md={11}>
        <Box sx={{ border: 1, borderColor: debugConfgigState?.enabled ? 'primary.main' : 'text.disabled', borderRadius: 1 }}>
          <Typography variant="h4" sx={{ width: 1, p: 1.5, color: debugConfgigState?.enabled ? 'primary.main' : 'text.disabled' }}>
            Enable Debugging
          </Typography>
        </Box>
      </Grid>
      <BidderFilterComponent prebid={prebid} debugConfigState={debugConfgigState} setDebugConfigState={handleChange} />
      <BidOverWriteComponent prebid={prebid} debugConfigState={debugConfgigState} setDebugConfigState={handleChange} />
    </React.Fragment>
  );
};

interface ModifyBidResponsesComponentProps {
  prebid: IPrebidDetails;
}

export default ModifyBidResponsesComponent;
