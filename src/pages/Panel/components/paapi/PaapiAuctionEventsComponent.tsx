/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useContext, useState } from 'react';
import JSONViewerComponent from '../../../Shared/components/JSONViewerComponent';
import { Box, Paper, Typography } from '@mui/material';
import PaapiContext from '../../../Shared/contexts/paapiContext';
import { IEventRow } from '../../../Shared/contexts/paapiContextUtils';

export const InterestGroup = ({ event, auctionId }: { event: IEventRow; auctionId: string }): JSX.Element => {
  const { auctionState } = useContext(PaapiContext);

  return (
    <Paper>
      <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>Interest Group Loaded: </b>
        {((event?.messageTime - auctionState[auctionId].startTime) * 1000).toFixed(2)} ms after Auction Start
      </Typography>
      <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>IGOrigin: </b>
        {event.IGOrigin}
      </Typography>
      <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>IGName: </b>
        {event.IGName}
      </Typography>
    </Paper>
  );
};

export const Win = ({ event, auctionId }: { event: IEventRow; auctionId: string }): JSX.Element => {
  const { auctionState } = useContext(PaapiContext);

  return (
    <Paper>
      <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>Win: </b>
        {((event?.messageTime - auctionState[auctionId].startTime) * 1000).toFixed(2)} ms after Auction Start
      </Typography>
      <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>IGOrigin: </b>
        {event.IGOrigin}
      </Typography>
      <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>IGName: </b>
        {event.IGName}
      </Typography>
    </Paper>
  );
};

export const TopLevelBid = ({ event, auctionId }: { event: IEventRow; auctionId: string }): JSX.Element => {
  const { auctionState } = useContext(PaapiContext);

  return (
    <Paper>
      <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>TopLevelBid: </b>
        {((event?.messageTime - auctionState[auctionId].startTime) * 1000).toFixed(2)} ms after Auction Start
      </Typography>
      <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>IGOrigin: </b>
        {event.IGOrigin}
      </Typography>
      <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>IGName: </b>
        {event.IGName}
      </Typography>
      <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>Bid: </b>
        {event.Bid}
      </Typography>
      <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>BidCurrency: </b>
        {event.BidCurrency}
      </Typography>
    </Paper>
  );
};

export const BidderJs = ({ event, auctionId }: { event: IEventRow; auctionId: string }): JSX.Element => {
  const { auctionState } = useContext(PaapiContext);
  const auctionEvents = auctionState[auctionId].eventTable.sort((a, b) => a.messageTime - b.messageTime);
  const finishEvent = auctionEvents.find((message) => message.Event === 'Finish fetch sellerTrustedSignals' && message.requestId === event.requestId);

  return (
    <Paper>
      <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>Fetch seller bidder.js: {((finishEvent?.messageTime - event.messageTime) * 1000).toFixed(2)} ms</b>
      </Typography>
    </Paper>
  );
};

export const BidderTrustedSignals = ({ event, auctionId }: { event: IEventRow; auctionId: string }): JSX.Element => {
  const { auctionState } = useContext(PaapiContext);
  const auctionEvents = auctionState[auctionId].eventTable.sort((a, b) => a.messageTime - b.messageTime);
  const finishEvent = auctionEvents.find((message) => message.Event === 'Finish fetch bidderTrustedSignals' && message.requestId === event.requestId);

  return (
    <Paper>
      <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>Fetch bidder trusted signals: {((finishEvent?.messageTime - event.messageTime) * 1000).toFixed(2)} ms</b>
      </Typography>
    </Paper>
  );
};

export const SellerTrustedSignals = ({ event, auctionId }: { event: IEventRow; auctionId: string }): JSX.Element => {
  const { auctionState } = useContext(PaapiContext);
  const auctionEvents = auctionState[auctionId].eventTable.sort((a, b) => a.messageTime - b.messageTime);
  const finishEvent = auctionEvents.find((message) => message.Event === 'Finish fetch sellerTrustedSignals' && message.requestId === event.requestId);

  return (
    <Paper>
      <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>Fetch seller trusted signals: {((finishEvent?.messageTime - event.messageTime) * 1000).toFixed(2)} ms</b>
      </Typography>
    </Paper>
  );
};

