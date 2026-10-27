import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import React, { useContext, useState, useEffect } from 'react';
import Chip from '@mui/material/Chip';
import { IGoogleAdManagerSlot } from '../../../Injected/googleAdManager';
import JSONViewerComponent from '../JSONViewerComponent';
import AppStateContext from '../../contexts/appStateContext';
import { AdUnit } from 'prebid.js';
import { AdUnitChipComponent } from './AdUnitChips';
import { InterstitialChipComponent } from './AdUnitChips';
import { Ortb2ImpExtChipComponent } from './AdUnitChips';
import { BidChipComponent } from './AdUnitChips';
import { EventRecord } from 'prebid.js';
import { MediaTypeChipComponent } from './AdUnitChips';
import StateContext from '../../contexts/appStateContext';

const tileWrapperStyles = {
  overflow: 'hidden',
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '6px',
    background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1))',
    pointerEvents: 'none',
  },
};

const matchesSizes = (bidEvent: EventRecord<'bidResponse'> | EventRecord<'bidWon'>, adUnit: AdUnit): boolean => {
  const adUnitSizes = adUnit.mediaTypes?.banner?.sizes?.filter((size) => Array.isArray(size)).map(([w, h]) => `${w}x${h}`) || [];
  const isSizeMatch = adUnitSizes?.includes(bidEvent?.args?.size);
  const isNativeMatch = Object.keys(adUnit.mediaTypes || {})?.includes('native') && bidEvent.args.mediaType === 'native';
  const isVideoMatch = Object.keys(adUnit.mediaTypes || {})?.includes('video') && bidEvent.args.mediaType === 'video';
  return isSizeMatch || isNativeMatch || isVideoMatch;
};

const useAdServerSlot = (adUnitCode: string) => {
  const { googleAdManager } = useContext(AppStateContext);
  const [slot, setSlot] = useState<IGoogleAdManagerSlot | undefined>(undefined);

  useEffect(() => {
    const matchedSlot = googleAdManager?.slots?.find(
      ({ name, elementId }: { name: string; elementId: string }) => name === adUnitCode || elementId === adUnitCode || name.toLowerCase() === adUnitCode.toLowerCase() || elementId.toLowerCase() === adUnitCode.toLowerCase()
    );
    const fallbackSlot = googleAdManager?.slots?.length === 1 ? googleAdManager?.slots[0] : undefined;
    setSlot(matchedSlot || fallbackSlot);
  }, [adUnitCode, googleAdManager?.slots]);

  return slot;
};

const useTileExpansion = (initial = false) => {
  const [expanded, setExpanded] = React.useState(initial);
  const toggle = () => setExpanded((prev) => !prev);
  return { expanded, toggle };
};

const TileContent = ({ expanded, collapsedView, expandedView }: { expanded: boolean; collapsedView: React.ReactNode; expandedView: React.ReactNode }) => <Box sx={{ p: 0.5 }}>{!expanded ? collapsedView : expandedView}</Box>;

const TileSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Box sx={{ p: 0.5 }}>
    <Typography variant="caption">{label}:</Typography>
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0 }}>
      {children}
    </Stack>
  </Box>
);

const TileWrapper = ({ expanded, onToggle, isPanel, children, colCount }: { expanded: boolean; onToggle: () => void; isPanel: boolean; colCount: number; children: React.ReactNode }) => (
  <Grid size={{ xs: 12 / colCount }} sx={tileWrapperStyles} onClick={onToggle}>
    <Paper sx={{ height: '100%', position: 'relative' }}>
      <Box
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-expanded={expanded}
        aria-label="show more"
        sx={{
          zIndex: 100,
          position: 'absolute',
          right: '0px',
          top: '0px',
          // display: isPanel ? 'block' : 'none',
        }}
      >
        {!expanded ? <ExpandMoreIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} /> : <ExpandLessIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />}
      </Box>
      <Box onClick={(e) => e.stopPropagation()}>{children}</Box>
    </Paper>
  </Grid>
);

