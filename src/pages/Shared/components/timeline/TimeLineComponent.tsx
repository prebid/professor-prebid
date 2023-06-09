import React, { useContext } from 'react';
import GanttChart from '../../../Popup/components/timeline/GanttChartComponent';
import AppStateContext from '../../contexts/appStateContext';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

const TimeLineComponent = (): JSX.Element => {
  const { prebid, auctionEndEvents } = useContext(AppStateContext);
  const { events } = prebid;
  if (events.length === 0) return <div>no events</div>;
  if (auctionEndEvents.length === 0) return <div>no auctionEndEvents</div>;
  return (
    <Grid container direction="row" justifyContent="space-between" spacing={1} sx={{ p: 1 }}>
      {auctionEndEvents.map((auctionEndEvent, index) => {
        return (
          <React.Fragment key={index}>
            <Grid item>
              <Paper sx={{ p: 1 }} elevation={1}>
                <Typography variant="h2" component="span">
                  Auction ID: {auctionEndEvent.args.auctionId}
                </Typography>
              </Paper>
            </Grid>
            <Grid item>
              <Paper sx={{ p: 1 }} elevation={1}>
                <Typography variant="h2" component="span">
                  Auction Start: {new Date(auctionEndEvent.args.timestamp).toLocaleTimeString()}
                </Typography>
              </Paper>
            </Grid>
            <Grid item>
              <Paper sx={{ p: 1 }} elevation={1}>
                <Typography variant="h2" component="span">
                  Auction Time: {auctionEndEvent.args.auctionEnd - auctionEndEvent.args.timestamp} ms
                </Typography>
              </Paper>
            </Grid>
            <GanttChart auctionEndEvent={auctionEndEvent}></GanttChart>;
          </React.Fragment>
        );
      })}
    </Grid>
  );
};

export default TimeLineComponent;
