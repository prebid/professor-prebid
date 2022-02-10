import React, { useEffect } from 'react';
import {
  IPrebidAuctionInitEventData,
  IPrebidDetails,
  IPrebidNoBidEventData,
  IPrebidBidResponseEventData,
  IPrebidAuctionEndEventData,
  IPrebidBidWonEventData,
  IPrebidAdUnit,
  IPrebidAdRenderSucceededEventData,
} from '../../../../inject/scripts/prebid';
import SlotsComponent from './SlotsComponent';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import logger from '../../../../logger';
import merge from 'lodash/merge';

// Styles
const paperElevation = 2;
const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: '#FFF',
  width: '115%',
  height: '120%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  textAlign: 'center',
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  color: '#000',
  fontFamily: 'Roboto',
  fontSize: '15px',
  fontWeight: 'bold',
}));

const AdUnitsComponent = ({ prebid }: IAdUnitsComponentProps): JSX.Element => {
  const [allBidResponseEvents, setAllBidResponseEvents] = React.useState<IPrebidBidResponseEventData[]>([]);
  const [allNoBidEvents, setAllNoBidEvents] = React.useState<IPrebidNoBidEventData[]>([]);
  const [allBidderEvents, setAllBidderEvents] = React.useState<IPrebidDetails['events'][]>([]);
  const [allAdUnitCodes, setAllAdUnitCodes] = React.useState<string[]>([]);
  const [auctionEndEvents, setAuctionEndEvents] = React.useState<IPrebidAuctionEndEventData[]>([]);
  const [latestAuctionsWinningBids, setLatestAuctionsWinningBids] = React.useState<IPrebidBidWonEventData[]>([]);
  const [latestAuctionsBidsReceived, setLatestAuctionBidsReceived] = React.useState<IPrebidBidWonEventData[]>([]);
  const [latestAuctionsAdsRendered, setLatestAuctionsAdsRendered] = React.useState<IPrebidAdRenderSucceededEventData[]>([]);
  const [adUnits, setAdUnits] = React.useState<IPrebidAdUnit[]>([]);

  useEffect(() => {
    const allBidResponseEvents = (prebid.events?.filter((event) => event.eventType === 'bidResponse') || []) as IPrebidBidResponseEventData[];
    const allNoBidEvents = (prebid.events?.filter((event) => event.eventType === 'noBid') || []) as IPrebidNoBidEventData[];
    const allBidderEvents = [].concat(allBidResponseEvents, allNoBidEvents);
    const allBidderEventsBidders = Array.from(new Set(allBidderEvents.map((event) => event?.args.bidder)));
    const allAdUnitCodes = Array.from(
      new Set(
        prebid.events.reduce((acc, event) => {
          if (event.eventType === 'auctionInit') {
            const adUnitCodes = (event as IPrebidAuctionInitEventData).args.adUnitCodes;
            acc = [...acc, ...adUnitCodes];
          }
          return acc;
        }, [] as string[])
      )
    );
    const auctionEndEvents = ((prebid.events || []) as IPrebidAuctionEndEventData[])
      .filter((event) => event.eventType === 'auctionEnd')
      .sort((a, b) => a.args.timestamp - b.args.timestamp);
    const latestAuctionId = auctionEndEvents[0]?.args.auctionId;
    const latestAuctionsWinningBids = ((prebid.events || []) as IPrebidBidWonEventData[]).filter(
      (event) => event.eventType === 'bidWon' && event.args.auctionId === latestAuctionId
    );
    const latestAuctionsBidsReceived = ((prebid.events || []) as IPrebidBidWonEventData[]).filter(
      (event) => event.eventType === 'bidResponse' && event.args.auctionId === latestAuctionId
    );

    const latestAuctionsAdsRendered = ((prebid.events || []) as IPrebidAdRenderSucceededEventData[]).filter(
      (event) => event.eventType === 'adRenderSucceeded' && event.args.bid.auctionId === latestAuctionId
    );

    const adUnits = auctionEndEvents
      .reduce((previousValue, currentValue) => {
        return [...previousValue, ...currentValue.args.adUnits];
      }, [] as IPrebidAdUnit[]) //TODO: 1 reducer only
      .reduce((previousValue, currentValue) => {
        let toUpdate = previousValue.find((adUnit) => adUnit.code === currentValue.code);
        if (toUpdate) {
          toUpdate = merge(toUpdate, currentValue);
          return previousValue;
        } else {
          return [...previousValue, currentValue];
        }
      }, [])
      .sort((a, b) => (a.code > b.code ? 1 : -1));
    setAdUnits(adUnits);
    setLatestAuctionsWinningBids(latestAuctionsWinningBids);
    setLatestAuctionBidsReceived(latestAuctionsBidsReceived);
    setLatestAuctionsAdsRendered(latestAuctionsAdsRendered);
    setAuctionEndEvents(auctionEndEvents);
    setAllBidResponseEvents(allBidResponseEvents);
    setAllNoBidEvents(allNoBidEvents);
    setAllBidderEvents(allBidderEventsBidders);
    setAllAdUnitCodes(allAdUnitCodes);
  }, [prebid.events]);

  logger.log(`[PopUp][AdUnitsComponent]: render `, allBidResponseEvents, allNoBidEvents, allBidderEvents, allAdUnitCodes);
  return (
    <Card>
      {allAdUnitCodes[0] && (
        <React.Fragment>
          <CardContent sx={{ backgroundColor: '#87CEEB', opacity: 0.8 }}>
            <Grid container direction="row" justifyContent="space-evenly">
              <Grid item>
                <StyledPaper elevation={paperElevation}>
                  {prebid.version && <StyledTypography>Version: {prebid.version}</StyledTypography>}
                </StyledPaper>
              </Grid>
              <Grid item>
                <StyledPaper elevation={paperElevation}>
                  <StyledTypography>AdUnits: {allAdUnitCodes.length}</StyledTypography>
                </StyledPaper>
              </Grid>
              <Grid item>
                <StyledPaper elevation={paperElevation}>
                  {prebid.config?.timeoutBuffer && <StyledTypography>Timeout: {prebid.config.bidderTimeout}</StyledTypography>}
                </StyledPaper>
              </Grid>
              <Grid item>
                <StyledPaper elevation={paperElevation}>
                  <StyledTypography>Bidders: {allBidderEvents.length}</StyledTypography>
                </StyledPaper>
              </Grid>
              <Grid item>
                <StyledPaper elevation={paperElevation}>
                  <StyledTypography>
                    Bid Ratio: {Math.round((allNoBidEvents.length / (allNoBidEvents.length + allBidResponseEvents.length)) * 100)}%
                  </StyledTypography>
                </StyledPaper>
              </Grid>
            </Grid>
          </CardContent>
          <Paper>
            {prebid.events && prebid.events[0] && (
              <SlotsComponent
                auctionEndEvents={auctionEndEvents}
                allBidderEvents={allBidderEvents}
                latestAuctionsWinningBids={latestAuctionsWinningBids}
                adUnits={adUnits}
                latestAuctionsBidsReceived={latestAuctionsBidsReceived}
                latestAuctionsAdsRendered={latestAuctionsAdsRendered}
              ></SlotsComponent>
            )}
          </Paper>
        </React.Fragment>
      )}
      {!allAdUnitCodes[0] && (
        <CardContent sx={{ backgroundColor: '#87CEEB', opacity: 0.8 }}>
          <Grid container direction="row" justifyContent="space-evenly">
            <Grid item>
              <StyledPaper elevation={paperElevation}>
                <StyledTypography sx={{ fontSize: '18px', fontWeight: 'bold' }}>Prebid.js detected but no AdUnits</StyledTypography>
              </StyledPaper>
            </Grid>
          </Grid>
        </CardContent>
      )}
    </Card>
  );
};

interface IAdUnitsComponentProps {
  prebid: IPrebidDetails;
}

export default AdUnitsComponent;
