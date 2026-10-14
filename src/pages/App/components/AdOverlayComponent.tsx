import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import { theme } from '../../../theme/theme';
import { ThemeProvider } from '@mui/material';
import GamDetailsComponent from './GamDetailsComponent';

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
import { getParentGamPubAds } from '../InjectedApp';

const AdOverlayComponent = ({ elementId, winningCPM, winningBidder, currency, timeToRespond, closePortal, shadowRoot, contentRef, pbjsNameSpace, attachVersion, onOpenPopover }: AdOverlayComponentProps): JSX.Element => {
  const gridRef = React.useRef<HTMLDivElement>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [truncate, setTruncate] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(true);
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [slot, setSlot] = React.useState<googletag.Slot>(null);

  const containerNode = shadowRoot || contentRef?.contentWindow?.document?.head || document.head;
  const cache = React.useMemo(() => {
    return createCache({
      key: 'prpb-overlay',
      container: containerNode,
      prepend: true,
    });
  }, [containerNode]);

  const openInPopOver = () => {
    let bodyContainer = window.document.body;
    try {
      if (window.top && window.top.document) {
        bodyContainer = window.top.document.body;
      }
    } catch (e) {}
    setIsOpen(true);
  };

  const handleOpenPopover = () => {
    if (onOpenPopover) {
      onOpenPopover();
    } else {
      openInPopOver();
    }
  };

  useEffect(() => {
    const pubads = getParentGamPubAds();
    if (pubads) {
      const slots = pubads.getSlots();
      const slot = slots.find((slot: any) => slot.getSlotElementId() === elementId);
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
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        {!onOpenPopover && <PopOverComponent elementId={elementId} winningCPM={winningCPM} winningBidder={winningBidder} currency={currency} timeToRespond={timeToRespond} closePortal={closePortal} open={isOpen} onClose={() => setIsOpen(false)} pbjsNameSpace={pbjsNameSpace} />}
        <style>{`
          :host {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          * {
            box-sizing: border-box;
          }
        `}</style>
        <Box
          ref={boxRef}
          sx={{
            height: expanded ? '100%' : 'auto',
            minHeight: expanded ? 'fit-content' : 'auto',
            width: '100%',
            backgroundColor: 'rgba(238, 246, 255, 0.96)',
            backdropFilter: 'blur(4px)',
            color: 'text.primary',
            padding: 0.75,
            boxSizing: 'border-box',
            border: '1px solid',
            borderColor: 'rgba(67, 142, 217, 0.5)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 999999,
            pointerEvents: 'auto',
          }}
        >
          <Grid container alignItems="center" ref={gridRef} sx={{ flexWrap: 'nowrap', justifyContent: 'space-between', mb: 0.5 }}>
            <Grid sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden', maxWidth: 'calc(100% - 95px)' }}>
              <Box sx={{ px: 0.75, py: 0.2, backgroundColor: 'primary.main', borderRadius: '4px', maxWidth: '100%', overflow: 'hidden' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontSize: 10 }}>
                  {elementId}
                </Typography>
              </Box>
            </Grid>
            <Grid sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
              <IconButton
                sx={{ p: 0.25, width: 20, height: 20, borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.85)', border: '1px solid rgba(67, 142, 217, 0.3)', color: 'primary.main', '&:hover': { backgroundColor: '#ffffff' } }}
                onClick={() => setExpanded(!expanded)}
                title={expanded ? 'Minimize' : 'Maximize'}
              >
                {expanded ? <MinimizeIcon sx={{ fontSize: 13 }} /> : <MaximizeIcon sx={{ fontSize: 13 }} />}
              </IconButton>

              <IconButton
                sx={{ p: 0.25, width: 20, height: 20, borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.85)', border: '1px solid rgba(67, 142, 217, 0.3)', color: 'primary.main', '&:hover': { backgroundColor: '#ffffff' } }}
                onClick={handleOpenPopover}
                title="Open in Popover"
              >
                <OpenInFullIcon sx={{ fontSize: 12 }} />
              </IconButton>

              {getParentGamPubAds() && (
                <IconButton
                  sx={{ p: 0.25, width: 20, height: 20, borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.85)', border: '1px solid rgba(67, 142, 217, 0.3)', color: 'primary.main', '&:hover': { backgroundColor: '#ffffff' } }}
                  onClick={() => {
                    getParentGamPubAds()?.refresh([slot]);
                  }}
                  title="Refresh Slot"
                >
                  <Refresh sx={{ fontSize: 13 }} />
                </IconButton>
              )}

              <IconButton
                sx={{ p: 0.25, width: 20, height: 20, borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.85)', border: '1px solid rgba(67, 142, 217, 0.3)', color: 'primary.main', '&:hover': { backgroundColor: '#ffffff', color: 'error.main' } }}
                onClick={closePortal}
                title="Close"
              >
                <Close sx={{ fontSize: 13 }} />
              </IconButton>
            </Grid>
          </Grid>

          {expanded && (currency || winningBidder || winningCPM || timeToRespond || elementId) && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5, width: '100%' }}>
              {winningCPM && (
                <Box sx={{ p: 0.5, borderRadius: 1, backgroundColor: '#ffffff', border: '1px solid', borderColor: 'rgba(67, 142, 217, 0.3)', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" sx={{ color: 'text.primary', fontSize: 11 }}>
                    <strong style={{ color: '#d97706' }}>CPM: </strong>
                    {winningCPM} {currency}
                  </Typography>
                </Box>
              )}
              {winningBidder && (
                <Box sx={{ p: 0.5, borderRadius: 1, backgroundColor: '#ffffff', border: '1px solid', borderColor: 'rgba(67, 142, 217, 0.3)', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" sx={{ color: 'text.primary', fontSize: 11 }}>
                    <strong style={{ color: '#d97706' }}>Bidder: </strong>
                    {winningBidder}
                  </Typography>
                </Box>
              )}
              {timeToRespond && (
                <Box sx={{ p: 0.5, borderRadius: 1, backgroundColor: '#ffffff', border: '1px solid', borderColor: 'rgba(67, 142, 217, 0.3)', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
                  <Typography variant="caption" sx={{ color: 'text.primary', fontSize: 11 }}>
                    <strong style={{ color: '#d97706' }}>TTR: </strong>
                    {timeToRespond}ms
                  </Typography>
                </Box>
              )}
              {elementId && <GamDetailsComponent elementId={elementId} inPopOver={false} truncate={truncate} />}
            </Box>
          )}
        </Box>
      </ThemeProvider>
    </CacheProvider>
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
  shadowRoot?: ShadowRoot | null;
  pbjsNameSpace?: string;
  attachVersion?: number;
  onOpenPopover?: () => void;
}

export default AdOverlayComponent;
