import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { overlayTheme } from '../../../theme/theme';
import { ThemeProvider } from '@mui/material/styles';
import GamDetailsComponent from './GamDetailsComponent';
import { Paper } from '@mui/material';
import PopOverComponent from './PopOverComponent';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Close from '@mui/icons-material/Close';
import Refresh from '@mui/icons-material/Refresh';
import MinimizeIcon from '@mui/icons-material/Minimize';
import MaximizeIcon from '@mui/icons-material/Maximize';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';

const AdOverlayComponent = ({
  elementId,
  winningCPM,
  winningBidder,
  currency,
  timeToRespond,
  closePortal,
  contentRef,
  pbjsNameSpace,
}: AdOverlayComponentProps): JSX.Element => {
  const gridRef = React.useRef<HTMLDivElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [truncate, setTruncate] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(true);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [slot, setSlot] = React.useState<googletag.Slot>(null);
  const cache = createCache({ key: 'css', container: contentRef?.contentWindow?.document?.head, prepend: true });
  const openInPopOver = () => {
    setAnchorEl(window.top.document.body);
  };
  useEffect(() => {
    if (window.parent.googletag && typeof window.parent.googletag?.pubads === 'function') {
      const pubads = googletag.pubads();
      const slots = pubads.getSlots();
      const slot = slots.find((slot) => slot.getSlotElementId() === elementId);
      if (slot) {
        setSlot(slot);
      }
    }
  }, [elementId]);
  useEffect(() => {
    if (!truncate) {
      setTruncate(gridRef.current?.offsetHeight > boxRef.current?.offsetHeight || false);
    }
  }, [gridRef.current?.offsetHeight, boxRef.current?.offsetHeight, truncate]);
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
        pbjsNameSpace={pbjsNameSpace}
      />
      <CacheProvider value={cache}>
        <Box
          ref={boxRef}
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
          <Grid container justifyContent="flex-start" alignItems="flex-start" ref={gridRef} rowSpacing={0.2}>
            <Grid container item justifyContent="space-between" alignItems="flex-start">
              <Grid item xs={7} lg={3.5} xl={1.5}>
                <Paper elevation={1} sx={{ p: 0.25 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      wordWrap: 'break-word',
                      textAlign: 'left',
                    }}
                  >
                    {elementId}
                  </Typography>
                </Paper>
              </Grid>
              <Grid
                item
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  alignItems: 'flex-end',
                  color: 'text.secondary',
                }}
                xs={4}
              >
                <IconButton sx={{ p: 0 }} onClick={() => setExpanded(!expanded)}>
                  {expanded && <MinimizeIcon sx={{ fontSize: 14 }} />}
                  {!expanded && <MaximizeIcon sx={{ fontSize: 14 }} />}
                </IconButton>

                <IconButton sx={{ p: 0 }} onClick={openInPopOver}>
                  <OpenInFullIcon sx={{ fontSize: 14 }} />
                </IconButton>

                {window.parent.googletag && typeof window.parent.googletag?.pubads === 'function' && (
                  <IconButton
                    sx={{ p: 0 }}
                    onClick={() => {
                      window.parent.googletag.pubads().refresh([slot]);
                    }}
                  >
                    <Refresh sx={{ fontSize: 14 }} />
                  </IconButton>
                )}

                <IconButton sx={{ p: 0 }} onClick={closePortal}>
                  <Close sx={{ fontSize: 14 }} />
                </IconButton>
              </Grid>
            </Grid>
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
                {elementId && <GamDetailsComponent elementId={elementId} inPopOver={false} truncate={truncate} />}
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
  pbjsNameSpace?: string;
}

export default AdOverlayComponent;
