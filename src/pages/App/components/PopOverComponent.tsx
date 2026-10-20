import React from 'react';
import type { PrebidJS, AdUnit, AdUnitDefinition, Bid } from 'prebid.js';
import { CacheProvider } from '@emotion/react';
import { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import createCache from '@emotion/cache';
import Box from '@mui/material/Box';
import Close from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import JSONViewerComponent from '../../Shared/components/JSONViewerComponent';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GavelIcon from '@mui/icons-material/Gavel';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PreviewIcon from '@mui/icons-material/Preview';
import HelpIcon from '@mui/icons-material/Help';
import CrisisAlertIcon from '@mui/icons-material/CrisisAlert';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../theme/theme';
import { getSlotTargeting } from '../../Shared/gptTargeting';


const ExpandableItem = ({ avatar, children, title, json }: { avatar: JSX.Element; title: string; children?: JSX.Element; json?: object }): JSX.Element => {
  const [expanded, setExpanded] = React.useState(true);
  return (
    <Box sx={{ display: 'inline-block', width: '100%', mb: 1.5, breakInside: 'avoid' }}>
      <Box sx={{ backgroundColor: '#fff', border: '1px solid', borderColor: 'primary.light', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, cursor: 'pointer', '&:hover': { backgroundColor: 'info.main' } }} onClick={() => setExpanded(!expanded)}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>{avatar}</Avatar>
          <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 'bold', ml: 1, flexGrow: 1, display: 'flex', alignItems: 'center' }}>{title}</Typography>
          <ExpandMoreIcon
            sx={{
              color: 'text.secondary',
              transform: !expanded ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.2s',
            }}
          />
        </Box>
        {expanded && (
          <Box sx={{ borderTop: '1px solid', borderColor: 'primary.light' }}>
            {children && <Box sx={{ p: 1 }}>{children}</Box>}
            {json && <JSONViewerComponent src={json} name={''} displayObjectSize={true} displayDataTypes={false} sortKeys={false} quotesOnKeys={false} indentWidth={2} collapsed={2} collapseStringsAfterLength={200} />}
          </Box>
        )}
      </Box>
    </Box>
  );
};

