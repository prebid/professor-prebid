
import React from 'react';
import { IPrebidAuctionInitEventData, IPrebidDetails } from '../../../../inject/scripts/prebid';
import SlotsComponent from './SlotsComponent';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider';

const AdUnitsComponent = ({ prebid }: IAdUnitsComponentProps): JSX.Element => {
  const allAvailableBids = prebid.events.filter(event => event.eventType === 'bidResponse') || [];
  const allNoBids = prebid.events.filter(event => event.eventType === 'noBid') || [];
  const allAdUnits = Array.from(new Set(prebid?.events?.filter(event => event.eventType === 'auctionInit').reduce((previousValue, currentValue) => [].concat(previousValue, (currentValue as IPrebidAuctionInitEventData).args.adUnitCodes), [])))
  const allBidders = Array.from(new Set([].concat(allAvailableBids, allNoBids).map(event => event?.args.bidder)))

  return (
    <Card sx={{ backgroundColor: '#ecf3f5' }}>
      <CardContent>
        <Grid
          container
          direction="row"
          justifyContent="space-around"
          alignItems="center"
          >
          <Grid item>
            <Paper variant="outlined" sx={{width: 200, backgroundColor: '#a3b2b8'}}>
              {prebid.version && <Typography variant="subtitle1"><strong>Version: </strong>{prebid.version}</Typography>}
              <Divider></Divider>
              {prebid.config?.timeout && <Typography><strong>Timeout: </strong>{prebid.config.timeout}</Typography>}
              <Typography variant="subtitle1"><strong>AdUnits Detected:</strong> {allAdUnits.length}</Typography>
            </Paper>
          </Grid>
          <Grid item>
            <Paper variant="outlined" sx={{width: 200, backgroundColor: '#a3b2b8'}}>
              <Typography variant="subtitle1"><strong>Bidders:</strong> {allBidders.length}</Typography>
              <Divider></Divider>
              <Typography variant="subtitle1"><strong>NoBid / Bid Ratio:</strong> {allNoBids.length} / {allAvailableBids.length}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
      <Paper elevation={4}>
        {prebid.events[0] && <SlotsComponent prebid={prebid}></SlotsComponent>}
      </Paper>
    </Card>
  )
};

interface IAdUnitsComponentProps {
  prebid: IPrebidDetails;
}

export default AdUnitsComponent;
