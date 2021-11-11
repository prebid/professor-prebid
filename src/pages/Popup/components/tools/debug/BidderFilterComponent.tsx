import { IPrebidAuctionEndEventData, IPrebidDetails, IPrebidDebugConfig } from "../../../../../inject/scripts/prebid";
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import React, { useEffect, useState } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Theme, useTheme } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import Chip from '@mui/material/Chip';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

const getStyles = (name: string, selectedBidders: string[], theme: Theme) => {
    return { fontWeight: selectedBidders?.indexOf(name) === -1 ? theme.typography.fontWeightRegular : theme.typography.fontWeightMedium, };
};

const BidderFilterComponent = ({ prebid, setDebugConfigState }: BidderFilterComponentProps): JSX.Element => {
    const theme = useTheme();
    const [bidderNames, setBidderNames] = useState<string[]>([]);
    const [bidderFilterEnabled, setBidderFilterEnabled] = useState<boolean>(false);
    const [selectedBidders, setSelectedBidders] = React.useState<string[]>([]);

    const handleSelectionChange = (event: SelectChangeEvent<string[]>) => {
        const tmp = typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value;
        setSelectedBidders(() => [...tmp]);
        setBidderFilterEnabled(tmp.length > 0 ? true : false);
        setDebugConfigState({ enabled: true, bidders: tmp });
    };

    const handleBidderFilterEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setBidderFilterEnabled(event.target.checked);
        setDebugConfigState({ bidders: !bidderFilterEnabled ? selectedBidders : undefined });
    };

    useEffect(() => {
        const events = prebid.events.filter((event) => ['auctionInit', 'auctionEnd'].includes(event.eventType));
        const bidderNamesSet = events.reduce((previousValue, currentValue) => {
            const adUnitsArray = (currentValue as IPrebidAuctionEndEventData).args.adUnits || [];
            adUnitsArray.forEach(adUnit => adUnit.bids.forEach((bid: any) => previousValue.add(bid.bidder)));
            return previousValue;
        }, new Set<string>());
        setBidderNames(Array.from(bidderNamesSet));
    }, [prebid.events]);

    return (
        <FormGroup>
            <FormControlLabel name="bidders" control={<Switch name="bidders" checked={bidderFilterEnabled} onChange={handleBidderFilterEnabledChange} />} label="Filter Bidders" />
            <FormControl>
                <InputLabel id="demo-multiple-chip-label">Filter Bidder(s)</InputLabel>
                <Select
                    name="bidders"
                    labelId="demo-multiple-chip-label"
                    id="demo-multiple-chip"
                    multiple
                    value={selectedBidders}
                    onChange={handleSelectionChange}
                    input={<OutlinedInput id="select-multiple-chip" label="Detected Bidders" />}
                    renderValue={selected => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map(value => <Chip key={value} label={value} />)}
                        </Box>
                    )}
                    MenuProps={MenuProps}
                >
                    {bidderNames.map(name => <MenuItem key={name} value={name} style={getStyles(name, selectedBidders, theme)}>{name}</MenuItem>)}
                </Select>
            </FormControl>
        </FormGroup>
    );
}

interface BidderFilterComponentProps {
    prebid: IPrebidDetails;
    setDebugConfigState: (event: any) => void;
}

export default BidderFilterComponent;