export const SellerJs = ({ event, auctionId }: { event: IEventRow; auctionId: string }): JSX.Element => {
  const { auctionState } = useContext(PaapiContext);
  const [configExpanded, setConfigExpanded] = useState(false);
  const auctionEvents = auctionState[auctionId].eventTable.sort((a, b) => a.messageTime - b.messageTime);
  const finishEvent = auctionEvents.find((message) => message.Event === 'Finish fetch sellerJs' && message.requestId === event.requestId);

  return (
    <Paper>
      <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b onClick={() => setConfigExpanded(!configExpanded)}>Fetch seller.js: </b>
        {((finishEvent?.messageTime - event.messageTime) * 1000).toFixed(2)} ms
      </Typography>
    </Paper>
  );
};

export const AuctionConfig = ({ event, auctionId }: { event: IEventRow; auctionId: string }): JSX.Element => {
  const [configExpanded, setConfigExpanded] = useState(false);
  const { auctionState } = useContext(PaapiContext);
  const auction = auctionState[auctionId];
  return (
    <Paper onClick={(e: any) => e.stopPropagation()}>
      <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b onClick={() => setConfigExpanded(!configExpanded)}>Config Resolved: </b>
        {((event?.messageTime - auction.startTime) * 1000).toFixed(2)} ms after Auction Start
      </Typography>
      {configExpanded && (
        <Box>
          <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
            <b>Decision Logic URL: </b>
            {auction.config?.decisionLogicURL}
          </Typography>
          <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
            <b>Trusted Scoring Signals URL: </b>
            {auction.config?.trustedScoringSignalsURL}
          </Typography>
          <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
            <b>Component Auctions: </b>
          </Typography>
          {auction.config?.componentAuctions?.map((acn: string) => (
            <Typography variant="body1" sx={{ p: 1, whiteSpace: 'nowrap', overflow: 'visible' }}>
              {acn}
            </Typography>
          ))}
          <JSONViewerComponent src={auction.config} />
          <JSONViewerComponent src={event} />
        </Box>
      )}
    </Paper>
  );
};

export const AuctionStart = ({ event, auctionId }: { event: IEventRow; auctionId: string }): JSX.Element => {
  const { auctionState } = useContext(PaapiContext);
  const auction = auctionState[auctionId];
  const auctionEvents = auction.eventTable.sort((a, b) => a.messageTime - b.messageTime);
  const auctionTime = auctionEvents[auctionEvents.length - 1].messageTime - event.messageTime;
  const isTopAuction = auction.parentAuctionId === 'global';
  return (
    <Paper sx={{ p: 1 }}>
      <Typography variant="h4" sx={{ whiteSpace: 'nowrap', overflow: 'visible' }}>
        {auction.auctionType} Auction
      </Typography>
      {auction.auctionType === 'Top' && (
        <Typography variant="body1" sx={{ whiteSpace: 'nowrap', overflow: 'visible' }}>
          <b>Auction Time: </b>
          {auction.auctionTime}
        </Typography>
      )}
      <Typography variant="body1" sx={{ whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>Seller: </b>
        {auction.config?.seller}
      </Typography>
      <Typography variant="body1" sx={{ whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>Auction Duration: </b>
        {(auctionTime * 1000).toFixed(2)}ms
      </Typography>
      <Typography variant="body1" sx={{ whiteSpace: 'nowrap', overflow: 'visible' }}>
        <b>Auction Start: </b>
        {(auction.startTime - auctionState['global'].startTime).toFixed(2)}s after frameNavigated
        {!isTopAuction &&
          ' (and ' + ((auction.startTime - auctionState[auction.parentAuctionId].startTime) * 1000).toFixed(2) + ' ms after parent-auction start)'}
      </Typography>
    </Paper>
  );
};
