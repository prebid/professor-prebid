import {
  IPrebidDetails,
  IPrebidBidRequestedEventData,
  IPrebidAuctionEndEventData,
  IPrebidBidResponseEventData,
  IPrebidNoBidEventData,
  IPrebidBidderRequest,
} from '../../../../inject/scripts/prebid';
import React, { useEffect, useRef } from 'react';
import { createRangeArray } from '../../../../utils';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import logger from '../../../../logger';
import Popover from '@mui/material/Popover';
import ReactJson, { OnCopyProps } from 'react-json-view';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';

const getNearestGridBarElement = (input: number, gridRef: React.MutableRefObject<HTMLElement>) => {
  const allGridBarsCollection = gridRef?.current?.children;
  const allGridBarsArray = Array.from(allGridBarsCollection || []) as HTMLLIElement[];
  const nearestGridBar = allGridBarsArray.sort(
    (a, b) => Math.abs(Number(a.dataset.timestamp) - input) - Math.abs(Number(b.dataset.timestamp) - input)
  )[0] as HTMLElement;
  return nearestGridBar;
};

const handleCopy = (copy: OnCopyProps) => {
  navigator.clipboard.writeText(JSON.stringify(copy.src, null, '\t'));
};

const findEvent = (bidderRequest: IPrebidBidderRequest, eventType: string) => (event: any) => {
  return (
    event.eventType === eventType &&
    event.args.auctionId === bidderRequest.auctionId &&
    ((event as IPrebidBidRequestedEventData).args.bidderCode === bidderRequest.bidderCode ||
      (event as IPrebidBidRequestedEventData).args.bidder === bidderRequest.bidderCode)
  );
};

const BidderBarComponent = ({ item, auctionEndLeft, auctionEndEvent }: IBidderBarComponentProps): JSX.Element => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [bidderRequest, setBidderRequest] = React.useState<IPrebidBidderRequest | null>(null);
  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handlePopoverClose = () => setAnchorEl(null);
  const open = Boolean(anchorEl);
  const isTimeOut = item.left + item.width > auctionEndLeft;
  useEffect(() => {
    setBidderRequest(auctionEndEvent.args.bidderRequests.find((bidderRequest) => bidderRequest.bidderRequestId === item.bidderRequestId));
  }, [auctionEndEvent.args.bidderRequests, item.bidderRequestId]);
  return (
    <React.Fragment>
      <ListItem
        onClick={handlePopoverOpen}
        sx={{
          whiteSpace: 'nowrap',
          m: 1,  
          position: 'relative',
          color: isTimeOut ? 'warning.main' : 'primary.main',
          border: '1px solid',
          backgroundColor: 'background.paper',
          borderRadius: '4px',
          width: `${item.width}px`,
          left: `${item.left}px`,
        }}
      >
        <Typography variant="body1" sx={{ color: isTimeOut ? 'warning.main' : 'primary.main' }}>
          {item.bidderCode}: {item.end - item.start}ms {isTimeOut ? '(timeout)' : null}
        </Typography>
      </ListItem>
      <Popover
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <ReactJson
          src={bidderRequest}
          name={false}
          collapsed={3}
          enableClipboard={handleCopy}
          displayObjectSize={false}
          displayDataTypes={false}
          sortKeys={false}
          quotesOnKeys={false}
          indentWidth={2}
          collapseStringsAfterLength={100}
          style={{ fontSize: 12, fontFamily: 'roboto', padding: '5px' }}
        />
      </Popover>
    </React.Fragment>
  );
};

