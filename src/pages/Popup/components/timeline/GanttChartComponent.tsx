import {
  IPrebidBidRequestedEventData,
  IPrebidAuctionEndEventData,
  IPrebidBidResponseEventData,
  IPrebidNoBidEventData,
  IPrebidBidderRequest,
} from '../../../Injected/prebid';
import React, { useEffect, useRef, useContext } from 'react';
import { createRangeArray } from '../../../Shared/utils';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import BidderBarComponent from './BidderBarComponent';
import AppStateContext from '../../../Shared/contexts/appStateContext';

const getNearestGridBarElement = (input: number, gridRef: React.MutableRefObject<HTMLElement>): HTMLLIElement => {
  const allGridBarsCollection = (gridRef?.current?.children || []) as HTMLLIElement[];
  const allGridBarsArray = Array.from(allGridBarsCollection);
  const nearestGridBar = allGridBarsArray.sort(
    (a, b) => Math.abs(Number(a.dataset.timestamp) - input) - Math.abs(Number(b.dataset.timestamp) - input)
  )[0] as HTMLLIElement;
  return nearestGridBar;
};

const findEvent = (bidderRequest: IPrebidBidderRequest, eventType: string) => (event: any) => {
  return (
    event.eventType === eventType &&
    event.args?.auctionId === bidderRequest?.auctionId &&
    (event.args.bidderCode === bidderRequest.bidderCode || event.args.bidder === bidderRequest.bidderCode)
  );
};

const listStyle = {
  height: 1,
  width: 1,
  maxWidth: 1,
  listStyleType: 'none',
  paddingLeft: 'unset',
  paddingTop: 'unset',
  position: 'absolute',
  display: 'flex',
  alignItems: 'stretch',
};

const floatingListStyle = { listStyleType: 'none', paddingLeft: 'unset', height: 1, width: 1, maxWidth: 1 };

const getListItemStyle = (isZero: boolean, isAuctionEnd: boolean) => ({
  display: 'flex',
  borderLeft: '1px dotted lightgrey',
  borderColor: isZero || isAuctionEnd ? 'warning.main' : 'text.secondary',
  p: 0,
  alignItems: 'flex-end',
});

const GanttChart = ({ auctionEndEvent }: IGanttChartProps): JSX.Element => {
  const { prebid } = useContext(AppStateContext);
  const { auctionEnd, bidderRequests, timestamp } = auctionEndEvent?.args;
  const { events } = prebid;
  const gridStep = (auctionEnd - timestamp) / (window.innerWidth / 10);
  const gridRef = useRef(null);
  const [bidderArray, setBidderArray] = React.useState<ITableRow[]>([]);
  const [rangeArray, setRangeArray] = React.useState<number[]>([]);
  const [auctionEndLeft, setAuctionEndLeft] = React.useState<number>(0);

  useEffect(() => {
    setAuctionEndLeft(getNearestGridBarElement(auctionEnd, gridRef)?.offsetLeft);
    setRangeArray(createRangeArray(timestamp, auctionEnd, gridStep, 50));
    setBidderArray(
      bidderRequests
        .sort((a, b) => a.start - b.start)
        .map((bidderRequest) => {
          const { bidderCode, start } = bidderRequest;
          const bidRequestEvent = events.find(findEvent(bidderRequest, 'bidRequested')) as IPrebidBidRequestedEventData;
          const bidResponseEvent = events.find(findEvent(bidderRequest, 'bidResponse')) as IPrebidBidResponseEventData;
          const noBidEvent = events.find(findEvent(bidderRequest, 'noBid')) as IPrebidNoBidEventData;
          const end = bidResponseEvent ? bidResponseEvent?.args?.responseTimestamp : start + noBidEvent?.elapsedTime - bidRequestEvent?.elapsedTime;
          return { bidderCode, start, end, bidderRequestId: bidRequestEvent?.args?.bidderRequestId };
        })
    );
  }, [auctionEnd, bidderRequests, gridStep, events, timestamp]);

  return (
    <Grid xs={12} item>
      <Paper sx={{ p: 1, pb: 3 }} elevation={1}>
        <Box sx={{ position: 'relative', width: 1, maxWidth: 1 }}>
          <List ref={gridRef} sx={listStyle}>
            {rangeArray.map((val, index) => {
              const isZero = Math.floor(val - auctionEndEvent.args.timestamp) === 0;
              const isAuctionEnd = Math.floor(val - auctionEndEvent.args.auctionEnd) === 0;
              const isLabeled = index % 10 === 0 || isAuctionEnd;
              return (
                <ListItem {...{ 'data-timestamp': Math.round(val) }} key={index} sx={getListItemStyle(isZero, isAuctionEnd)}>
                  {(isLabeled || isZero) && (
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        color: isZero || isAuctionEnd ? 'warning.main' : 'text.secondary',
                        transform: 'rotate(45deg) translate(10px, 15px)',
                        position: 'absolute',
                      }}
                    >
                      {Math.floor(val - auctionEndEvent.args.timestamp)}
                    </Typography>
                  )}
                </ListItem>
              );
            })}
          </List>
          <List sx={floatingListStyle}>
            {bidderArray.map((item, index) => (
              <BidderBarComponent item={item} auctionEndLeft={auctionEndLeft} auctionEndEvent={auctionEndEvent} key={index} gridRef={gridRef} />
            ))}
          </List>
        </Box>
      </Paper>
    </Grid>
  );
};

interface IGanttChartProps {
  auctionEndEvent: IPrebidAuctionEndEventData;
}

interface ITableRow {
  bidderCode: string;
  start: number;
  end: number;
  bidderRequestId: string;
}

export default GanttChart;
