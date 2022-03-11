import React from 'react';
import { IPrebidBid } from '../../../../inject/scripts/prebid';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import ReactJson from 'react-json-view';
import Grid from '@mui/material/Grid';

const ExpandedRowComponent = ({ bid }: IRowComponentProps) => {
  return (
    <React.Fragment>
      <Grid item xs={0.62}></Grid>
      <Grid item xs={5.38}>
        <Grid container spacing={0.5} sx={{ p: 0.5, '& > div > div': { justifyContent: 'flex-start !important' } }}>
          {bid.bidder && (
            <Grid item xs={12}>
              <Paper sx={{ height: 1, width: 1 }}>
                <Typography variant="body1" sx={{ p: 0.5 }}>
                  <strong>Bidder: </strong>
                  {bid.bidder}
                </Typography>
              </Paper>
            </Grid>
          )}
          {bid.width && bid.height && (
            <Grid item xs={12}>
              <Paper sx={{ height: 1 }}>
                <Typography variant="body1" sx={{ p: 0.5 }}>
                  <strong>Size: </strong>
                  {bid.width} x {bid.height}
                </Typography>
              </Paper>
            </Grid>
          )}
          {bid.originalCpm && (
            <Grid item xs={12}>
              <Paper sx={{ height: 1 }}>
                <Typography variant="body1" sx={{ p: 0.5 }}>
                  <strong>Org. CPM: </strong> {Math.floor(bid.originalCpm * 100) / 100}
                </Typography>
              </Paper>
            </Grid>
          )}
          {bid.originalCurrency && (
            <Grid item xs={12}>
              <Paper sx={{ height: 1 }}>
                <Typography variant="body1" sx={{ p: 0.5 }}>
                  <strong>Org. Currency: </strong>
                  {bid.originalCurrency}
                </Typography>
              </Paper>
            </Grid>
          )}
          {bid.timeToRespond && (
            <Grid item xs={12}>
              <Paper sx={{ height: 1 }}>
                <Typography variant="body1" sx={{ p: 0.5 }}>
                  <strong>Time to Respond: </strong>
                  {bid.timeToRespond}
                </Typography>
              </Paper>
            </Grid>
          )}
          {bid.statusMessage && (
            <Grid item xs={12}>
              <Paper sx={{ height: 1 }}>
                <Typography variant="body1" sx={{ p: 0.5 }}>
                  <strong>Status Message: </strong>
                  {bid.statusMessage}
                </Typography>
              </Paper>
            </Grid>
          )}
          {bid.adUnitCode && (
            <Grid item xs={12}>
              <Paper sx={{ height: 1 }}>
                <Typography variant="body1" sx={{ p: 0.5 }}>
                  <strong>AdUnit Code: </strong>
                  {bid.adUnitCode}
                </Typography>
              </Paper>
            </Grid>
          )}
          {bid.source && (
            <Grid item xs={12}>
              <Paper sx={{ height: 1 }}>
                <Typography variant="body1" sx={{ p: 0.5 }}>
                  <strong>Source: </strong>
                  {bid.source}
                </Typography>
              </Paper>
            </Grid>
          )}
          {bid.ttl && (
            <Grid item xs={12}>
              <Paper sx={{ height: 1 }}>
                <Typography variant="body1" sx={{ p: 0.5 }}>
                  <strong>Bid Cache Period (seconds): </strong> {bid.ttl}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Grid>
      <Grid item xs={6}>
        <Grid container spacing={0.5} sx={{ p: 0.5, '& > div > div': { justifyContent: 'flex-start !important' } }}>
          {bid.adserverTargeting && (
            <Grid item xs={12}>
              <Paper sx={{ height: 1, flexDirection: 'row' }}>
                <Typography variant="body1" sx={{ p: 0.5 }}>
                  <strong>Adserver Targeting: </strong>
                </Typography>
                <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, p: 0.5 }}>
                  {bid.adserverTargeting &&
                    Object.keys(bid.adserverTargeting).map((key) => (
                      <Chip
                        variant="outlined"
                        key={key}
                        label={
                          <Typography variant="body1">
                            {key}: {bid.adserverTargeting[key]}
                          </Typography>
                        }
                        size="small"
                        sx={{ maxWidth: '300px' }}
                      />
                    ))}
                </Stack>
              </Paper>
            </Grid>
          )}
          <Grid item xs={12}>
            <Paper sx={{ height: 1 }}>
              <Typography variant="body1" sx={{ p: 0.5 }}>
                <strong>Params: </strong>
              </Typography>
              {bid.params && (
                <ReactJson
                  src={bid.params}
                  name={false}
                  collapsed={1}
                  enableClipboard={false}
                  displayObjectSize={false}
                  displayDataTypes={false}
                  sortKeys={false}
                  quotesOnKeys={false}
                  indentWidth={2}
                  collapseStringsAfterLength={100}
                  style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
                />
              )}
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </React.Fragment>
  );
};

interface IRowComponentProps {
  bid: IPrebidBid;
  globalOpen?: boolean;
}

export default ExpandedRowComponent;
