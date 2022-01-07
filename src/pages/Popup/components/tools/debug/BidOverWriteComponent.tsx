import { IPrebidAuctionEndEventData, IPrebidDetails, IPrebidDebugConfig, IPrebidDebugConfigBid } from '../../../../../inject/scripts/prebid';
import TextField from '@mui/material/TextField';
import React, { useEffect, useState } from 'react';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Theme, useTheme } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import logger from '../../../../../logger';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = { PaperProps: { style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 1 } } };

const getStyles = (name: string, selectedBidders: string[], theme: Theme) => ({
  fontWeight: selectedBidders?.indexOf(name) === -1 ? theme.typography.fontWeightRegular : theme.typography.fontWeightMedium,
});

const BidOverWriteComponent = ({ prebid, debugConfigState, setDebugConfigState }: BidOverWriteComponentProps): JSX.Element => {
  debugConfigState = debugConfigState || {};
  const theme = useTheme();
  const [bidderNames, setBidderNames] = useState<string[]>([]);
  const [bidsFilterEnabled, setBidsFilterEnabled] = useState<boolean>(!!(debugConfigState.bids?.length > 0));
  const [cpm, setCpm] = React.useState(20.0);
  const [selectedBids, setSelectedBids] = React.useState<IPrebidDebugConfigBid[]>(debugConfigState.bids || []);

  const handleSelectionChange = (event: SelectChangeEvent<string[]>) => {
    const biddersArray = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;
    setSelectedBids(() => [...biddersArray.map((bidder: string) => ({ bidder, cpm }))]);
    setBidsFilterEnabled(true);
    if (biddersArray.length === 0) {
      delete debugConfigState.bids;
    } else {
      debugConfigState.bids = [...biddersArray.map((bidder: string) => ({ bidder, cpm }))];
    }
    setDebugConfigState({ ...debugConfigState });
  };

  const handleBidsFilterEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBidsFilterEnabled(event.target.checked);
    debugConfigState.bids = event.target.checked ? selectedBids : undefined;
    setDebugConfigState({ ...debugConfigState });
  };

  const handleCpmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCpm(Number(event.target.value));
  };

  useEffect(() => {
    setBidsFilterEnabled(!!Array.isArray(debugConfigState.bids));
    setSelectedBids(debugConfigState.bids || []);
  }, [debugConfigState.bids]);

  useEffect(() => {
    const events = prebid.events.filter((event) => ['auctionInit', 'auctionEnd'].includes(event.eventType));
    const bidderNamesSet = events.reduce((previousValue, currentValue) => {
      const adUnitsArray = (currentValue as IPrebidAuctionEndEventData).args.adUnits || [];
      adUnitsArray.forEach((adUnit) => adUnit.bids.forEach((bid: any) => previousValue.add(bid.bidder)));
      return previousValue;
    }, new Set<string>());
    setBidderNames(Array.from(bidderNamesSet));
  }, [prebid.events]);

  logger.log(`[PopUp][BidOverWriteComponent]: render `, bidderNames, bidsFilterEnabled, cpm, selectedBids);
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        width: 1,
      }}
    >
      <Box sx={{ width: 0.1 }}>
        <FormControl>
          <FormControlLabel label="" control={<Switch checked={bidsFilterEnabled} onChange={handleBidsFilterEnabledChange} />} />
        </FormControl>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          justifyContent: 'space-between',
          width: 0.9,
          columnGap: 0.5,
        }}
      >
        <FormControl sx={{ width: 0.1, maxWidth: 0.1 }}>
          <Box component="form" noValidate autoComplete="off" sx={{ width: 1 }}>
            <TextField
              type="number"
              label="cpm"
              value={cpm}
              onChange={handleCpmChange}
              variant="outlined"
              sx={{ width: 1, '& .MuiOutlinedInput-root': { height: 56 } }}
              disabled={!bidsFilterEnabled}
            />
          </Box>
        </FormControl>

        <FormControl sx={{ width: 0.9, maxWidth: 0.9 }}>
          <InputLabel>Select Bidder(s)</InputLabel>
          <Select
            multiple
            value={selectedBids.map((selectedBid) => selectedBid.bidder)}
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
            disabled={!bidsFilterEnabled}
          >
            {bidderNames.map((name) => (
              <MenuItem
                key={name}
                value={name}
                style={getStyles(
                  name,
                  selectedBids.map((selectedBid) => selectedBid.bidder),
                  theme
                )}
              >
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};

interface BidOverWriteComponentProps {
  prebid: IPrebidDetails;
  debugConfigState: IPrebidDebugConfig;
  setDebugConfigState: (debugConfigState: IPrebidDebugConfig) => void;
}

export default BidOverWriteComponent;
