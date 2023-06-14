import React, { useEffect, useState, useContext } from 'react';
import { Theme, useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { IPrebidAuctionEndEventData, IPrebidDebugConfig, IPrebidDebugConfigBid } from '../../../../Content/scripts/prebid';
import AppStateContext from '../../../contexts/appStateContext';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = { PaperProps: { style: { maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP, width: 1 } } };

const getStyles = (name: string, selectedBidders: string[], theme: Theme) => ({
  fontWeight: selectedBidders?.indexOf(name) === -1 ? theme.typography.fontWeightRegular : theme.typography.fontWeightMedium,
});

const BidOverWriteComponent = ({ debugConfigState, setDebugConfigState }: BidOverWriteComponentProps): JSX.Element => {
  const { events } = useContext(AppStateContext);
  const theme = useTheme();

  const [detectedBidderNames, setDetectedBidderNames] = useState<string[]>([]);
  const [detectedAdUnitCodes, setDetectedAdUnitCodes] = useState<string[]>([]);

  const [bidsOverwriteEnabled, setBidOverwriteEnabled] = useState<boolean>(false);
  const [cpm, setCpm] = useState<number>(20.0);
  const [currency, setCurrency] = useState<string>('USD');

  const [selectedBidders, setSelectedBidders] = React.useState<string[]>(debugConfigState?.bidders || []);
  const [selectedAdUnitCodes, setSelectedAdUnitCodes] = React.useState<string[]>(debugConfigState?.bids?.map((bid) => bid.adUnitCode) || []);

  const handleAdunitSelectionChange = (event: SelectChangeEvent<string[]>) => {
    const selectedAdUnitCodesArray = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;
    updateDebugConfig(selectedAdUnitCodesArray, selectedBidders, cpm, currency);
  };

  const handleBidderSelectionChange = (event: SelectChangeEvent<string[]>) => {
    const selectedBiddersArray = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;
    updateDebugConfig(selectedAdUnitCodes, selectedBiddersArray, cpm, currency);
  };

  const handleBidderDelete = (bidderToDelete: string) => () => {
    const newBidderArray = selectedBidders.filter((bidder) => bidder !== bidderToDelete);
    setSelectedBidders(newBidderArray);
    updateDebugConfig(selectedAdUnitCodes, newBidderArray, cpm, currency);
  };

  const handleAdUnitDelete = (adUnitCodeToDelete: string) => () => {
    const newAdUnitCodeArray = selectedAdUnitCodes.filter((adUnitCode) => adUnitCode !== adUnitCodeToDelete);
    setSelectedAdUnitCodes(newAdUnitCodeArray);
    updateDebugConfig(newAdUnitCodeArray, selectedBidders, cpm, currency);
  };

  const handleBidOverWriteEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBidOverwriteEnabled(event.target.checked);
    if (!event.target.checked) {
      setDebugConfigState({ ...debugConfigState, bids: undefined });
    }
  };

  const handleCpmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCpm(Number(event.target.value));
    updateDebugConfig(selectedAdUnitCodes, selectedBidders, Number(event.target.value), currency);
  };

  const handleCurrencyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrency(event.target.value);
    updateDebugConfig(selectedAdUnitCodes, selectedBidders, cpm, event.target.value);
  };

  const updateDebugConfig = (selectedAdUnitCodes: string[], selectedBidders: string[], cpm: number, currency: string): void => {
    const bids: IPrebidDebugConfigBid[] = [];
    if (selectedAdUnitCodes.length === 0) {
      selectedBidders.forEach((bidder: string) => {
        bids.push({ bidder, cpm, currency });
      });
    } else {
      selectedAdUnitCodes.forEach((adUnitCode: string) => {
        selectedBidders.forEach((bidder: string) => {
          bids.push({ adUnitCode, bidder, cpm, currency });
        });
      });
    }
    if (bids.length > 0) {
      setDebugConfigState({ ...debugConfigState, bids });
    } else {
      setDebugConfigState({ ...debugConfigState, bids: undefined });
    }
  };

  useEffect(() => {
    if (!bidsOverwriteEnabled) {
      setBidOverwriteEnabled(!!Array.isArray(debugConfigState?.bids));
    }
    setCpm(debugConfigState?.bids?.length > 0 ? Number(debugConfigState?.bids[0].cpm) : 20.0);
    setCurrency(debugConfigState?.bids?.length > 0 ? debugConfigState?.bids[0].currency : 'USD');
    setSelectedBidders(debugConfigState?.bids?.map((item) => item.bidder).filter((v, i, a) => a.indexOf(v) === i) || []);
    setSelectedAdUnitCodes(debugConfigState?.bids?.map((item) => item.adUnitCode).filter((v, i, a) => v && a.indexOf(v) === i) || []);
  }, [bidsOverwriteEnabled, debugConfigState?.bids]);

  useEffect(() => {
    const auctionInitEndEvent = events.filter((event) => ['auctionInit', 'auctionEnd'].includes(event.eventType)) || [];
    const bidderNamesSet = auctionInitEndEvent.reduce((previousValue, currentValue) => {
      const adUnitsArray = (currentValue as IPrebidAuctionEndEventData).args.adUnits || [];
      adUnitsArray.forEach((adUnit) => adUnit.bids.forEach((bid) => previousValue.add(bid.bidder)));
      return previousValue;
    }, new Set<string>());
    setDetectedBidderNames(Array.from(bidderNamesSet));

    const adUnitCodesSet = auctionInitEndEvent.reduce((previousValue, currentValue) => {
      const adUnitsCodesArray = (currentValue as IPrebidAuctionEndEventData).args.adUnitCodes || [];
      adUnitsCodesArray.forEach((adUnitCode) => previousValue.add(adUnitCode));
      return previousValue;
    }, new Set<string>());
    setDetectedAdUnitCodes(Array.from(adUnitCodesSet));
  }, [events]);

  return (
    <React.Fragment>
      <Grid item md={1} xs={1}>
        <Box sx={{ alignContent: 'center', [theme.breakpoints.down('sm')]: { transform: 'rotate(90deg)' } }}>
          <FormControl>
            <FormControlLabel label="" control={<Switch checked={bidsOverwriteEnabled} onChange={handleBidOverWriteEnabledChange} />} />
          </FormControl>
        </Box>
      </Grid>

      <Grid item md={1} xs={1}>
        <FormControl sx={{ height: 1 }}>
          <Box component="form" noValidate autoComplete="off" sx={{ height: 1 }}>
            <TextField
              sx={{ height: 1, '& div': { height: 1 } }}
              type="number"
              label="cpm"
              value={cpm}
              onChange={handleCpmChange}
              variant="outlined"
              disabled={!bidsOverwriteEnabled}
            />
          </Box>
        </FormControl>
      </Grid>

      <Grid item md={1} xs={1}>
        <FormControl sx={{ height: 1 }}>
          <Box component="form" noValidate autoComplete="off" sx={{ height: 1 }}>
            <TextField
              sx={{ height: 1, '& div': { height: 1 } }}
              type="string"
              label="currency"
              value={currency}
              onChange={handleCurrencyChange}
              variant="outlined"
              disabled={!bidsOverwriteEnabled}
            />
          </Box>
        </FormControl>
      </Grid>

      <Grid item md={4.5} xs={4.5}>
        <FormControl sx={{ height: 1, width: 1, '& .MuiOutlinedInput-root': { height: 1, alignItems: 'baseline' } }}>
          <InputLabel>Select Bidder(s)</InputLabel>
          <Select
            multiple
            name="bidders"
            value={selectedBidders}
            onChange={handleBidderSelectionChange}
            input={<OutlinedInput label="Detected Bidders" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value, index) => (
                  <Chip
                    size="small"
                    key={index}
                    label={value}
                    onDelete={handleBidderDelete(value)}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                    }}
                  />
                ))}
              </Box>
            )}
            MenuProps={MenuProps}
            disabled={!bidsOverwriteEnabled}
          >
            {detectedBidderNames.map((name, index) => (
              <MenuItem key={index} value={name} style={getStyles(name, selectedBidders, theme)}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item md={4.5} xs={4.5}>
        <FormControl sx={{ height: 1, width: 1, '& .MuiOutlinedInput-root': { height: 1, alignItems: 'baseline' } }}>
          <InputLabel>Select AdUnitCode(s)</InputLabel>
          <Select
            multiple
            name="adUnitCodes"
            value={selectedAdUnitCodes}
            onChange={handleAdunitSelectionChange}
            input={<OutlinedInput label="Detected AdUnit(s)" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value, index) => (
                  <Chip
                    size="small"
                    key={index}
                    label={value.length > 26 ? `...${value.substring(value.length - 26)}` : value}
                    onDelete={handleAdUnitDelete(value)}
                    onMouseDown={(event) => {
                      event.stopPropagation();
                    }}
                  />
                ))}
              </Box>
            )}
            MenuProps={MenuProps}
            disabled={!bidsOverwriteEnabled || selectedBidders.length === 0}
          >
            {detectedAdUnitCodes.map((name, index) => (
              <MenuItem key={index} value={name} style={getStyles(name, selectedAdUnitCodes, theme)}>
                {name.length > 40 ? `...${name.substring(name.length - 40)}` : name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </React.Fragment>
  );
};

interface BidOverWriteComponentProps {
  debugConfigState: IPrebidDebugConfig;
  setDebugConfigState: (debugConfigState: IPrebidDebugConfig) => void;
}

export default BidOverWriteComponent;
