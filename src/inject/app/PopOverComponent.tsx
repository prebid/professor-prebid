import React, { useState, useRef } from 'react';
import Grid from '@mui/material/Grid';
import Popover from '@mui/material/Popover';
import GamDetailsComponent from './GamDetailsComponent';
import { getMaxZIndex } from './AdOverlayPortal';
import HeaderRowComponent from './HeaderRowComponent';
import { Paper } from '@mui/material';
import Typography from '@mui/material/Typography';

const PopOverComponent = ({
  elementId,
  winningCPM,
  winningBidder,
  currency,
  timeToRespond,
  closePortal,
  anchorEl,
  setAnchorEl,
}: PopOverComponentProps): JSX.Element => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const open = Boolean(anchorEl);

  const openInPopOver = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(document.body);
  };

  const closePopOver = () => {
    setAnchorEl(null);
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={closePopOver}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      transformOrigin={{ vertical: 'center', horizontal: 'center' }}
      sx={{
        zIndex: getMaxZIndex() + 10,
        p: 1,
        width: 0.2,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          backgroundColor: 'primary.light',
          opacity: 0.7,
          color: 'text.primary',
          padding: 1,
          flexGrow: 1,
          display: 'flex',
        }}
      >
        <Grid container direction={'row'} spacing={1}>
          <HeaderRowComponent
            elementId={elementId}
            expanded={expanded}
            setExpanded={setExpanded}
            openInPopOver={openInPopOver}
            closePortal={closePortal}
            inPopOver={true}
            closePopOver={closePopOver}
          />
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
                <GamDetailsComponent elementId={elementId} inPopOver={true} />
              </Grid>
            </Grid>
          )}
        </Grid>
      </Paper>
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
