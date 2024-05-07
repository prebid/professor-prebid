import React, { useContext } from 'react';
import { Box, Grid, Paper } from '@mui/material';
import PaapiContext from '../../../Shared/contexts/paapiContext';
import { IAuctionInfo } from '../../../Shared/contexts/paapiContextUtils';
import { EventGrid } from './PaapiAuctionEventsGridComponent';

export const normalizeValue = (value: number, maxValue: number, colCount: number): number => {
  return (value / maxValue) * colCount;
};

export const BackGroundGrid = ({
  step,
  width,
  reverse = false,
  label = false,
}: {
  step: number;
  width: number;
  reverse?: boolean;
  label?: boolean;
}): JSX.Element => {
  if (width <= 0) return null;
  let tmp = [...Array.from({ length: Math.floor(width / step) }, () => step), width % step];
  if (reverse) {
    tmp = tmp.reverse();
  }
  return (
    <>
      {tmp.map((xs, index) => (
        <Grid item xs={xs} key={index} sx={{ borderLeft: reverse === true && xs !== step ? 'unset' : '1px dotted black' }}>
          <Paper elevation={0} style={{ backgroundColor: 'transparent' }} children={label ? index * step : null} />
        </Grid>
      ))}
    </>
  );
};

const PaapiAuction = ({ auction, colCount, step }: { auction: IAuctionInfo; colCount: number; step: number }): JSX.Element => {
  const { auctionState, toggleAuction } = useContext(PaapiContext);

  // const timePassedSinceGlobalAuctionStart = auction.startTime - auctionState['global'].startTime;
  const timePassedSinceFirstTopLevelAuctionStart = auction.startTime - auctionState['global'].childAuctionsBox[0].startTime;

  const maxMessageTime = Object.values(auctionState).reduce((max, auction) => {
    auction.eventTable.forEach((event) => {
      if (event.messageTime > max) {
        max = event.messageTime;
      }
    });
    return max;
  }, 0);

  const maxValue = maxMessageTime - auctionState['global'].startTime;
  const offSetNorm = Math.floor(normalizeValue(timePassedSinceFirstTopLevelAuctionStart, maxValue, colCount));
  const width =
    Math.floor(
      normalizeValue(auction.eventTable[auction.eventTable.length - 1].messageTime - auction.eventTable[0].messageTime, maxValue, colCount)
    ) || 1;

  const rest = colCount - offSetNorm - width;
  return (
    <>
      <BackGroundGrid step={step} width={offSetNorm} />
      <Grid item xs={width} sx={{ overflow: 'visible' }} onClick={() => toggleAuction(auction.auctionId)}>
        <EventGrid auction={auction} />
      </Grid>
      <BackGroundGrid step={step} width={rest} reverse />
      {auction.childAuctionsBox?.map((auction) => (
        <PaapiAuction auction={auction} key={auction.auctionId} colCount={colCount} step={step} />
      ))}
    </>
  );
};

export const PaapiGridContainer = ({
  children,
  label,
  colCount,
  step,
  show,
}: {
  children: JSX.Element;
  label: boolean;
  colCount: number;
  step: number;
  show: boolean;
}): JSX.Element => {
  if (!show) return null;
  return (
    <Grid container columns={colCount} rowGap={0.1}>
      <BackGroundGrid step={step} width={colCount - 1} label={label} />
      {children}
      <BackGroundGrid step={step} width={colCount - 1} label={label} />
    </Grid>
  );
};

export const PaapiAuctionsGridComponent = (): JSX.Element => {
  const { auctionState } = useContext(PaapiContext);
  const topAuctions = auctionState?.global?.childAuctionsBox;
  const expandedAuction = topAuctions?.find((auction) => auction.expanded);
  const colCount = 1000;
  const step = 100;
  return (
    <Box sx={{ overflowX: 'auto', p: 1 }}>
      <PaapiGridContainer
        label={true}
        show={true}
        colCount={colCount}
        step={step}
        children={
          <>
            {expandedAuction && <PaapiAuction auction={expandedAuction} colCount={colCount} step={step} />}
            {!expandedAuction && topAuctions?.map((auction, index) => <PaapiAuction auction={auction} key={index} colCount={colCount} step={step} />)}
          </>
        }
      />
    </Box>
  );
};
