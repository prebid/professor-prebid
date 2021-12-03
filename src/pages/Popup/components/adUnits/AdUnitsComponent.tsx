import React, { useEffect } from 'react';
import { IPrebidAuctionInitEventData, IPrebidDetails, IPrebidNoBidEventData, IPrebidBidResponseEventData } from '../../../../inject/scripts/prebid';
import SlotsComponent from './SlotsComponent';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';
import logger from '../../../../logger';

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
  const [allBidderEvents, setAllBidderEvents] = React.useState<any[]>([]);
  const [allAdUnits, setAllAdUnits] = React.useState<string[]>([]);

  useEffect(() => {
    const allBidResponseEvents = (prebid.events?.filter((event) => event.eventType === 'bidResponse') || []) as IPrebidBidResponseEventData[];
    const allNoBidEvents = (prebid.events?.filter((event) => event.eventType === 'noBid') || []) as IPrebidNoBidEventData[];
    const allBidderEvents = Array.from(new Set([].concat(allBidResponseEvents, allNoBidEvents).map((event) => event?.args.bidder)));
    const allAdUnits = Array.from(
      new Set(
        prebid?.events
          ?.filter((event) => event.eventType === 'auctionInit')
          .map((event) => (event as IPrebidAuctionInitEventData).args.adUnitCodes)
          .flat()
      )
    );
    setAllBidResponseEvents(allBidResponseEvents);
    setAllNoBidEvents(allNoBidEvents);
    setAllBidderEvents(allBidderEvents);
    setAllAdUnits(allAdUnits);
  }, [prebid.events]);

  logger.log(`[PopUp][AdUnitsComponent]: render `, allBidResponseEvents, allNoBidEvents, allBidderEvents, allAdUnits);

  if (allAdUnits.length >= 1) {
    return (
      <Card>
        <CardContent sx={{ backgroundColor: '#87CEEB', opacity: 0.8 }}>
          <Grid container direction="row" justifyContent="space-evenly">
            <Grid item>
              <StyledPaper elevation={paperElevation}>{prebid.version && <StyledTypography>Version: {prebid.version}</StyledTypography>}</StyledPaper>
            </Grid>
            <Grid item>
              <StyledPaper elevation={paperElevation}>
                <StyledTypography>AdUnits: {allAdUnits.length}</StyledTypography>
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
                  NoBid / Bid Ratio: {allNoBidEvents.length} / {allBidResponseEvents.length}
                </StyledTypography>
              </StyledPaper>
            </Grid>
          </Grid>
        </CardContent>
        <Paper>{prebid.events[0] && <SlotsComponent prebid={prebid}></SlotsComponent>}</Paper>
      </Card>
    );
  } else {
    return (
      <Card>
        <CardContent sx={{ backgroundColor: '#87CEEB', opacity: 0.8 }}>
          <Grid container direction="row" justifyContent="space-evenly">
            <Grid item>
              <StyledPaper elevation={paperElevation}>
                <StyledTypography sx={{ fontSize: '18px', fontWeight: 'bold' }}>Prebid Adapter detected but no AdUnits</StyledTypography>
              </StyledPaper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  }
};

interface IAdUnitsComponentProps {
  prebid: IPrebidDetails;
}

export default AdUnitsComponent;