export const AdServerTile = ({ adUnit, colCount }: { adUnit: AdUnit; colCount: number }): JSX.Element => {
  const { isPanel, googleAdManager } = useContext(AppStateContext);
  const { expanded, toggle } = useTileExpansion();
  const slot = useAdServerSlot(adUnit.code);
  const { targeting, sizes, elementId, name } = (slot || {}) as IGoogleAdManagerSlot;

  return (
    <TileWrapper expanded={expanded} onToggle={toggle} isPanel={isPanel} colCount={colCount}>
      {!slot && (
        <TileContent
          expanded={expanded}
          collapsedView={
            <>
              <Typography variant="caption">Unable to match Prebid AdUnit with ad-server slot.</Typography>
              {googleAdManager?.slots?.length > 0 && <JSONViewerComponent style={{ padding: 0 }} name="All detected ad-server slots:" src={googleAdManager.slots} collapsed={2} />}
            </>
          }
          expandedView={
            <>
              <Typography variant="caption">Unable to match Prebid AdUnit with ad-server slot.</Typography>
              {googleAdManager?.slots?.length > 0 && <JSONViewerComponent style={{ padding: 0 }} name="All detected ad-server slots:" src={googleAdManager.slots} collapsed={2} />}
            </>
          }
        />
      )}
      {slot && (
        <TileContent
          expanded={expanded}
          collapsedView={
            <>
              {elementId && (
                <TileSection label="ElementId">
                  <Chip size="small" variant="outlined" color="primary" label={elementId} />
                </TileSection>
              )}
              {name && (
                <TileSection label="Name">
                  <Chip size="small" variant="outlined" color="primary" label={name} />
                </TileSection>
              )}
              {sizes?.length > 0 && (
                <TileSection label="Sizes">
                  {sizes.map((sizeStr) => (
                    <Chip size="small" variant="outlined" color="primary" label={sizeStr} key={sizeStr} />
                  ))}
                </TileSection>
              )}
              {targeting?.length > 0 && (
                <TileSection label="Targeting">
                  {targeting
                    .filter(({ value }) => value)
                    .sort((a, b) => (a.key > b.key ? 1 : -1))
                    .map(({ key, value }) => (
                      <Chip size="small" variant="outlined" color="primary" label={`${key}: ${value}`} key={key} />
                    ))}
                  {targeting
                    .filter(({ value }) => !value)
                    .sort((a, b) => (a.key > b.key ? 1 : -1))
                    .map(({ key, value }) => (
                      <Chip size="small" variant="outlined" color="primary" label={`${key}: ${value}`} key={key} />
                    ))}
                </TileSection>
              )}
            </>
          }
          expandedView={
            <Box sx={{ p: 0.5 }}>
              <Typography variant="caption">Ad Server Slot JSON:</Typography>
              <JSONViewerComponent style={{ padding: 0 }} src={slot} collapsed={2} />
            </Box>
          }
        />
      )}
    </TileWrapper>
  );
};

export const AdUnitTile = ({ adUnit, colCount }: { adUnit: AdUnit; colCount: number }): JSX.Element => {
  const { isPanel } = useContext(AppStateContext);
  const { expanded, toggle } = useTileExpansion();

  return (
    <TileWrapper expanded={expanded} onToggle={toggle} isPanel={isPanel} colCount={colCount}>
      <TileContent
        expanded={expanded}
        collapsedView={
          <>
            <TileSection label="AdUnit Code">
              <AdUnitChipComponent adUnit={adUnit} />
            </TileSection>
            {adUnit.ortb2Imp && JSON.stringify(adUnit.ortb2Imp) !== '{}' && (adUnit.ortb2Imp.instl === 1 || !isPanel) && (
              <TileSection label="Ortb2Imp">
                <Stack direction="column" alignItems="flex-start" flexWrap="wrap" gap={1}>
                  {adUnit.ortb2Imp.instl === 1 && <InterstitialChipComponent adUnit={adUnit} />}
                  {!isPanel && <Ortb2ImpExtChipComponent label="ortb2Imp" input={adUnit.ortb2Imp} />}
                </Stack>
              </TileSection>
            )}
          </>
        }
        expandedView={
          <Box sx={{ p: 0.5 }}>
            <Typography variant="caption">AdUnit JSON:</Typography>
            <JSONViewerComponent style={{ padding: 0 }} src={adUnit} collapsed={2} />
          </Box>
        }
      />
    </TileWrapper>
  );
};

export const BiddersTile = ({ adUnit, colCount }: { adUnit: AdUnit; colCount: number }): JSX.Element => {
  const { code: adUnitCode } = adUnit;
  const { allWinningBids, allBidResponseEvents, allBidRequestedEvents, adsRendered, isPanel } = useContext(StateContext);
  const { expanded, toggle } = useTileExpansion();

  const getBidStatus = (bidder: string) => {
    const bidReceived = allBidResponseEvents.find((evt) => evt.args?.adUnitCode === adUnitCode && evt.args.bidder === bidder && matchesSizes(evt, adUnit));
    const bidRequested = allBidRequestedEvents.find((evt) => evt.args.bidderCode === bidder && evt.args.bids.some((bid) => bid.adUnitCode === adUnitCode));
    const isWinner = allWinningBids.some((evt) => evt.args.adUnitCode === adUnitCode && evt.args.bidder === bidder && matchesSizes(evt, adUnit));
    const isRendered = adsRendered.some((evt) => evt.args.bid.adUnitCode === adUnitCode && evt.args.bid.bidder === bidder);
    const label = bidReceived?.args.cpm ? `${bidder} (${Number(bidReceived?.args.cpm).toFixed(2)} ${bidReceived?.args.currency})` : bidder;

    return { bidReceived, bidRequested, isWinner, isRendered, label };
  };

  return (
    <TileWrapper expanded={expanded} onToggle={toggle} isPanel={isPanel} colCount={colCount}>
      <TileContent
        expanded={expanded}
        collapsedView={
          <TileSection label="Bids">
            {adUnit?.bids?.map(({ bidder }, index, arr) => {
              const { bidReceived, bidRequested, isWinner, isRendered, label } = getBidStatus(bidder);
              return <BidChipComponent key={bidder} input={arr[index]} label={label} isWinner={isWinner} bidRequested={bidRequested} bidReceived={bidReceived} isRendered={isRendered} />;
            })}
          </TileSection>
        }
        expandedView={
          <Box sx={{ p: 0.5 }}>
            <Typography variant="caption">Bids JSON:</Typography>
            <JSONViewerComponent style={{ padding: 0 }} src={adUnit.bids} collapsed={2} />
          </Box>
        }
      />
    </TileWrapper>
  );
};

