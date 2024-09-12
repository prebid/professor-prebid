import React from 'react';
import JSONViewerComponent from '../JSONViewerComponent';
import PaapiComponentAuctionConfig from './PaapiComponentAuctionConfig';
import { BoxWithLabel } from '../BoxWithLabel';
import { Grid, Typography } from '@mui/material';
import { InfoItem } from '../InfoItem';

const PaapiComponentAuction = ({ expanded, jsonView, input }: { input: IPrebidComponentAuction; expanded: boolean; jsonView: boolean }): JSX.Element => {
  const { seller, decisionLogicURL, decisionLogicUrl } = input;
  return (
    <Grid container spacing={1}>
      {!jsonView && (
        <Grid item xs={6}>
          <BoxWithLabel sx={{ height: 'calc(100% - 18px);' }} label={<Typography variant="h3">Seller</Typography>}>
            <a target="_blank" href={seller}>
              {seller}
            </a>
          </BoxWithLabel>
        </Grid>
      )}
      {!jsonView && (
        <Grid item xs={6}>
          <BoxWithLabel sx={{ height: 'calc(100% - 18px);' }} label={<Typography variant="h3">Decision Logic Url</Typography>}>
            <a target="_blank" href={decisionLogicURL || decisionLogicUrl}>
              {decisionLogicURL || decisionLogicUrl}
            </a>
          </BoxWithLabel>
        </Grid>
      )}
      {expanded && !jsonView && (
        <Grid item xs={12}>
          <PaapiComponentAuctionConfig auctionConfig={input} />
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

export default PaapiComponentAuction;
