import React from 'react';
import { IPrebidDetails } from '../scripts/prebid';
import Select from 'react-select';

const AdMaskComponent = ({ prebid, creativeRenderTime, elementId, winningCPM }: IMaskInputData): JSX.Element => {

    const auctionEndEvents = prebid?.events?.filter(event => event.eventType === 'auctionEnd');
    // const options = auctionEndEvents?.map(event => ({ value: event.args.auctionId, label: event.args.timestamp })) || [];
    return (
        <div>
            <p> <strong>elementId: </strong>{elementId}</p>
            {/* <Select options={options} /> */}
            {auctionEndEvents?.map(event =>
                <ul key={event.args.auctionId}>
                    <li> <strong>auctionId: </strong>{event.args.auctionId}</li>
                    <li> <strong>auctionTime: </strong>{event.args.auctionEnd - event.args.timestamp}</li>
                    <li> <strong>creativeRenderTime: </strong>{creativeRenderTime}</li>
                    <li> <strong>winningCPM: </strong>{winningCPM}</li>
                    <li key="Bidders">
                        <strong>Bidders:</strong>
                        <ul>
                            {Array.from(new Set(prebid.bids?.map(bidder => bidder.bidder))).map(bidder =>
                                <li key={bidder as string}>{bidder}</li>
                            )}
                        </ul>
                    </li>
                </ul>
            )}
        </div>
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
