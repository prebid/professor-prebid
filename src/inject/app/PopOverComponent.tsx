import React from 'react';
import Grid from '@mui/material/Grid';
import Popover from '@mui/material/Popover';
import GamDetailsComponent from './GamDetailsComponent';
import { getMaxZIndex } from './AdOverlayPortal';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { CacheProvider } from '@emotion/react/';
import createCache from '@emotion/cache';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Close from '@mui/icons-material/Close';

const PopOverComponent = ({
  elementId,
  winningCPM,
  winningBidder,
  currency,
  timeToRespond,
  anchorEl,
  setAnchorEl,
}: PopOverComponentProps): JSX.Element => {
  const open = Boolean(anchorEl);
  const closePopOver = () => {
    setAnchorEl(null);
  };
  const cacheTopPage = createCache({ key: 'css', container: window.top.document?.head, prepend: true });

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={closePopOver}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      transformOrigin={{ vertical: 'center', horizontal: 'center' }}
      sx={{ zIndex: getMaxZIndex() + 1, p: 1, width: 0.33 }}
    >
      <CacheProvider value={cacheTopPage}>
        <Card
          sx={{
            w: 1,
            backgroundColor: 'primary.light',
            color: 'text.primary',
          }}
        >
          <CardHeader
            action={
              <IconButton sx={{ p: 0 }} onClick={closePopOver}>
                <Close sx={{ fontSize: 14 }} />
              </IconButton>
            }
            title={elementId}
            titleTypographyProps={{ variant: 'h2' }}
            subheader={winningBidder && winningCPM && currency && `${winningBidder || ''} - ${winningCPM || ''} ${currency || ''}`}
            subheaderTypographyProps={{ variant: 'h3' }}
          />
          <CardContent sx={{ flexGrow: 1, display: 'flex' }}>
            <Grid container direction={'row'} spacing={1}>
              <Grid item xs={12}>
                <Grid container direction={'row'} spacing={1}>
                  {winningCPM && (
                    <Grid item xs={4}>
                      <Paper sx={{ p: 1 }}>
                        <Typography>
                          <strong>Winning CPM: </strong>
                          {winningCPM} {currency}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                  {winningBidder && (
                    <Grid item xs={4}>
                      <Paper sx={{ p: 1 }}>
                        <Typography>
                          <strong>Winning Bidder: </strong>
                          {winningBidder}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                  {timeToRespond && (
                    <Grid item xs={4}>
                      <Paper sx={{ p: 1 }}>
                        <Typography>
                          <strong>Time To Respond: </strong>
                          {timeToRespond}ms
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </Grid>
              {elementId && (
                <Grid item xs={12}>
                  <Grid container direction={'row'} spacing={1}>
                    <GamDetailsComponent elementId={elementId} inPopOver={true} truncate={false} />
                  </Grid>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </CacheProvider>
    </Popover>
  );
};

interface PopOverComponentProps {
  elementId: string;
  winningBidder: string;
  winningCPM: number;
  currency: string;
  timeToRespond: number;
  closePortal?: () => void;
  anchorEl: HTMLElement;
  setAnchorEl: (element: HTMLElement) => void;
}

export default PopOverComponent;