export const MediaTypesTile = ({ adUnit, colCount }: { adUnit: AdUnit; colCount: number }): JSX.Element => {
  const { mediaTypes, code: adUnitCode } = adUnit;
  const { allWinningBids, isPanel } = useContext(StateContext);
  const { expanded, toggle } = useTileExpansion();

  return (
    <TileWrapper expanded={expanded} onToggle={toggle} isPanel={isPanel} colCount={colCount}>
      <TileContent
        expanded={expanded}
        collapsedView={
          <>
            {(JSON.stringify(mediaTypes) === '{}' || !mediaTypes) && (
              <TileSection label="Media Types Object">
                <JSONViewerComponent style={{ padding: 0 }} src={mediaTypes} name={null} collapsed={!expanded ? 1 : 2} />
              </TileSection>
            )}
            {mediaTypes?.banner?.sizes && (
              <TileSection label="Banner Sizes">
                {mediaTypes.banner.sizes
                  .filter((size) => Array.isArray(size))
                  .map(([w, h]) => (
                    <MediaTypeChipComponent key={`${w}x${h}`} input={mediaTypes.banner} label={`${w}x${h}`} isWinner={allWinningBids.find(({ args }) => args.adUnitCode === adUnitCode)?.args?.size === `${w}x${h}`} />
                  ))}
              </TileSection>
            )}
            {mediaTypes?.native && (
              <TileSection label="Native">
                {Object.entries(mediaTypes.native).map(([key, value]) => (
                  <MediaTypeChipComponent key={key} input={value} label={key} isWinner={allWinningBids.some(({ args }) => args.adUnitCode === adUnitCode && args.mediaType === 'native')} />
                ))}
              </TileSection>
            )}
            {mediaTypes?.video && (
              <TileSection label="Video">
                {Object.entries(mediaTypes.video).map(([key, value]) => {
                  let displayLabel = key;
                  if (key === 'context' && typeof value === 'string') {
                    displayLabel = `context: ${value}`;
                  } else if (key === 'playerSize') {
                    const sizes = Array.isArray(value) && Array.isArray(value[0]) ? value : [value];
                    displayLabel = `size: ${sizes.map((s: any) => (Array.isArray(s) ? s.join('x') : s)).join(', ')}`;
                  }
                  return <MediaTypeChipComponent key={key} input={value} label={displayLabel} isWinner={allWinningBids.some(({ args }) => args.adUnitCode === adUnitCode && args.mediaType === 'video')} />;
                })}
              </TileSection>
            )}
          </>
        }
        expandedView={
          <Box sx={{ p: 0.5 }}>
            <JSONViewerComponent style={{ padding: 0 }} src={mediaTypes} name={null} collapsed={2} />
          </Box>
        }
      />
    </TileWrapper>
  );
};

export const Ortb2ImpTile = ({ adUnit, colCount }: { adUnit: AdUnit; colCount: number }): JSX.Element | null => {
  const { isPanel } = useContext(StateContext);
  const { expanded, toggle } = useTileExpansion();

  if (!adUnit?.ortb2Imp) return null;

  return (
    <TileWrapper expanded={expanded} onToggle={toggle} isPanel={isPanel} colCount={colCount}>
      <TileContent
        expanded={expanded}
        collapsedView={
          <TileSection label="ORTB2 Imp">
            {Object.entries(adUnit.ortb2Imp).map(([key, value]) => {
              if (key === 'instl' && value === 1) {
                return <InterstitialChipComponent key={key} adUnit={adUnit} />;
              }
              return <Ortb2ImpExtChipComponent key={key} input={value} label={key} />;
            })}
          </TileSection>
        }
        expandedView={
          <Box sx={{ p: 0.5 }}>
            <JSONViewerComponent style={{ padding: 0 }} src={adUnit.ortb2Imp} name={null} collapsed={2} />
          </Box>
        }
      />
    </TileWrapper>
  );
};
