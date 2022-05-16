import React from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

const PrebidDerailsComponent = ({ winningCPM, currency, winningBidder, timeToRespond }: PrebidDertailsComponentProps): JSX.Element => {
  return (
    <React.Fragment>
      {winningCPM && (
        <Grid item>
          <Typography>
            <strong>Winning CPM: </strong>
            {winningCPM} {currency}
          </Typography>
        </Grid>
      )}
      {winningBidder && (
        <Grid item>
          <Typography>
            <strong>Winning Bidder: </strong>
            {winningBidder}
          </Typography>
        </Grid>
      )}
      {timeToRespond && (
        <Grid item>
          <Typography>
            <strong>Time To Respond: </strong>
            {timeToRespond}ms
          </Typography>
        </Grid>
      )}
    </React.Fragment>
  );
};

interface PrebidDertailsComponentProps {
  winningCPM: number;
  currency: string;
  winningBidder: string;
  timeToRespond: number;
}

export default PrebidDerailsComponent;
