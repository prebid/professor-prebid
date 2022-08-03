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
  const theme = useTheme();

  const [detectedBidderNames, setDetectedBidderNames] = useState<string[]>([]);

  const [bidderFilterEnabled, setBidderFilterEnabled] = useState<boolean>(false);

  const [selectedBidders, setSelectedBidders] = React.useState<string[]>([]);

  const handleSelectionChange = (event: SelectChangeEvent<string[]>) => {
    updateSelectedBidders(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value);
  };

  const handleDelete = (bidderToDelete: string) => () => {
    updateSelectedBidders(selectedBidders.filter((bidder) => bidder !== bidderToDelete));
  };

  const updateSelectedBidders = (biddersArray: string[]) => {
    setSelectedBidders(() => [...biddersArray]);
    setBidderFilterEnabled(true);
    if (biddersArray.length === 0 && debugConfigState) {
      delete debugConfigState.bidders;
    } else {
      debugConfigState = debugConfigState || {};
      debugConfigState.bidders = biddersArray;
    }
    setDebugConfigState({ ...debugConfigState });
  };

  const handleBidderFilterEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debugConfigState = debugConfigState || {};
    debugConfigState.bidders = event.target.checked ? selectedBidders : undefined;
    setBidderFilterEnabled(event.target.checked);
    setDebugConfigState({ ...debugConfigState });
  };

  useEffect(() => {
    setBidderFilterEnabled(!!Array.isArray(debugConfigState?.bidders));
    setSelectedBidders(debugConfigState?.bidders || []);
  }, [debugConfigState?.bidders]);

  useEffect(() => {
    const events = prebid.events?.filter((event) => ['auctionInit', 'auctionEnd'].includes(event.eventType)) || [];
    const bidderNamesSet = events?.reduce((previousValue, currentValue) => {
      const adUnitsArray = (currentValue as IPrebidAuctionEndEventData).args.adUnits || [];
      adUnitsArray.forEach((adUnit) => adUnit.bids.forEach((bid) => previousValue.add(bid.bidder)));
      return previousValue;
    }, new Set<string>());
    setDetectedBidderNames(Array.from(bidderNamesSet));
  }, [prebid.events]);

  logger.log(`[PopUp][BidderFilterComponent]: render `, detectedBidderNames, bidderFilterEnabled, selectedBidders);
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
                  <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    key={value}
                    label={value}
                    onDelete={handleDelete(value)}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                    }}
                  />
                ))}
              </Box>
            )}
            disabled={!bidderFilterEnabled}
          >
            {detectedBidderNames.map((name) => (
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
