import React, { useEffect } from 'react';
import JSONViewerComponent from '../../../Shared/components/JSONViewerComponent';
import { IPrebidAuctionEndEventData, IPrebidBidderRequest } from '../../../Content/scripts/prebid';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import Popover from '@mui/material/Popover';

const getNearestGridBarElement = (input: number, gridRef: React.MutableRefObject<HTMLElement>) => {
  const allGridBarsCollection = gridRef?.current?.children;
  const allGridBarsArray = Array.from(allGridBarsCollection || []) as HTMLLIElement[];
  const nearestGridBar = allGridBarsArray.sort(
    (a, b) => Math.abs(Number(a.dataset.timestamp) - input) - Math.abs(Number(b.dataset.timestamp) - input)
  )[0] as HTMLElement;
  return nearestGridBar;
};

const BidderBarComponent = ({ item, auctionEndLeft, auctionEndEvent, gridRef }: IBidderBarComponentProps): JSX.Element => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [bidderRequest, setBidderRequest] = React.useState<IPrebidBidderRequest | null>(null);
  const open = Boolean(anchorEl);
  const startGridBar = getNearestGridBarElement(bidderRequest?.start, gridRef);
  const endGridBar = getNearestGridBarElement(item.end, gridRef);
  const left = startGridBar?.offsetLeft;
  const width = endGridBar?.offsetLeft + endGridBar?.offsetWidth - left;
  const isTimeOut = left + width > auctionEndLeft;

  const handlePopoverOpenClose = (event: React.MouseEvent<HTMLElement>) => (!open ? setAnchorEl(event.currentTarget) : setAnchorEl(null));

  useEffect(() => {
    setBidderRequest(auctionEndEvent.args.bidderRequests.find((bidderRequest) => bidderRequest.bidderRequestId === item.bidderRequestId));
  }, [auctionEndEvent.args.bidderRequests, item.bidderRequestId]);

  return (
    <React.Fragment>
      <ListItem
        onClick={handlePopoverOpenClose}
        sx={{
          whiteSpace: 'nowrap',
          m: 1,
          position: 'relative',
          color: isTimeOut ? 'warning.main' : 'primary.main',
          border: '1px solid',
          backgroundColor: 'background.paper',
          borderRadius: '4px',
          width: `${width}px`,
          left: `${left}px`,
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
        onClose={handlePopoverOpenClose}
        disableRestoreFocus
      >
        <JSONViewerComponent
          src={bidderRequest}
          name={false}
          collapsed={3}
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

interface IBidderBarComponentProps {
  item: ITableRow;
  auctionEndLeft: number;
  auctionEndEvent: IPrebidAuctionEndEventData;
  gridRef: React.MutableRefObject<any>;
}

interface ITableRow {
  bidderCode: string;
  start: number;
  end: number;
  bidderRequestId: string;
}

export default BidderBarComponent;