const GanttChartComponent = ({ prebidEvents, auctionEndEvent }: IGanttChartComponentProps): JSX.Element => {
  const gridStep = (auctionEndEvent.args.auctionEnd - auctionEndEvent.args.timestamp) / (window.innerWidth / 10);
  const gridRef = useRef(null);
  const [bidderArray, setBidderArray] = React.useState<ITableRow[]>([]);
  const [rangeArray, setRangeArray] = React.useState<number[]>([]);
  const [auctionEndLeft, setAuctionEndLeft] = React.useState<number>(0);

  logger.log(`[PopUp][GanttChartComponent]: render `, prebidEvents, gridStep, bidderArray, rangeArray);
  useEffect(() => {
    setAuctionEndLeft((previousValue) => {
      const auctionEndGridBar = getNearestGridBarElement(auctionEndEvent.args.auctionEnd, gridRef);
      return previousValue !== auctionEndGridBar?.offsetLeft ? auctionEndGridBar?.offsetLeft : previousValue;
    });
  }, [auctionEndEvent.args.auctionEnd, gridRef.current?.children]);

  useEffect(() => {
    logger.log('[GanttChartComponent]: useEffect');
    setRangeArray(createRangeArray(auctionEndEvent.args.timestamp, auctionEndEvent.args.auctionEnd, gridStep, 50));
    setBidderArray(
      auctionEndEvent.args.bidderRequests
        .sort((a, b) => a.start - b.start)
        .map((bidderRequest) => {
          const { bidderCode, start } = bidderRequest;
          const bidRequestEvent = prebidEvents.find(findEvent(bidderRequest, 'bidRequested')) as IPrebidBidRequestedEventData;
          const bidResponseEvent = prebidEvents.find(findEvent(bidderRequest, 'bidResponse')) as IPrebidBidResponseEventData;
          const noBidEvent = prebidEvents.find(findEvent(bidderRequest, 'noBid')) as IPrebidNoBidEventData;
          const end = bidResponseEvent
            ? bidResponseEvent.args.responseTimestamp
            : Math.floor(bidderRequest.start + noBidEvent?.elapsedTime - bidRequestEvent?.elapsedTime);
          const startGridBar = getNearestGridBarElement(bidderRequest.start, gridRef);
          const endGridBar = getNearestGridBarElement(end, gridRef);
          const left = startGridBar?.offsetLeft;
          const width = endGridBar?.offsetLeft + endGridBar?.offsetWidth - left;
          const bidderRequestId = bidRequestEvent?.args.bidderRequestId;
          return { bidderCode, left, width, start, end, bidderRequestId };
        })
    );
  }, [
    auctionEndEvent.args.auctionEnd,
    auctionEndEvent.args.bidderRequests,
    auctionEndEvent.args.bidderRequests.length,
    auctionEndEvent.args.timestamp,
    gridRef.current?.children,
    gridStep,
    prebidEvents,
  ]);

  return (
    <CardContent>
      <Grid container direction="row" justifyContent="space-around" spacing={2}>
        <Grid xs={6} item>
          <Paper sx={{ p: 1 }} elevation={1}>
            <Typography variant="h2" component="span">
              Auction ID:{' '}
            </Typography>
            <Typography variant="body1" component="span">
              {auctionEndEvent.args.auctionId}
            </Typography>
          </Paper>
        </Grid>
        <Grid xs={3} item>
          <Paper sx={{ p: 1 }} elevation={1}>
            <Typography variant="h2" component="span">
              Auction Start:{' '}
            </Typography>
            <Typography variant="body1" component="span">
              {new Date(auctionEndEvent.args.timestamp).toLocaleTimeString()}
            </Typography>
          </Paper>
        </Grid>
        <Grid xs={3} item>
          <Paper sx={{ p: 1 }} elevation={1}>
            <Typography variant="h2" component="span">
              Auction Time:{' '}
            </Typography>
            <Typography variant="body1" component="span">
              {auctionEndEvent.args.auctionEnd - auctionEndEvent.args.timestamp} ms
            </Typography>
          </Paper>
        </Grid>
        <Grid xs={12} item>
          <Paper sx={{ p: 1, pb: 3 }} elevation={1}>
            <Box sx={{ position: 'relative', width: 1, maxWidth: 1 }}>
              <List
                ref={gridRef}
                sx={{
                  height: 1,
                  width: 1,
                  maxWidth: 1,
                  listStyleType: 'none',
                  paddingLeft: 'unset',
                  paddingTop: 'unset',
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'stretch',
                }}
              >
                {rangeArray.map((val, index) => {
                  const isZero = Math.floor(val - auctionEndEvent.args.timestamp) === 0;
                  const isAuctionEnd = Math.floor(val - auctionEndEvent.args.auctionEnd) === 0;
                  const isLabeled = index % 10 === 0 || isAuctionEnd;
                  return (
                    <ListItem
                      {...{ 'data-timestamp': Math.round(val) }}
                      key={index}
                      sx={{
                        display: 'flex',
                        borderLeft: '1px dotted lightgrey',
                        borderColor: isZero || isAuctionEnd ? 'warning.main' : 'text.secondary',
                        p: 0,
                        alignItems: 'flex-end',
                      }}
                    >
                      {(isLabeled || isZero) && (
                        <Typography
                          id="yesy"
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
              <List sx={{ listStyleType: 'none', paddingLeft: 'unset', height: 1, width: 1, maxWidth: 1 }}>
                {bidderArray.map((item, index) => (
                  <BidderBarComponent item={item} auctionEndLeft={auctionEndLeft} auctionEndEvent={auctionEndEvent} key={index} />
                ))}
              </List>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </CardContent>
  );
};

interface IGanttChartComponentProps {
  prebidEvents: IPrebidDetails['events'];
  auctionEndEvent: IPrebidAuctionEndEventData;
}

interface IBidderBarComponentProps {
  item: ITableRow;
  auctionEndLeft: number;
  auctionEndEvent: IPrebidAuctionEndEventData;
}

interface ITableRow {
  bidderCode: string;
  start: number;
  end: number;
  left: number;
  width: number;
  bidderRequestId: string;
}

export default GanttChartComponent;
