import React, { useContext, useEffect } from 'react';
import { IPrebidBid } from '../../../Content/scripts/prebid';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AppsIcon from '@mui/icons-material/Apps';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import BidReceivedRowComponent from './BidReceivedRowComponent';
import NoBidRowComponent from './NoBidRowComponent';
import AppStateContext from '../../contexts/appStateContext';

const gridStyle = {
  p: .5,
  '& .MuiGrid-item > .MuiPaper-root': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

const tabsStyle = { minHeight: 0, '& > div > div > button': { minHeight: 0 }, '& > div  > span': { display: 'none' } };

const tabStyle = { p: 0, justifyContent: 'flex-start' };

const RenderGridPaperItem = ({ children, cols }: { children: React.ReactNode; cols: number }): JSX.Element => (
  <Grid item xs={cols}>
    <Paper sx={{ height: '100%' }}>{children}</Paper>
  </Grid>
);

const BidsComponent = (): JSX.Element => {
  const [tab, setTab] = React.useState<number>(0);
  const [globalOpen, setGlobalOpen] = React.useState<boolean>(false);
  const [bidsReceived, setBidsReceived] = React.useState<IPrebidBid[]>([]);
  const [noBids, setNoBids] = React.useState<IPrebidBid[]>([]);
  const { auctionEndEvents } = useContext(AppStateContext);

  useEffect(() => {
    const bidsReceived = auctionEndEvents.map((event) => event.args.bidsReceived).flat();
    const noBids = auctionEndEvents.map((event) => event.args.noBids).flat();
    setBidsReceived(bidsReceived);
    setNoBids(noBids);
  }, [auctionEndEvents]);

  return (
    <Grid container direction="row" justifyContent="start" spacing={.25} sx={gridStyle}>
      <Grid item xs={12} sx={{ paddingBottom: 0.5 }}>
        <Tabs
          value={tab}
          onChange={(_event, newValue) => {
            setTab(newValue);
          }}
          sx={tabsStyle}
        >
          <Tab
            sx={tabStyle}
            label={
              <Typography variant="h2" component={Paper} sx={{ p: 1, border: 1, borderColor: tab === 0 ? 'primary.main' : 'transparent' }}>
                Received Bids
              </Typography>
            }
          />
          <Tab
            sx={tabStyle}
            label={
              <Typography variant="h2" component={Paper} sx={{ p: 1, border: 1, borderColor: tab === 1 ? 'primary.main' : 'transparent' }}>
                No Bids
              </Typography>
            }
          />
        </Tabs>
      </Grid>
      {tab === 0 && (
        <React.Fragment>
          <RenderGridPaperItem cols={0.62}>
            <IconButton onClick={() => setGlobalOpen(!globalOpen)} size="small" sx={{ p: 0.5 }} children={<AppsIcon />} />
          </RenderGridPaperItem>
          <RenderGridPaperItem cols={2.38}>Bidder Code</RenderGridPaperItem>
          <RenderGridPaperItem cols={1}>Cpm</RenderGridPaperItem>
          <RenderGridPaperItem cols={2}>Currency</RenderGridPaperItem>
          <RenderGridPaperItem cols={3}>AdUnit Code</RenderGridPaperItem>
          <RenderGridPaperItem cols={1}>Size</RenderGridPaperItem>
          <RenderGridPaperItem cols={2}>Media Type</RenderGridPaperItem>
          {bidsReceived.map((bid, index) => (
            <BidReceivedRowComponent key={index} bid={bid} globalOpen={globalOpen} />
          ))}
        </React.Fragment>
      )}
      {tab === 1 && (
        <React.Fragment>
          <RenderGridPaperItem cols={0.62}>
            <IconButton onClick={() => setGlobalOpen(!globalOpen)} size="small" sx={{ p: 0.5 }} children={<AppsIcon />} />
          </RenderGridPaperItem>
          <RenderGridPaperItem cols={2.38}>Bidder Code</RenderGridPaperItem>
          <RenderGridPaperItem cols={9}>AdUnit Code</RenderGridPaperItem>
          {noBids.map((bid, index) => (
            <NoBidRowComponent key={index} bid={bid} globalOpen={globalOpen} />
          ))}
        </React.Fragment>
      )}
    </Grid>
  );
};

export default BidsComponent;
