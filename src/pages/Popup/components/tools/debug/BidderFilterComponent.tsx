import { IPrebidAuctionEndEventData, IPrebidDetails, IPrebidDebugConfig } from '../../../../../inject/scripts/prebid';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import React, { useEffect, useState } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Theme, useTheme } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Chip from '@mui/material/Chip';
import logger from '../../../../../logger';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = { PaperProps: { style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 250 } } };
const getStyles = (name: string, selectedBidders: string[], theme: Theme) => ({
  fontWeight: selectedBidders?.indexOf(name) === -1 ? theme.typography.fontWeightRegular : theme.typography.fontWeightMedium,
});

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
    const events = prebid.events.filter((event) => ['auctionInit', 'auctionEnd'].includes(event.eventType));
    const bidderNamesSet = events.reduce((previousValue, currentValue) => {
      const adUnitsArray = (currentValue as IPrebidAuctionEndEventData).args.adUnits || [];
      adUnitsArray.forEach((adUnit) => adUnit.bids.forEach((bid: any) => previousValue.add(bid.bidder)));
      return previousValue;
    }, new Set<string>());
    setBidderNames(Array.from(bidderNamesSet));
  }, [prebid.events]);
  logger.log(`[PopUp][BidderFilterComponent]: render `, bidderNames, bidderFilterEnabled, selectedBidders);
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        width: 1,
      }}
    >
      <FormControl>
        <FormControlLabel label="" control={<Switch checked={bidderFilterEnabled} onChange={handleBidderFilterEnabledChange} />} />
      </FormControl>

      <FormControl
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          justifyContent: 'space-between',
          width: 1,
          maxWidth: 1
        }}
      >
        <InputLabel>Filter Bidder(s)</InputLabel>
        <Select
          multiple
          value={selectedBidders}
          onChange={handleSelectionChange}
          input={<OutlinedInput label="Detected Bidders" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} />
              ))}
            </Box>
          )}
          MenuProps={MenuProps}
          disabled={!bidderFilterEnabled}
          sx={{ width: 1 }}
        >
          {bidderNames.map((name) => (
            <MenuItem key={name} value={name} style={getStyles(name, selectedBidders, theme)}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

interface BidderFilterComponentProps {
  prebid: IPrebidDetails;
  debugConfigState: IPrebidDebugConfig;
  setDebugConfigState: (debugConfigState: any) => void;
}

export default BidderFilterComponent;
