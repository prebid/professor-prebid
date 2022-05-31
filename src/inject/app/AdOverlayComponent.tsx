import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { overlayTheme } from '../../pages/theme';
import { ThemeProvider } from '@mui/material/styles';
import GamDetailsComponent from './GamDetailsComponent';
import HeaderRowComponent from './HeaderRowComponent';
import { Paper } from '@mui/material';
import Typography from '@mui/material/Typography';
import PopOverComponent from './PopOverComponent';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

const AdOverlayComponent = ({
  elementId,
  winningCPM,
  winningBidder,
  currency,
  timeToRespond,
  closePortal,
  contentRef,
}: AdOverlayComponentProps): JSX.Element => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const openInPopOver = () => {
    setAnchorEl(window.top.document.body);
  };
  const closePopOver = () => {
    setAnchorEl(null);
  };
  const cache = createCache({ key: 'css', container: contentRef?.contentWindow?.document?.head, prepend: true });
  
  return (
    <ThemeProvider theme={overlayTheme}>
      <PopOverComponent
        elementId={elementId}
        winningCPM={winningCPM}
        winningBidder={winningBidder}
        currency={currency}
        timeToRespond={timeToRespond}
        closePortal={closePortal}
        anchorEl={anchorEl}
        setAnchorEl={setAnchorEl}
      />
      <CacheProvider value={cache}>
        <Box
          sx={{
            height: expanded ? '100%' : 'auto',
            width: '100%',
            opacity: 0.9,
            backgroundColor: 'primary.light',
            color: 'text.primary',
            padding: 0.5,
            boxSizing: 'border-box',
            flexGrow: 1,
            '&:hover': { opacity: 1 },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Grid container justifyContent="flex-start" alignItems="flex-start">
            <HeaderRowComponent
              elementId={elementId}
              expanded={expanded}
              setExpanded={setExpanded}
              openInPopOver={openInPopOver}
              closePortal={closePortal}
              closePopOver={closePopOver}
              inPopOver={false}
            />
            {expanded && (currency || winningBidder || winningCPM || timeToRespond || elementId) && (
              <Grid container item xs={12} spacing={0.5}>
                {winningCPM && (
                  <Grid item>
                    <Paper elevation={1} sx={{ p: 0.5 }}>
                      <Typography>
                        <strong>CPM: </strong>
                        {winningCPM} {currency}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
                {winningBidder && (
                  <Grid item>
                    <Paper elevation={1} sx={{ p: 0.5 }}>
                      <Typography>
                        <strong>Bidder: </strong>
                        {winningBidder}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
                {timeToRespond && (
                  <Grid item>
                    <Paper elevation={1} sx={{ p: 0.5 }}>
                      <Typography>
                        <strong>TTR: </strong>
                        {timeToRespond}ms
                      </Typography>
                    </Paper>
                  </Grid>
                )}
                {elementId && <GamDetailsComponent elementId={elementId} inPopOver={false} />}
              </Grid>
            )}
          </Grid>
        </Box>
      </CacheProvider>
    </ThemeProvider>
  );
};

export interface AdOverlayComponentProps {
  elementId: string;
  winningBidder: string;
  winningCPM: number;
  currency: string;
  timeToRespond: number;
  closePortal?: () => void;
  contentRef?: any;
}

export default AdOverlayComponent;
