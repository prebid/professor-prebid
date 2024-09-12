import React from 'react';
import Grid from '@mui/material/Grid';
import JSONViewerComponent from '../JSONViewerComponent';
import { Typography } from '@mui/material';
import { BoxWithLabel, BoxWithLabelAndExpandAndJsonView, BoxWithoutLabel } from '../BoxWithLabel';
import { IPrebidBidderDoneEventData } from '../../../Injected/prebid';
import { InfoItem } from '../InfoItem';

const PaapiBidderDoneWrapper = ({ expanded, jsonView, input }: { input: any; expanded: boolean; jsonView: boolean }): JSX.Element => {
  return (
    <>
      <Grid container spacing={1}>
        {!expanded && !jsonView && (
          <Grid xs={expanded ? 6 : 12} item>
            <InfoItem label="Elapsed Time" content={input.elapsedTime % 1 !== 0 ? input.elapsedTime.toFixed(2) : input.elapsedTime} />
            <InfoItem label="Start" content={input.args.start} />
          </Grid>
        )}
        {expanded && !jsonView && (
          <>
            <Grid xs={expanded ? 6 : 12} item>
              <BoxWithoutLabel sx={{ height: 'calc(100% - 18px);' }}>
                <InfoItem label="Elapsed Time" content={input.elapsedTime % 1 !== 0 ? input.elapsedTime.toFixed(2) : input.elapsedTime} />
                <InfoItem label="Bidder Code" content={input.args.bidderCode} />
                <InfoItem label="Auction Id" content={input.args.auctionId} />
                <InfoItem label="Bidder Request Id" content={input.args.bidderRequestId} />
                <InfoItem label="Auction Start" content={input.args.auctionStart} />
                <InfoItem label="Start" content={input.args.start} />
                <InfoItem label="Timeout" content={input.args.timeout} />
              </BoxWithoutLabel>
            </Grid>
            <Grid xs={6} item>
              <BoxWithLabel sx={{ height: 'calc(100% - 18px);' }} label={<Typography variant="h4">paapi</Typography>}>
                <JSONViewerComponent src={input.args.paapi} style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }} />
              </BoxWithLabel>
            </Grid>
            <Grid xs={6} item>
              <BoxWithLabel sx={{ height: 'calc(100% - 18px);' }} label={<Typography variant="h4">bids</Typography>}>
                <JSONViewerComponent collapsed={2} src={input.args.bids} style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }} />
              </BoxWithLabel>
            </Grid>
            <Grid xs={6} item>
              <BoxWithLabel sx={{ height: 'calc(100% - 18px);' }} label={<Typography variant="h4">ortb2</Typography>}>
                <JSONViewerComponent collapsed={2} style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }} src={input.args.ortb2} />
              </BoxWithLabel>
            </Grid>
            <Grid xs={12} item>
              <BoxWithLabel sx={{ height: 'calc(100% - 18px);' }} label={<Typography variant="h4">metrics</Typography>}>
                <JSONViewerComponent style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }} src={input.args.metrics} />
              </BoxWithLabel>
            </Grid>
          </>
        )}
      </Grid>
      {expanded && jsonView && (
        <Grid container>
          <Grid xs={12} item component={JSONViewerComponent} src={input} />
        </Grid>
      )}
    </>
  );
};

const PaapiBidderDone = ({ bidderDoneEvent }: { bidderDoneEvent: IPrebidBidderDoneEventData }): JSX.Element => {
  return <BoxWithLabelAndExpandAndJsonView label={<Typography variant="h3">{bidderDoneEvent.args.bidderCode}</Typography>} children={PaapiBidderDoneWrapper} input={bidderDoneEvent} />;
};

export default PaapiBidderDone;
