import React from 'react';
import { IGlobalPbjs, IPrebidAdUnit, IPrebidBid } from '../../Content/scripts/prebid';
import { getMaxZIndex } from './AdOverlayPortal';
import { CacheProvider } from '@emotion/react/';
import { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import createCache from '@emotion/cache';
import Box from '@mui/material/Card';
import Close from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import JSONViewerComponent from '../../Shared/components/JSONViewerComponent';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GavelIcon from '@mui/icons-material/Gavel';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PreviewIcon from '@mui/icons-material/Preview';
import HelpIcon from '@mui/icons-material/Help';
import CrisisAlertIcon from '@mui/icons-material/CrisisAlert';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { Paper } from '@mui/material';

const ExpandableItem = ({
  avatar,
  children,
  title,
  json,
}: {
  avatar: JSX.Element;
  title: string;
  children?: JSX.Element;
  json?: object;
}): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <Grid item xs={12} sm={8} md={expanded ? 12 : 6} sx={{ minHeight: 250, height: expanded ? 'unset' : 250, overflow: 'hidden' }}>
      <Box sx={{ height: 1 }}>
        <Box elevation={0} sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }} onClick={() => setExpanded(!expanded)}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>{avatar}</Avatar>
          <Typography variant="h3">{title}</Typography>
          <ExpandMoreIcon
            sx={{
              transform: !expanded ? 'rotate(0deg)' : 'rotate(180deg)',
            }}
          />
        </Box>
        {children && children}
        {json && (
          <JSONViewerComponent
            src={json}
            name={false}
            displayObjectSize={true}
            displayDataTypes={false}
            sortKeys={false}
            quotesOnKeys={false}
            indentWidth={2}
            collapsed={false}
            collapseStringsAfterLength={expanded ? false : 30}
          />
        )}
      </Box>
    </Grid>
  );
};

const Item = ({ children }: any): JSX.Element => {
  return (
    <Grid item xs={2} sm={4} md={6}>
      <Box children={children} sx={{ p: 1 }} />
    </Grid>
  );
};

