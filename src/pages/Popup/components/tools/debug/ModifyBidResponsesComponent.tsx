import { IPrebidDetails, IPrebidDebugConfig } from "../../../../../inject/scripts/prebid";
import BidderFilterComponent from './BidderFilterComponent';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import React, { useEffect, useState } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';

const inject = (code: string, callback: (result: any) => void) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
        const currentTab = tabs[0];
        chrome.tabs.executeScript(currentTab.id, { code }, (result) => {
            callback(result)
        });
    });
}

const ModifyBidResponsesComponent = ({ prebid }: ModifyBidResponsesComponentProps): JSX.Element => {
    const [debugConfgigState, setDebugConfigState] = useState<IPrebidDebugConfig>(null);

    // update bidderFilterEnabled state & session storage
    const handleChange = (input: IPrebidDebugConfig) => {
        input = {
            ...debugConfgigState,
            ...input
        };
        setDebugConfigState(input);
        inject(`sessionStorage.setItem('pbjs:debugging', '${JSON.stringify(input)}')`, () => { });
    };

    const handleEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleChange({ enabled: event.target.checked });
    }

    // read config from session storage & set states on mount
    useEffect(() => {
        inject(`sessionStorage.getItem('pbjs:debugging')`, (result: string) => {
            try {
                const savedConfig: IPrebidDebugConfig = JSON.parse(result);
                setDebugConfigState(savedConfig);
            } catch (e) { }
        });
    }, [])

    return (
        <Box sx={{ padding: '5px' }}>
            <FormControl component="fieldset" variant="standard">
                <FormLabel component="legend">Debugging</FormLabel>
                <FormGroup>
                    <FormControlLabel
                        name="enabled"
                        control={<Switch checked={!!debugConfgigState?.enabled || false} onChange={handleEnabledChange} />}
                        label="Enable Debugging"
                    />
                </FormGroup>
                {prebid &&
                    <BidderFilterComponent
                        prebid={prebid}
                        debugConfigState={debugConfgigState}
                        setDebugConfigState={handleChange}
                    />}
                <FormHelperText>
                    For more detaits see <a target="_blank" href="https://docs.prebid.org/troubleshooting/troubleshooting-guide.html#modify-bid-responses-for-testing">prebidb docs</a>
                </FormHelperText>
                {/* <pre>{JSON.stringify({ ...debugConfgigState }, null, 2)}</pre> */}
            </FormControl>
        </Box>
    );
}

interface ModifyBidResponsesComponentProps {
    prebid: IPrebidDetails;
}

export default ModifyBidResponsesComponent;
