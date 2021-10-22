import React from 'react';
import { IPrebidDetails } from '../scripts/prebid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

const AdMaskComponent = ({ prebid, creativeRenderTime, elementId, winningCPM }: IMaskInputData): JSX.Element => {

    const auctionEndEvents = prebid?.events?.filter(event => event.eventType === 'auctionEnd');
    // const options = auctionEndEvents?.map(event => ({ value: event.args.auctionId, label: event.args.timestamp })) || [];
    return (
        <Box>
            <Typography><strong>selementId: </strong>{elementId}</Typography>
            {/* <Select options={options} /> */}
            {auctionEndEvents?.map(event =>
                <List key={event.args.auctionId} dense={true}>
                    <ListItem> <strong>auctionId: </strong>{event.args.auctionId}</ListItem>
                    <ListItem> <strong>auctionTime: </strong>{event.args.auctionEnd - event.args.timestamp}</ListItem>
                    <ListItem> <strong>creativeRenderTime: </strong>{creativeRenderTime}</ListItem>
                    <ListItem> <strong>winningCPM: </strong>{winningCPM}</ListItem>
                    <ListItem key="Bidders">
                        <Typography><strong>Bidders:</strong></Typography>
                        <List>
                            {Array.from(new Set(prebid.bids?.map(bidder => bidder.bidder))).map(bidder =>
                                <ListItem key={bidder as string}>{bidder}</ListItem>
                            )}
                        </List>
                    </ListItem>
                </List>
            )}
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
