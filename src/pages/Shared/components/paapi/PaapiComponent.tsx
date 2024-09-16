import React, { useContext } from 'react';
import Grid from '@mui/material/Grid';
import StateContext from '../../contexts/appStateContext';
import JSONViewerComponent from '../JSONViewerComponent';
import { Typography } from '@mui/material';
import { BoxWithLabel, BoxWithLabelAndExpandAndJsonView } from '../BoxWithLabel';
import PaapiBidderDone from './PaapiBidderDone';
import PaapiBidWon from './PaapiBidWon';
import PaapiAuctionConfig from './PaapiAuctionConfig';
import { InfoItem } from '../InfoItem';
import PaapiBidEvent from './PaapiBidEvent';

const PaapiTopLevelAuctionComponentWrapper = ({ expanded, jsonView, input }: { input: IPrebidPaapiAuctionEvent; expanded: boolean; jsonView: boolean }): JSX.Element => {
  const { allpaapiBidEvents, allpaapiNoBidEvents, allWinningBids, allBidderDoneEvents } = useContext(StateContext);
  const filteredPaapiBidEvents = allpaapiBidEvents.filter((event) => event.args.auctionId === input?.args?.auctionId);
  const filteredPaapiNoBidEvents = allpaapiNoBidEvents.filter((event) => event.args.auctionId === input?.args?.auctionId);
  const filteredWinningBids = allWinningBids.filter((event) => event.args.auctionId === input?.args?.auctionId);
  const filteredBidderDoneEvents = allBidderDoneEvents.filter((event) => event.args.auctionId === input?.args?.auctionId);
  return (
    <>
      {!expanded && !jsonView && (
        <>
          <InfoItem label="Ad Unit Code" content={input.args.adUnitCode} />
          <InfoItem label="Auction Id" content={input.args.auctionId} />
          <InfoItem label="Seller" content={input.args.auctionConfig.seller} href={input.args.auctionConfig.seller} />
        </>
      )}

      {expanded && !jsonView && <PaapiAuctionConfig auctionId={input?.args?.auctionId} auctionConfig={input?.args?.auctionConfig} />}

      {expanded && jsonView && <JSONViewerComponent style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }} src={input?.args?.auctionConfig} />}

      {expanded && filteredBidderDoneEvents?.length > 0 && (
        <BoxWithLabel sx={{ display: 'flex', flexDirection: 'column', rowGap: 1 }} label={<Typography variant="h2">BidderDone Events</Typography>}>
          {filteredBidderDoneEvents.map((event, index) => (
            <PaapiBidderDone bidderDoneEvent={event} key={index} />
          ))}
        </BoxWithLabel>
      )}

      {expanded && filteredPaapiBidEvents?.length > 0 && (
        <BoxWithLabel sx={{ display: 'flex', flexDirection: 'column', rowGap: 1 }} label={<Typography variant="h2">Bid Events</Typography>}>
          {filteredPaapiBidEvents.map((event, index) => (
            <PaapiBidEvent key={index} bidEvent={event} />
          ))}
        </BoxWithLabel>
      )}

      {expanded && filteredPaapiNoBidEvents?.length > 0 && (
        <BoxWithLabel sx={{ display: 'flex', flexDirection: 'column', rowGap: 1 }} label={<Typography variant="h2">NoBid Events</Typography>}>
          <JSONViewerComponent style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }} src={filteredPaapiNoBidEvents} />
        </BoxWithLabel>
      )}

      {expanded && filteredWinningBids?.length > 0 && (
        <BoxWithLabel sx={{ display: 'flex', flexDirection: 'column', rowGap: 1 }} label={<Typography variant="h2">BidWon Events</Typography>}>
          {filteredWinningBids.map((event, index) => (
            <PaapiBidWon key={index} bidderWonEvent={event} />
          ))}
        </BoxWithLabel>
      )}
    </>
  );
};

const PaapiTopLevelAuctionHeader = ({ auctionEvent }: { auctionEvent: IPrebidPaapiAuctionEvent }): JSX.Element => {
  return (
    <Typography variant={'h1'} sx={{ backgroundColor: 'background.paper', p: 0.5, borderRadius: 1.5 }}>
      <b>Top-level-Auction for </b>
      {auctionEvent.args.adUnitCode}
    </Typography>
  );
};

const PaapiComponent = (): JSX.Element => {
  const { paapiRunAuctionEvents } = useContext(StateContext);
  return (
    <Grid container direction="row" justifyContent="space-between" spacing={1} sx={{ p: 0.5 }}>
      {paapiRunAuctionEvents.map((auctionEvent, index) => (
        <Grid item xs={12} key={index}>
          <BoxWithLabelAndExpandAndJsonView
            label={<PaapiTopLevelAuctionHeader auctionEvent={auctionEvent} />}
            children={PaapiTopLevelAuctionComponentWrapper}
            input={auctionEvent}
            sx={{ display: 'flex', flexDirection: 'column', rowGap: 1, backgroundColor: 'background.paper' }}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default PaapiComponent;
