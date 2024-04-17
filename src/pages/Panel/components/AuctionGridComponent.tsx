/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useContext, useEffect, useState } from 'react';
import JSONViewerComponent from '../../Shared/components/JSONViewerComponent';
import { Grid, Paper, Typography } from '@mui/material';
import PaapiContext from '../../Shared/contexts/paapiContext';
import { IAuctionInfo } from '../../Shared/contexts/paapiContextUtils';

const normalizeValue = (value: number, max: number): number => {
  return (value / max) * 12;
};

const Auction = ({ auction }: { auction: IAuctionInfo }): JSX.Element => {
  const [expanded, setExpanded] = useState(false);

  const auctionStart = auction.startTime;
  const auctionEnd = auction.endTime;
  const auctionDuration = auctionEnd - auctionStart;
  const maxTime = auction.endTime + 1000000;

  return (
    <>
      {/* <Grid item xs={1}>
        <Paper style={{ backgroundColor: 'red' }} />
      </Grid> */}
      <Grid item xs={10}>
        <Paper style={{ height: 20, backgroundColor: 'transparent' }}>
          <Typography variant="h4" sx={{ p: 1 }}>
            {auction.header}
          </Typography>
          <Typography variant="body1" sx={{ p: 1 }}>
            <b>Decision Logic URL: </b>
            {auction.config?.decisionLogicURL}
          </Typography>
          <Typography variant="body1" sx={{ p: 1 }}>
            <b>Trusted Scoring Signals URL: </b>
            {auction.config?.trustedScoringSignalsURL}
          </Typography>
          <Typography variant="body1" sx={{ p: 1 }}>
            <b>Component Auctions: </b>
            {auction.config?.componentAuctions?.map((acn: string) => (
              <span key={acn}>{acn}</span>
            ))}
          </Typography>
          <Typography variant="body1" sx={{ p: 1 }}>
            <b onClick={() => setExpanded(!expanded)}>Full Config: </b>
            {expanded && <JSONViewerComponent src={auction.config} />}
          </Typography>
        </Paper>
      </Grid>
      {/* <Grid item xs={1}>
        <Paper style={{ backgroundColor: 'green' }} />
      </Grid> */}
    </>
  );
};

export const AuctionsGridComponent = (): JSX.Element => {
  const { auctionState } = useContext(PaapiContext);
  const topAuctions = auctionState?.global?.childAuctionsBox;

  return (
    <Grid container spacing={0.25}>
      <Grid item xs={12}>
        <Paper>
          {/* <Typography variant={'body1'} onClick={() => setAuctionState({})}>
            clear
          </Typography> */}
        </Paper>
        <JSONViewerComponent src={{ auctionState }} />
      </Grid>

      {topAuctions?.map((topAuction, index) => (
        <Auction auction={topAuction} key={index} />
      ))}
    </Grid>
  );
};
