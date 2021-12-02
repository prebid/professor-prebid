import React, { useEffect } from 'react';
import { IPrebidAuctionInitEventData, IPrebidDetails, IPrebidNoBidEventData, IPrebidBidResponseEventData } from '../../../../inject/scripts/prebid';
import SlotsComponent from './SlotsComponent';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';

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
  const allAvailableBids = prebid.events.filter((event) => event.eventType === 'bidResponse') || [];
  const allNoBids = prebid.events.filter((event) => event.eventType === 'noBid') || [];
  const allAdUnits = Array.from(
    new Set(
      prebid?.events
        ?.filter((event) => event.eventType === 'auctionInit')
        .reduce((previousValue, currentValue) => [].concat(previousValue, (currentValue as IPrebidAuctionInitEventData).args.adUnitCodes), [])
    )
  );
  const allBidders = Array.from(new Set([].concat(allAvailableBids, allNoBids).map((event) => event?.args.bidder)));
  
  if (allAdUnits.length >= 1){
    return (
      <Card>
        <CardContent sx={{ backgroundColor: '#87CEEB', opacity: 0.8 }}>
          <Grid container direction="row" justifyContent="space-evenly">
            <Grid item>
              <StyledPaper elevation={paperElevation}>{prebid.version && <StyledTypography>Version: {prebid.version}</StyledTypography>}</StyledPaper>
            </Grid>
            <Grid item>
              <StyledPaper elevation={paperElevation}>
                <StyledTypography>AdUnits Detected: {allAdUnits.length}</StyledTypography>
              </StyledPaper>
            </Grid>
            <Grid item>
              <StyledPaper elevation={paperElevation}>
                {prebid.config.timeoutBuffer && <StyledTypography>Timeout: {prebid.config.bidderTimeout}</StyledTypography>}
              </StyledPaper>
            </Grid>
            <Grid item>
              <StyledPaper elevation={paperElevation}>
                <StyledTypography>Bidders: {allBidders.length}</StyledTypography>
              </StyledPaper>
            </Grid>
            <Grid item>
              <StyledPaper elevation={paperElevation}>
                <StyledTypography>
                  NoBid / Bid Ratio: {allNoBids.length} / {allAvailableBids.length}
                </StyledTypography>
              </StyledPaper>
            </Grid>
          </Grid>
        </CardContent>
        <Paper>{prebid.events[0] && <SlotsComponent prebid={prebid}></SlotsComponent>}</Paper>
      </Card>
    ); } else {
    return (
      <Card>
        <CardContent sx={{ backgroundColor: '#87CEEB', opacity: 0.8 }}>
          <Grid container direction="row" justifyContent="space-evenly">
            <Grid item>
              <StyledPaper elevation={paperElevation}><StyledTypography  sx={{ fontSize: '18px', fontWeight: 'bold' }} >Prebid Adapter detected but no AdUnits</StyledTypography></StyledPaper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );}
};

interface IAdUnitsComponentProps {
  prebid: IPrebidDetails;
}

export default AdUnitsComponent;
