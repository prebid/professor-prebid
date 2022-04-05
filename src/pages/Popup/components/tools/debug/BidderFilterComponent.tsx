import { IPrebidAuctionEndEventData, IPrebidDetails, IPrebidDebugConfig } from '../../../../../inject/scripts/prebid';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import React, { useEffect, useState } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Chip from '@mui/material/Chip';
import logger from '../../../../../logger';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material';

const BidderFilterComponent = ({ prebid, debugConfigState, setDebugConfigState }: BidderFilterComponentProps): JSX.Element => {
  debugConfigState = debugConfigState || {};
  const theme = useTheme();
  const [bidderNames, setBidderNames] = useState<string[]>([]);
  const [bidderFilterEnabled, setBidderFilterEnabled] = useState<boolean>(!!(debugConfigState.bidders?.length > 0));
  const [selectedBidders, setSelectedBidders] = React.useState<string[]>(debugConfigState.bidders || []);

  const handleSelectionChange = (event: SelectChangeEvent<string[]>) => {
    const biddersArray = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;
    setSelectedBidders(() => [...biddersArray]);
    setBidderFilterEnabled(true);
    if (biddersArray.length === 0) {
      delete debugConfigState.bidders;
    } else {
      debugConfigState.bidders = biddersArray;
    }
    setDebugConfigState({ ...debugConfigState });
  };

  const handleBidderFilterEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBidderFilterEnabled(event.target.checked);
    debugConfigState.bidders = event.target.checked ? selectedBidders : undefined;
    setDebugConfigState({ ...debugConfigState });
  };

  useEffect(() => {
    setBidderFilterEnabled(!!Array.isArray(debugConfigState.bidders));
    setSelectedBidders(debugConfigState.bidders || []);
  }, [debugConfigState.bidders]);

  useEffect(() => {
    const events = prebid.events?.filter((event) => ['auctionInit', 'auctionEnd'].includes(event.eventType)) || [];
    const bidderNamesSet = events?.reduce((previousValue, currentValue) => {
      const adUnitsArray = (currentValue as IPrebidAuctionEndEventData).args.adUnits || [];
      adUnitsArray.forEach((adUnit) => adUnit.bids.forEach((bid) => previousValue.add(bid.bidder)));
      return previousValue;
    }, new Set<string>());
    setBidderNames(Array.from(bidderNamesSet));
  }, [prebid.events]);
  logger.log(`[PopUp][BidderFilterComponent]: render `, bidderNames, bidderFilterEnabled, selectedBidders);
  return (
    <React.Fragment>
      <Grid item md={1} xs={1}>
        <Box sx={{ [theme.breakpoints.down('sm')]: { transform: 'rotate(90deg)' } }}>
          <FormControl>
            <FormControlLabel label=" " control={<Switch checked={bidderFilterEnabled} onChange={handleBidderFilterEnabledChange} />} />
          </FormControl>
        </Box>
      </Grid>
      <Grid item xs={11} md={11}>
        <FormControl sx={{ display: 'flex' }}>
          <InputLabel>Filter Bidder(s)</InputLabel>
          <Select
            multiple
            value={selectedBidders}
            onChange={handleSelectionChange}
            input={<OutlinedInput label="Detected Bidders" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selected.map((value) => (
                  <Chip color="primary" variant="outlined" key={value} label={value} />
                ))}
              </Box>
            )}
            disabled={!bidderFilterEnabled}
          >
            {bidderNames.map((name) => (
              <MenuItem
                key={name}
                value={name}
                sx={{ fontWeight: selectedBidders?.indexOf(name) === -1 ? 'typography.fontWeightRegular' : 'typography.fontWeightMedium' }}
              >
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </React.Fragment>
  );
};

interface BidderFilterComponentProps {
  prebid: IPrebidDetails;
  debugConfigState: IPrebidDebugConfig;
  setDebugConfigState: (debugConfigState: object) => void;
}

export default BidderFilterComponent;
