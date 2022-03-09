import React, { useEffect } from 'react';
import {
  IPrebidAuctionInitEventData,
  IPrebidDetails,
  IPrebidNoBidEventData,
  IPrebidBidResponseEventData,
  IPrebidAuctionEndEventData,
  IPrebidAdUnit,
} from '../../../../inject/scripts/prebid';
import SlotsComponent from './SlotsComponent';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import logger from '../../../../logger';
import merge from 'lodash/merge';
import theme from '../../../theme';

const AdUnitsComponent = ({ prebid }: IAdUnitsComponentProps): JSX.Element => {
  const [allBidResponseEvents, setAllBidResponseEvents] = React.useState<IPrebidBidResponseEventData[]>([]);
  const [allNoBidEvents, setAllNoBidEvents] = React.useState<IPrebidNoBidEventData[]>([]);
  const [allBidderEvents, setAllBidderEvents] = React.useState<IPrebidDetails['events'][]>([]);
  const [allAdUnitCodes, setAllAdUnitCodes] = React.useState<string[]>([]);
  const [auctionEndEvents, setAuctionEndEvents] = React.useState<IPrebidAuctionEndEventData[]>([]);
  const [adUnits, setAdUnits] = React.useState<IPrebidAdUnit[]>([]);

  useEffect(() => {
    const auctionEndEvents = ((prebid.events || []) as IPrebidAuctionEndEventData[])
      .filter((event) => event.eventType === 'auctionInit' || event.eventType === 'auctionEnd')
      .sort((a, b) => a.args.timestamp - b.args.timestamp);
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
  }, [prebid.events]);

  useEffect(() => {
    const allBidResponseEvents = (prebid.events?.filter((event) => event.eventType === 'bidResponse') || []) as IPrebidBidResponseEventData[];
    const allNoBidEvents = (prebid.events?.filter((event) => event.eventType === 'noBid') || []) as IPrebidNoBidEventData[];
    const allBidderEvents = [].concat(allBidResponseEvents, allNoBidEvents);
    const allBidderEventsBidders = Array.from(new Set(allBidderEvents.map((event) => event?.args.bidder)));
    const allAdUnitCodes = Array.from(
      new Set(
        prebid.events?.reduce((acc, event) => {
          if (event.eventType === 'auctionInit' || event.eventType === 'auctionEnd') {
            const adUnitCodes = (event as IPrebidAuctionInitEventData).args.adUnitCodes;
            acc = [...acc, ...adUnitCodes];
          }
          return acc;
        }, [] as string[])
      )
    );

    setAuctionEndEvents(auctionEndEvents);
    setAllBidResponseEvents(allBidResponseEvents);
    setAllNoBidEvents(allNoBidEvents);
    setAllBidderEvents(allBidderEventsBidders);
    setAllAdUnitCodes(allAdUnitCodes);
  }, [auctionEndEvents, prebid.events]);

  logger.log(`[PopUp][AdUnitsComponent]: render `, allBidResponseEvents, allNoBidEvents, allBidderEvents, allAdUnitCodes);
  return (
    <React.Fragment>
      {allAdUnitCodes[0] && (
        <React.Fragment>
          <Grid
            container
            spacing={1}
            sx={{
              p: 1,
              justifyContent: 'space-between',
              flexDirection: 'row',
              flexWrap: 'wrap',
              [theme.breakpoints.down('sm')]: {
                display: 'none',
              },
            }}
          >
            <Grid item>
              <Paper sx={{ p: 1 }} elevation={1}>
                {prebid.version && <Typography variant="h2">Version: {prebid.version}</Typography>}
              </Paper>
            </Grid>
            <Grid item>
              <Paper sx={{ p: 1 }} elevation={1}>
                <Typography variant="h2">AdUnits: {allAdUnitCodes.length}</Typography>
              </Paper>
            </Grid>
            <Grid item>
              <Paper sx={{ p: 1 }} elevation={1}>
                {prebid.config?.timeoutBuffer && <Typography variant="h2">Timeout: {prebid.config.bidderTimeout}</Typography>}
              </Paper>
            </Grid>
            <Grid item>
              <Paper sx={{ p: 1 }} elevation={1}>
                <Typography variant="h2">Bidders: {allBidderEvents.length}</Typography>
              </Paper>
            </Grid>
            <Grid item>
              <Paper sx={{ p: 1 }} elevation={1}>
                <Typography variant="h2">
                  Bid{allBidResponseEvents.length > 1 ? 's' : ''}: {allBidResponseEvents.length}
                </Typography>
              </Paper>
            </Grid>
            <Grid item>
              <Paper sx={{ p: 1 }} elevation={1}>
                <Typography variant="h2">
                  noBid{allNoBidEvents.length > 1 ? 's' : ''} : {allNoBidEvents.length}
                </Typography>
              </Paper>
            </Grid>
            <Grid item>
              <Paper sx={{ p: 1 }} elevation={1}>
                <Typography variant="h2">
                  Event{prebid.events.length > 1 ? 's' : ''} : {prebid.events.length}
                </Typography>
              </Paper>
            </Grid>
            {prebid.events && prebid.events[0] && <SlotsComponent events={prebid.events} adUnits={adUnits} />}
          </Grid>
        </React.Fragment>
      )}
      {!allAdUnitCodes[0] && (
        <Grid container direction="row" justifyContent="space-evenly">
          <Grid item>
            <Paper elevation={1} sx={{ p: 1 }}>
              <Typography variant="h1">Prebid.js detected but no AdUnits</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </React.Fragment>
  );
};

interface IAdUnitsComponentProps {
  prebid: IPrebidDetails;
}

export default AdUnitsComponent;
