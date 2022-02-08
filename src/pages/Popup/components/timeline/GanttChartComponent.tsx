import {
  IPrebidDetails,
  IPrebidBidRequestedEventData,
  IPrebidAuctionEndEventData,
  IPrebidBidResponseEventData,
  IPrebidNoBidEventData,
  IPrebidBidderRequest,
  IPrebidAdRenderSucceededEventData,
} from '../../../../inject/scripts/prebid';
import React, { useEffect, useRef } from 'react';
import { createRangeArray } from '../../../../utils';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import { makeStyles } from '@mui/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import logger from '../../../../logger';
import Popover from '@mui/material/Popover';
import ReactJson from 'react-json-view';

const useStyles = makeStyles({
  root: {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    '& .chart-values': {
      listStyleType: 'none',
      paddingLeft: 'unset',
      paddingTop: 'unset',
      height: '100%',
      width: '100%',
      maxWidth: '100%',
      position: 'absolute',
      display: 'flex',
      alignItems: 'stretch',
    },
    '& .chart-bars': {
      listStyleType: 'none',
      paddingLeft: 'unset',
      height: '100%',
      width: '100%',
      maxWidth: '100%',
    },
    '& .chart-values li': {
      flex: 1,
      textAlign: 'start',
      borderLeft: '1px dotted lightgrey',
      padding: 0,
      alignItems: 'flex-end',
    },
    '& .chart-bars li': {
      cursor: 'default',
      position: 'relative',
      color: 'rgb(25, 118, 210)',
      border: 'rgb(25, 118, 210) 1px solid',
      backgroundColor: 'white',
      marginBottom: '15px',
      fontSize: '14px',
      borderRadius: '10px',
      padding: '10px 0px',
      width: 0,
      height: '10px',
      opacity: 1,
      transition: 'none',
      '& div': {
        marginLeft: '10px',
      },
    },
  },
});

const getNearestGridBarElement = (input: number, gridRef: React.MutableRefObject<HTMLElement>) => {
  const allGridBarsCollection = gridRef?.current?.children;
  const allGridBarsArray = Array.from(allGridBarsCollection || []) as HTMLLIElement[];
  const nearestGridBar = allGridBarsArray.sort(
    (a, b) => Math.abs(Number(a.dataset.timestamp) - input) - Math.abs(Number(b.dataset.timestamp) - input)
  )[0] as HTMLElement;
  return nearestGridBar;
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
  useEffect(() => {
    setBidderRequest(auctionEndEvent.args.bidderRequests.find((bidderRequest) => bidderRequest.bidderRequestId === item.bidderRequestId));
  }, [auctionEndEvent.args.bidderRequests, item.bidderRequestId]);
  return (
    <React.Fragment>
      <ListItem
        style={{
          width: `${item.width}px`,
          left: `${item.left}px`,
          whiteSpace: 'nowrap',
          paddingLeft: '10px',
          borderColor: item.left + item.width > auctionEndLeft ? 'red' : 'rgb(25, 118, 210)',
        }}
        onClick={handlePopoverOpen}
      >
        <Typography
          sx={{
            color: item.left + item.width > auctionEndLeft ? 'red' : 'rgb(25, 118, 210)',
          }}
        >
          {item.bidderCode}: {item.end - item.start}ms {item.left + item.width > auctionEndLeft ? '(timeout)' : null}
        </Typography>
      </ListItem>
      <Popover
        id="mouse-over-popover"
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
          enableClipboard={false}
          displayObjectSize={false}
          displayDataTypes={false}
          sortKeys={false}
          quotesOnKeys={false}
          indentWidth={2}
          collapseStringsAfterLength={100}
          style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
        />
      </Popover>
    </React.Fragment>
  );
};

const GanttChartComponent = ({ prebid, auctionEndEvent }: IGanttChartComponentProps): JSX.Element => {
  const prebidEvents = prebid.events;
  const gridStep = (auctionEndEvent.args.auctionEnd - auctionEndEvent.args.timestamp) / 100;
  const classes = useStyles();
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
    setRangeArray(createRangeArray(auctionEndEvent.args.timestamp - 150, auctionEndEvent.args.auctionEnd + 250, gridStep));
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
    <Card elevation={20} sx={{ width: 1, maxWidth: 1 }}>
      <CardContent>
        <Box sx={{ display: 'flex' }} alignItems="center" justifyContent="center">
          <Typography variant="overline">Auction ID: {auctionEndEvent.args.auctionId}</Typography>
        </Box>
        <Box
          sx={{
            color: 'rgb(25, 118, 210) ',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}
        >
          <Typography sx={{ color: '#000' }} variant="button">
            Auction Start: {new Date(auctionEndEvent.args.timestamp).toLocaleTimeString()}
          </Typography>
          <Typography sx={{ color: '#000' }} variant="button">
            Auction Time: {auctionEndEvent.args.auctionEnd - auctionEndEvent.args.timestamp} ms
          </Typography>
        </Box>
        <Box
          className={classes.root}
          // onClick={() => setExpanded(!expanded)}
        >
          <List className="chart-values" ref={gridRef} dense={true}>
            {rangeArray.map((val, index) => (
              <ListItem key={index} {...{ 'data-timestamp': Math.round(val) }}></ListItem>
            ))}
          </List>
          <List className="chart-bars" dense={true}>
            <ListItem
              style={{
                position: 'absolute',
                top: 0,
                width: `1px`,
                height: '100%',
                left: `${auctionEndLeft}px`,
                paddingLeft: '0px',
                borderColor: 'red',
                color: 'red',
                fontWeight: 'unset',
              }}
              key="auctionEndEvent"
            >
              <Box sx={{ height: '110%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#000',
                    marginLeft: '-90px',
                    // marginBottom: '-25px'
                  }}
                  noWrap={true}
                >
                  Auction End: {new Date(auctionEndEvent.args.auctionEnd).toLocaleTimeString()}
                </Typography>
              </Box>
            </ListItem>
            {bidderArray.map((item, index) => (
              <BidderBarComponent item={item} auctionEndLeft={auctionEndLeft} auctionEndEvent={auctionEndEvent} key={index} />
            ))}
          </List>
        </Box>
      </CardContent>
    </Card>
  );
};

interface IGanttChartComponentProps {
  prebid: IPrebidDetails;
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