const PopOverComponent = ({
  elementId,
  winningCPM,
  winningBidder,
  currency,
  timeToRespond,
  anchorEl,
  setAnchorEl,
  pbjsNameSpace,
}: PopOverComponentProps): JSX.Element => {
  const cacheTopPage = createCache({ key: 'css', container: window.top.document?.head, prepend: true });
  const pbjs: IGlobalPbjs = window[pbjsNameSpace];
  const open = Boolean(anchorEl);

  const [adUnit, setAdunit] = useState<IPrebidAdUnit>(null);
  const [bidsSorted, setBidsSorted] = useState<IPrebidBid[]>(null);
  const [winningBid, setWinningBid] = useState<IPrebidBid>(null);

  useEffect(() => {
    const { bids } = pbjs.getBidResponsesForAdUnitCode(elementId);
    const bidsSorted = bids.sort((a: any, b: any) => b.cpm - a.cpm);
    const { 0: winningBid } = pbjs.getAllWinningBids().filter(({ adUnitCode }) => adUnitCode === elementId);
    setAdunit(pbjs.adUnits.find((el) => el.code === elementId));
    setBidsSorted(bidsSorted);
    setWinningBid(winningBid);
  }, [elementId, pbjs]);

  // gam stuff
  const [networktId, setNetworkId] = useState<string[]>(null);
  const [slotElementId, setSlotElementId] = useState<string>(null);
  const [creativeId, setCreativeId] = useState<number>(null);
  const [queryId, setQueryId] = useState<string>(null);
  const [lineItemId, setLineItemId] = useState<number>(null);
  const [slotAdUnitPath, setSlotAdUnitPath] = useState<string>(null);
  const [slotTargeting, setSlotTargeting] = useState<{ key: string; value: string[]; id: number }[]>(null);
  const [slotResponseInfo, setSlotResponseInfo] = useState<googletag.ResponseInformation>(null);

  useEffect(() => {
    if (window.parent.googletag && typeof window.parent.googletag?.pubads === 'function') {
      const pubads = googletag.pubads();
      const slots = pubads.getSlots();
      const slot = slots.find((slot) => slot.getSlotElementId() === elementId) || slots.find((slot) => slot.getAdUnitPath() === elementId);

      setSlotElementId(slot?.getSlotElementId());
      setSlotAdUnitPath(slot?.getAdUnitPath());
      setNetworkId(slot?.getAdUnitPath()?.split('/')[1]?.split(','));
      setSlotTargeting(slot?.getTargetingKeys().map((key, id) => ({ key, value: slot.getTargeting(key), id })));
      setSlotResponseInfo(slot?.getResponseInformation());
      setQueryId(document.getElementById(slot?.getSlotElementId())?.getAttribute('data-google-query-id') || null);

      if (slotResponseInfo) {
        const { creativeId, lineItemId, sourceAgnosticCreativeId, sourceAgnosticLineItemId } = slotResponseInfo as any;
        setCreativeId(creativeId || sourceAgnosticCreativeId);
        setLineItemId(lineItemId || sourceAgnosticLineItemId);
      }

      const eventHandler = (event: googletag.events.SlotRenderEndedEvent | googletag.events.SlotResponseReceived) => {
        if (slot?.getSlotElementId() === event.slot.getSlotElementId()) {
          setSlotResponseInfo(slot.getResponseInformation());
        }
      };
      pubads.addEventListener('slotResponseReceived', eventHandler);
      pubads.addEventListener('slotRenderEnded', eventHandler);
      return () => {
        pubads.removeEventListener('slotResponseReceived', eventHandler);
        pubads.removeEventListener('slotRenderEnded', eventHandler);
      };
    }
  }, [elementId, slotResponseInfo]);

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      open={open}
      onClose={() => setAnchorEl(null)}
      sx={{ zIndex: getMaxZIndex() + 1, maxWidth: 0.5 }}
      transformOrigin={{ vertical: 'center', horizontal: 'center' }}
      children={
        <CacheProvider
          value={cacheTopPage}
          children={
            <Grid
              container
              rowSpacing={0.5}
              columnSpacing={0.5}
              columns={{ xs: 4, sm: 8, md: 12 }}
              sx={{
                backgroundColor: 'primary.light',
                color: 'text.primary',
                padding: 0.5,
              }}
            >
              <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'row-reverse' }}>
                <IconButton sx={{ p: 0 }} onClick={() => setAnchorEl(null)}>
                  <Close />
                </IconButton>
              </Grid>
              {winningCPM && (
                <Item
                  children={
                    <Typography>
                      <strong>Winning CPM: </strong> {winningCPM} {currency}
                    </Typography>
                  }
                />
              )}
              {winningBidder && (
                <Item
                  children={
                    <Typography>
                      <strong>Winning Bidder: </strong> {winningBidder}
                    </Typography>
                  }
                />
              )}
              {timeToRespond && (
                <Item
                  children={
                    <Typography>
                      <strong>Time To Respond: </strong> {timeToRespond}ms
                    </Typography>
                  }
                />
              )}
              {timeToRespond && (
                <Item
                  children={
                    <Typography>
                      <strong>Time To Respond: </strong> {timeToRespond}ms
                    </Typography>
                  }
                />
              )}
              {pbjs && pbjs.version && (
                <Item
                  children={
                    <Typography>
                      <strong>Prebid Version: </strong>
                      {pbjs.version}
                    </Typography>
                  }
                />
              )}
              {(lineItemId || creativeId || queryId || slotAdUnitPath || slotElementId) && <Grid item xs={4} sm={8} md={12} children={<Divider />} />}
              {lineItemId && (
                <Item
                  children={
                    <Typography sx={{ '& a': { color: 'secondary.main' } }}>
                      <strong>LineItem-ID: </strong>
                      <a
                        href={`https://admanager.google.com/${networktId[0]}#delivery/LineItemDetail/lineItemId=${lineItemId}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {lineItemId}
                      </a>
                      {networktId[1] &&
                        networktId.map((nwId, index) => (
                          <Typography
                            key={index}
                            component={'span'}
                            variant="body1"
                            sx={{ color: 'secondary.main', '& a': { color: 'secondary.main' } }}
                          >
                            {index === 0 && ' ('}
                            {index > 0 && (
                              <a
                                href={`https://admanager.google.com/${nwId}#delivery/CreativeDetail/creativeId=${creativeId}`}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {`${index}`}
                              </a>
                            )}
                            {index === networktId.length - 1 ? ')' : index === 0 ? '' : ', '}
                          </Typography>
                        ))}
                    </Typography>
                  }
                />
              )}
              {creativeId && (
                <Item
                  children={
                    <Typography sx={{ '& a': { color: 'secondary.main' } }}>
                      <strong>Creative-ID: </strong>
                      <a
                        href={`https://admanager.google.com/${networktId[0]}#delivery/CreativeDetail/creativeId=${creativeId}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {creativeId}
                      </a>
                      {networktId[1] &&
                        networktId.map((nwId, index) => (
                          <Typography
                            key={index}
                            component={'span'}
                            variant="body1"
                            sx={{ color: 'secondary.main', '& a': { color: 'secondary.main' } }}
                          >
                            {index === 0 && ' ('}
                            {index > 0 && (
                              <a
                                href={`https://admanager.google.com/${nwId}#delivery/CreativeDetail/creativeId=${creativeId}`}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {`${index}`}
                              </a>
                            )}
                            {index === networktId.length - 1 ? ')' : index === 0 ? '' : ', '}
                          </Typography>
                        ))}
                    </Typography>
                  }
                />
              )}
              {queryId && (
                <Item
                  children={
                    <>
                      <Typography variant="h4" component={'span'}>
                        Query-ID:{' '}
                      </Typography>
                      <Typography component={'span'} variant="body1" sx={{ '& a': { color: 'secondary.main' } }}>
                        <a
                          href={`https://admanager.google.com/${networktId[0]}#troubleshooting/screenshot/query_id=${queryId}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {false ? `${queryId.substring(0, 4)}...${queryId.substring(queryId.length - 4)}` : queryId}
                        </a>
                        {networktId[1] &&
                          networktId.map((nwId, index) => (
                            <Typography
                              key={index}
                              component={'span'}
                              variant="body1"
                              sx={{ color: 'secondary.main', '& a': { color: 'secondary.main' } }}
                            >
                              {index === 0 && ' ('}
                              {index > 0 && (
                                <a
                                  href={`https://admanager.google.com/${nwId}#troubleshooting/screenshot/query_id=${queryId}`}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  {`${index}`}
                                </a>
                              )}
                              {index === networktId.length - 1 ? ')' : index === 0 ? '' : ', '}
                            </Typography>
                          ))}
                      </Typography>
                    </>
                  }
                />
              )}
              {slotAdUnitPath && (
                <Item
                  children={
                    <Typography>
                      <strong>AdUnit Path: </strong> {slotAdUnitPath}{' '}
                    </Typography>
                  }
                />
              )}
              {slotElementId && (
                <Item
                  children={
                    <Typography>
                      <strong>Element-ID: </strong>
                      {slotElementId}
                    </Typography>
                  }
                />
              )}
              {(winningBid || bidsSorted || winningBid || slotResponseInfo || slotTargeting) && (
                <Grid item xs={4} sm={8} md={12} children={<Divider />} />
              )}
              {adUnit && <ExpandableItem title="AdUnit Info" avatar={<SettingsOutlinedIcon />} json={adUnit} />}
              {winningBid && <ExpandableItem title="Winning Bid" avatar={<GavelIcon />} json={winningBid} />}
              {bidsSorted && bidsSorted[0] && <ExpandableItem title="All Bids for AdUnit" avatar={<AttachMoneyIcon />} json={bidsSorted} />}
              {winningBid && (
                <ExpandableItem
                  title="Creative Preview"
                  avatar={<PreviewIcon />}
                  json={winningBid && winningBid.native}
                  children={
                    winningBid &&
                    winningBid.ad && (
                      <Box
                        elevation={0}
                        sx={{ display: 'flex', justifyContent: 'center' }}
                        component="div"
                        dangerouslySetInnerHTML={{ __html: winningBid?.ad || JSON.stringify(winningBid.native) }}
                      />
                    )
                  }
                />
              )}
              {slotResponseInfo && <ExpandableItem title="Response Info" avatar={<HelpIcon />} json={slotResponseInfo} />}
              {slotTargeting && (
                <ExpandableItem
                  title="Adserver Targeting"
                  avatar={<CrisisAlertIcon />}
                  children={
                    <Box elevation={0} sx={{ display: 'flex', flexGrow: 1, backgroundColor: 'primary.light' }}>
                      <Grid container spacing={0.25}>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 0.5 }}>
                            <Typography variant={'h3'} sx={{ textAlign: 'left' }}>
                              Key
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 0.5 }}>
                            <Typography variant={'h3'} sx={{ textAlign: 'left' }}>
                              Value
                            </Typography>
                          </Paper>
                        </Grid>
                        {slotTargeting.map((st, i) => (
                          <React.Fragment key={i}>
                            <Grid item xs={6} sx={{}}>
                              <Paper sx={{ p: 0.5, h: 1, minHeight: 1 }}>
                                <Typography variant={'body1'} sx={{ textAlign: 'left' }}>
                                  {st.key}
                                </Typography>
                              </Paper>
                            </Grid>
                            <Grid item xs={6} sx={{}}>
                              <Paper sx={{ p: 0.5, h: 1, minHeight: 1 }}>
                                <Typography variant={'body1'} sx={{ textAlign: 'left' }}>
                                  {st.value}
                                </Typography>
                              </Paper>
                            </Grid>
                          </React.Fragment>
                        ))}
                      </Grid>
                    </Box>
                  }
                />
              )}
            </Grid>
          }
        />
      }
    />
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
  pbjsNameSpace: string;
}

export default PopOverComponent;
export interface IGamDetailComponentProps {
  elementId: string;
  inPopOver: boolean;
  truncate: boolean;
}

export interface IGamInfos {
  slotAdUnitPath?: string;
  slotName?: string;
  slotResponseInfo?: googletag.ResponseInformation;
  slotElementId?: string;
  accountId?: string;
  slotTargeting?: unknown[];
  slotTargetingKeys?: string[];
}