const MetricCard = ({ title, value, highlightColor = '#438ED9', icon = null }: any): JSX.Element => {
  return (
    <Grid size={{ xs: 12, sm: 4, md: 4 }}>
      <Box sx={{
        p: 1.5,
        backgroundColor: '#fff',
        borderRadius: 2,
        border: '1px solid',
        borderColor: `${highlightColor}80`,
        boxShadow: `0 2px 8px ${highlightColor}20`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
      }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {title} {icon}
        </Typography>
        <Typography variant="h2" sx={{ color: highlightColor, mt: 0.5 }}>
          {value}
        </Typography>
      </Box>
    </Grid>
  );
};

const InfoCard = ({ title, value, linkUrl = null }: any): JSX.Element => {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };
  return (
    <Grid size={{ xs: 12, sm: 6, md: 6 }}>
      <Box sx={{
        p: 1.5,
        backgroundColor: '#fff',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'primary.light',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        position: 'relative'
      }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {title}
        </Typography>
        {linkUrl ? (
          <a href={linkUrl} rel="noreferrer" target="_blank" style={{ textDecoration: 'none' }}>
            <Typography variant="body1" sx={{ color: 'primary.main', mt: 0.5, wordBreak: 'break-all', fontWeight: 'bold' }}>
              {value}
            </Typography>
          </a>
        ) : (
          <Typography variant="body1" sx={{ color: 'text.primary', mt: 0.5, wordBreak: 'break-all', fontWeight: 'bold' }}>
            {value}
          </Typography>
        )}
        {value && (
          <IconButton size="small" sx={{ position: 'absolute', right: 8, bottom: 8, color: 'text.secondary', '&:hover': { color: 'primary.main' } }} onClick={handleCopy}>
            <ContentCopyIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </Box>
    </Grid>
  );
};

const PopOverComponent = ({ elementId, winningCPM, winningBidder, currency, timeToRespond, anchorEl, setAnchorEl, open: propOpen, onClose, pbjsNameSpace }: PopOverComponentProps): JSX.Element => {
  let headContainer = window.document.head;
  let bodyContainer = window.document.body;
  try {
    if (window.top && window.top.document) {
      headContainer = window.top.document.head;
      bodyContainer = window.top.document.body;
    }
  } catch (e) {
    // Ignore cross-origin error, fallback to window.document
  }
  const cacheTopPage = React.useMemo(() => createCache({ key: 'prpb-popover', container: headContainer, prepend: true }), [headContainer]);
  const pbjs: PrebidJS = window[pbjsNameSpace as keyof Window];
  const isEffectiveOpen = typeof propOpen === 'boolean' ? propOpen : Boolean(anchorEl);

  const handleClose = () => {
    if (onClose) onClose();
    if (setAnchorEl) setAnchorEl(null);
  };

  const [adUnit, setAdunit] = useState<AdUnit | AdUnitDefinition | null>(null);
  const [bidsSorted, setBidsSorted] = useState<Bid[] | null>(null);
  const [winningBid, setWinningBid] = useState<Bid | null>(null);

  useEffect(() => {
    if (!pbjs || !pbjs.getBidResponsesForAdUnitCode) return;
    const bidResponses = pbjs.getBidResponsesForAdUnitCode?.(elementId);
    const bids = [...(bidResponses?.bids || [])].sort((a: any, b: any) => b.cpm - a.cpm);
    const allWinningBids = pbjs.getAllWinningBids?.() || [];
    const { 0: winningBid } = allWinningBids.filter(({ adUnitCode }) => adUnitCode === elementId);
    setAdunit(pbjs.adUnits?.find((el) => el.code === elementId) || null);
    setBidsSorted(bids);
    setWinningBid(winningBid || null);
  }, [elementId, pbjs]);

  // gam stuff
  const [networktId, setNetworkId] = useState<string[]>(null);
  const [creativeId, setCreativeId] = useState<number>(null);
  const [queryId, setQueryId] = useState<string>(null);
  const [lineItemId, setLineItemId] = useState<number>(null);
  const [slotAdUnitPath, setSlotAdUnitPath] = useState<string>(null);
  const [slotTargeting, setSlotTargeting] = useState<{ key: string; value: string[]; id: number }[]>(null);
  const [slotResponseInfo, setSlotResponseInfo] = useState<googletag.ResponseInformation>(null);

  useEffect(() => {
    if (!isEffectiveOpen) return;
    try {
      if (window.parent?.googletag && typeof window.parent.googletag?.pubads === 'function') {
        const pubads = window.parent.googletag.pubads();
        const syncSlotData = () => {
          const slots = pubads.getSlots ? pubads.getSlots() : [];
          const slot = slots.find((s: any) => s.getSlotElementId() === elementId) || slots.find((s: any) => s.getAdUnitPath() === elementId);
          if (slot) {
            setSlotAdUnitPath(slot.getAdUnitPath());
            setNetworkId(slot.getAdUnitPath()?.split('/')[1]?.split(','));
            setSlotTargeting(Object.entries(getSlotTargeting(slot)).map(([key, value], id) => ({ key, value, id })));
            const responseInfo = slot.getResponseInformation();
            setSlotResponseInfo(responseInfo);
            const queryIdAttr = document.getElementById(slot.getSlotElementId())?.getAttribute('data-google-query-id');
            setQueryId(queryIdAttr || null);

            if (responseInfo) {
              const { creativeId, lineItemId, sourceAgnosticCreativeId, sourceAgnosticLineItemId } = responseInfo as any;
              setCreativeId(creativeId || sourceAgnosticCreativeId);
              setLineItemId(lineItemId || sourceAgnosticLineItemId);
            }
          }
        };

        syncSlotData();

        const eventHandler = (event: googletag.events.SlotRenderEndedEvent | googletag.events.SlotResponseReceived) => {
          const slotElId = event.slot?.getSlotElementId ? event.slot.getSlotElementId() : null;
          const slotPath = event.slot?.getAdUnitPath ? event.slot.getAdUnitPath() : null;
          if (slotElId === elementId || slotPath === elementId || (slotElId && elementId.includes(slotElId)) || (slotPath && elementId.includes(slotPath))) {
            syncSlotData();
          }
        };
        pubads.addEventListener('slotResponseReceived', eventHandler);
        pubads.addEventListener('slotRenderEnded', eventHandler);
        return () => {
          pubads.removeEventListener('slotResponseReceived', eventHandler);
          pubads.removeEventListener('slotRenderEnded', eventHandler);
        };
      }
    } catch {
      // Ignore cross-origin access errors
    }
  }, [elementId, isEffectiveOpen]);

  return (
    <CacheProvider value={cacheTopPage}>
      <ThemeProvider theme={theme}>
        <Dialog
          open={isEffectiveOpen}
          container={bodyContainer}
          onClose={handleClose}
          maxWidth="lg"
          fullWidth
          sx={{
            zIndex: 99999999,
            position: 'fixed !important',
            inset: '0 !important',
            '& .MuiBackdrop-root': {
              position: 'fixed !important',
              inset: '0 !important',
              backgroundColor: 'rgba(0, 0, 0, 0.5) !important',
            },
            '& .MuiDialog-container': {
              position: 'fixed !important',
              inset: '0 !important',
              display: 'flex !important',
              alignItems: 'center !important',
              justifyContent: 'center !important',
              width: '100% !important',
              height: '100% !important',
            },
            '& .MuiDialog-paper': {
              position: 'relative !important',
              width: '90vw',
              maxWidth: '1200px',
              backgroundColor: '#ecf3f5', // primary.info
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              border: '1px solid',
              borderColor: 'primary.light',
              m: { xs: 1, sm: 2 },
            },
          }}
        >
          <style>{`
            .MuiDialog-root {
              position: fixed !important;
              inset: 0 !important;
              z-index: 99999999 !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            .MuiBackdrop-root {
              position: fixed !important;
              inset: 0 !important;
              background-color: rgba(0, 0, 0, 0.5) !important;
            }
            .MuiDialog-container {
              position: fixed !important;
              inset: 0 !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              width: 100% !important;
              height: 100% !important;
            }
          `}</style>
          <Box sx={{ p: 2, backgroundColor: 'transparent', color: 'text.primary', display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: '85vh', overflowY: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box sx={{ backgroundColor: 'primary.main', color: '#fff', px: 2, py: 0.5, borderRadius: 10 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {elementId}
                </Typography>
              </Box>
              <IconButton data-testid="popover-close-btn" aria-label="close" size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }} onClick={handleClose}>
                <Close />
              </IconButton>
            </Box>

            {/* Top Metrics Dashboard */}
            <Grid container spacing={1.5}>
              <MetricCard title="CPM" value={winningCPM ? `${winningCPM} ${currency}` : '-'} highlightColor="#438ED9" />
              <MetricCard title="Bidder" value={winningBidder || '-'} highlightColor="#438ED9" />
              <MetricCard title="TTR" value={timeToRespond ? `${timeToRespond}ms` : '-'} highlightColor="#f99b0c" />
            </Grid>

            <Grid container spacing={1.5}>
              {lineItemId && <InfoCard title="LineItem-ID" value={lineItemId} linkUrl={networktId ? `https://admanager.google.com/${networktId[0]}#delivery/LineItemDetail/lineItemId=${lineItemId}` : null} />}
              {creativeId && <InfoCard title="Creative-ID" value={creativeId} linkUrl={networktId ? `https://admanager.google.com/${networktId[0]}#delivery/CreativeDetail/creativeId=${creativeId}` : null} />}
              {queryId && <InfoCard title="Query-ID" value={queryId} linkUrl={networktId ? `https://admanager.google.com/${networktId[0]}#troubleshooting/screenshot/query_id=${queryId}` : null} />}
              {slotAdUnitPath && <InfoCard title="AdUnit Path" value={slotAdUnitPath} />}
              {pbjs?.version && <InfoCard title="Prebid Version" value={pbjs.version} />}
            </Grid>

            {/* JSON Trees */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1 }}>Details</Typography>
              <Box sx={{ columnCount: { xs: 1, sm: 2, md: 3, lg: 3 }, columnGap: '16px', width: '100%' }}>
                {adUnit && <ExpandableItem title="AdUnit Info" avatar={<SettingsOutlinedIcon />} json={adUnit} />}
                {winningBid && <ExpandableItem title="Winning Bid" avatar={<GavelIcon />} json={winningBid} />}
                {bidsSorted && bidsSorted.length > 0 && <ExpandableItem title="All Bids" avatar={<AttachMoneyIcon />} json={bidsSorted} />}
                {winningBid && (
                  <ExpandableItem
                    title="Creative Preview"
                    avatar={<PreviewIcon />}
                    json={winningBid.native}
                    children={
                      winningBid.ad && (
                        <Box sx={{ backgroundColor: '#fff', p: 1, borderRadius: 1 }}>
                          <iframe
                            title="Creative Preview"
                            data-testid="creative-preview-frame"
                            sandbox="allow-scripts"
                            srcDoc={winningBid.ad}
                            width={winningBid.width || 300}
                            height={winningBid.height || 250}
                            style={{ border: 0, maxWidth: '100%' }}
                          />
                        </Box>
                      )
                    }
                  />
                )}
                {slotTargeting && (
                  <ExpandableItem title="Adserver Targeting" avatar={<CrisisAlertIcon />}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {slotTargeting.map((st) => (
                        <Box key={st.key} sx={{ display: 'flex', backgroundColor: 'primary.info', p: 0.75, borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary', width: '30%', fontWeight: 'bold' }}>{st.key}</Typography>
                          <Typography variant="body2" sx={{ color: 'text.primary', width: '70%', wordBreak: 'break-all' }}>{st.value.join(', ')}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </ExpandableItem>
                )}
                {slotResponseInfo && <ExpandableItem title="Response Info" avatar={<HelpIcon />} json={slotResponseInfo} />}
              </Box>
            </Box>

          </Box>
        </Dialog>
      </ThemeProvider>
    </CacheProvider>
  );
};

interface PopOverComponentProps {
  elementId: string;
  winningBidder?: string;
  winningCPM?: number;
  currency?: string;
  timeToRespond?: number;
  closePortal?: () => void;
  anchorEl?: HTMLElement | null;
  setAnchorEl?: (element: HTMLElement | null) => void;
  open?: boolean;
  onClose?: () => void;
  pbjsNameSpace: string;
}

export default PopOverComponent;
