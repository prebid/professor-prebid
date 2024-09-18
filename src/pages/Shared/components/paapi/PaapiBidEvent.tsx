import React from 'react';
import Grid from '@mui/material/Grid';
import JSONViewerComponent from '../JSONViewerComponent';
import { Typography } from '@mui/material';
import { BoxWithLabelAndExpandAndJsonView } from '../BoxWithLabel';
import { InfoItem } from '../InfoItem';

const PaapiBidEventWrapper = ({ expanded, jsonView, input }: { input: IPrebidPaapiBidEvent; expanded: boolean; jsonView: boolean }): JSX.Element => {
  if (!expanded && !jsonView)
    return (
      <Grid container>
        <Grid xs={12} item>
          <InfoItem label="Elapsed Time" content={input.elapsedTime % 1 !== 0 ? input.elapsedTime.toFixed(2) : input.elapsedTime} />
          <InfoItem label="Status" content={input.args.status} />
          <InfoItem label="Ad Unit Code" content={input.args.adUnitCode} />
          <InfoItem label="Urn" content={input.args.urn} />
        </Grid>
      </Grid>
    );

  if (expanded && !jsonView)
    return (
      <Grid container>
        <Grid xs={6} item>
          <InfoItem label="Elapsed Time" content={input.elapsedTime % 1 !== 0 ? input.elapsedTime.toFixed(2) : input.elapsedTime} />
          <InfoItem label="Status" content={input.args.status} />
          <InfoItem label="AdId" content={input.args.adId} />
          <InfoItem label="Width" content={input.args.width} />
          <InfoItem label="Height" content={input.args.height} />
          <InfoItem label="Ad Unit Code" content={input.args.adUnitCode} />
          <InfoItem label="Auction Id" content={input.args.auctionId} />
          <InfoItem label="Urn" content={input.args.urn} />
          <InfoItem label="Ovcerridden Ad Id" content={input.args.overriddenAdId} />
        </Grid>
      </Grid>
    );

  if (expanded && jsonView)
    return (
      <Grid container>
        <Grid xs={12} item>
          <JSONViewerComponent src={input} style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }} />;
        </Grid>
      </Grid>
    );
};

const PaapiBidEvent = ({ bidEvent }: { bidEvent: IPrebidPaapiBidEvent }): JSX.Element => {
  return <BoxWithLabelAndExpandAndJsonView label={<Typography variant="h3">{bidEvent.args.adId}</Typography>} children={PaapiBidEventWrapper} input={bidEvent} />;
};

export default PaapiBidEvent;
