import React from 'react';
import Grid from '@mui/material/Grid';
import JSONViewerComponent from '../JSONViewerComponent';
import { Typography } from '@mui/material';
import { BoxWithLabelAndExpandAndJsonView } from '../BoxWithLabel';
import { IPrebidBidWonEventData } from '../../../Injected/prebid';
import { InfoItem } from '../InfoItem';

const PaapiBidWonWrapper = ({ expanded, jsonView, input }: { input: IPrebidPaapiBidWonEvent; expanded: boolean; jsonView: boolean }): JSX.Element => {
  return (
    <Grid container>
      {!expanded && !jsonView && (
        <Grid item xs={6}>
          <InfoItem label="Elapsed Time" content={input.elapsedTime % 1 !== 0 ? input.elapsedTime.toFixed(2) : input.elapsedTime} />
          <InfoItem label="Ad Unit Code" content={input.args.adUnitCode} />
        </Grid>
      )}

      {expanded && !jsonView && (
        <Grid item xs={12}>
          <InfoItem label="Elapsed Time" content={input.elapsedTime % 1 !== 0 ? input.elapsedTime.toFixed(2) : input.elapsedTime} />
          <InfoItem label="Ad Unit Code" content={input.args.adUnitCode} />
          <InfoItem label="Auction Id" content={input.args.auctionId} />
          <InfoItem label="Ad Id" content={input.args.adId} />
          <InfoItem label="Width" content={input.args.width} />
          <InfoItem label="Height" content={input.args.height} />
          <InfoItem label="Urn" content={input.args.urn} />
          <InfoItem label="Overridden Ad Id" content={input.args.overriddenAdId} />
        </Grid>
      )}

      {expanded && jsonView && (
        <Grid item xs={12}>
          <JSONViewerComponent style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }} src={input} />
        </Grid>
      )}
    </Grid>
  );
};

const PaapiBidWon = ({ bidderWonEvent }: { bidderWonEvent: IPrebidBidWonEventData }): JSX.Element => {
  return <BoxWithLabelAndExpandAndJsonView label={<Typography variant="h3">{bidderWonEvent.args.adId}</Typography>} children={PaapiBidWonWrapper} input={bidderWonEvent} />;
};

export default PaapiBidWon;
