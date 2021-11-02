import React from 'react';
import { IPrebidDetails } from '../scripts/prebid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

const AdMaskComponent = ({ prebid, creativeRenderTime, elementId, winningCPM }: IMaskInputData): JSX.Element => {

    return (
        <Box>
            <Typography><strong>selementId: </strong>{elementId}</Typography>
        </Box>
    );

}

interface IMaskInputData {
    elementId: string;
    creativeRenderTime: number;
    winningBidder: string;
    winningCPM: number;
    prebid: IPrebidDetails
}

export default AdMaskComponent;
