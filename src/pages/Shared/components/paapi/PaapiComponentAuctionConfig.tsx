import { Typography } from '@mui/material';
import React from 'react';
import Grid from '@mui/material/Grid';
import { BoxWithLabel } from '../BoxWithLabel';
import JSONViewerComponent from '../JSONViewerComponent';
import { InfoItem } from '../InfoItem';

const PaapiComponentAuctionConfig = ({ auctionConfig }: { auctionConfig: IPrebidPaapiAuctionConfig }): JSX.Element => {
  if (!auctionConfig) return null;
  return (
    <BoxWithLabel label={<Typography variant="h2">Auction Config</Typography>}>
      <Grid container spacing={1}>
        {auctionConfig.decisionLogicURL && (
          <Grid item xs={12}>
            <BoxWithLabel label={<Typography variant="h3">Decision Logic</Typography>}>
              <a target="_blank" href={auctionConfig.decisionLogicURL} children={auctionConfig.decisionLogicURL} />
            </BoxWithLabel>
          </Grid>
        )}

        {auctionConfig.resolveToConfig && (
          <Grid item xs={6}>
            <InfoItem label="Resolve To Config" content={auctionConfig.resolveToConfig} />
          </Grid>
        )}

        {auctionConfig.requestedSize && (
          <Grid item xs={6}>
            <BoxWithLabel sx={{ height: 'calc(100% - 18px);' }} label={<Typography variant="h3">Requested Size</Typography>}>
              <JSONViewerComponent src={auctionConfig.requestedSize} style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }} />
            </BoxWithLabel>
          </Grid>
        )}

        {auctionConfig.auctionSignals && (
          <Grid item xs={6}>
            <BoxWithLabel sx={{ height: 'calc(100% - 18px);' }} label={<Typography variant="h3">Auction Signals</Typography>}>
              <JSONViewerComponent src={auctionConfig.auctionSignals} style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }} />
            </BoxWithLabel>
          </Grid>
        )}
      </Grid>
    </BoxWithLabel>
  );
};

export default PaapiComponentAuctionConfig;
