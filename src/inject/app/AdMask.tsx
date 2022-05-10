import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ReactJson, { OnCopyProps } from 'react-json-view';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import theme from '../../pages/theme';
import { ThemeProvider } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Close from '@mui/icons-material/Close';
import Refresh from '@mui/icons-material/Refresh';
import MinimizeIcon from '@mui/icons-material/Minimize';
import MaximizeIcon from '@mui/icons-material/Maximize';
const getMaxZIndex = () =>
  Math.max(
    ...Array.from(document.querySelectorAll('*'), (el) => parseFloat(window.getComputedStyle(el).zIndex)).filter((zIndex) => !Number.isNaN(zIndex)),
    0
  );

const handleCopy = (copy: OnCopyProps) => {
  navigator.clipboard.writeText(JSON.stringify(copy.src, null, '\t'));
};
const AdMaskComponent = ({ elementId, winningCPM, winningBidder, currency, timeToRespond, closePortal }: IMaskInputData): JSX.Element => {
  const [gamInfos, setGamInfos] = useState<IGamInfos>(null);
  const [expanded, setExpanded] = useState<boolean>(true);
  const slotRef = useRef<googletag.Slot>(null);
  useEffect(() => {
    if (!googletag || !googletag.pubads) {
      setGamInfos({});
    }
    const pubtag = googletag.pubads();
    const slots = pubtag.getSlots();
    const slot = slots.find((slot) => (slot as any).getSlotElementId() === elementId);
    if (slot) {
      slotRef.current = slot;
      const slotElementId = slot.getSlotElementId();
      const slotAdUnitPath = slot.getAdUnitPath();
      const slotResponseInfo = slot.getResponseInformation() || {};
      const slotId = (slot as any).getSlotId() || {};
      const slotTargeting = (slot as any).getTargetingKeys().map((key: string) => {
        const tmp: any = {};
        tmp[key] = slot.getTargeting(key);
        return tmp;
      });
      setGamInfos({
        slotElementId,
        slotAdUnitPath,
        slotResponseInfo,
        slotId,
        slotTargeting,
      });
    }
  }, [elementId]);
  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          height: expanded ? 1 : 'auto',
          width: 1,
          opacity: 0.8,
          '&:hover': { opacity: 0.95 },
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.text.primary,
          p: 1,
          zIndex: getMaxZIndex() + 1,
        }}
      >
        <Grid
          container
          spacing={0.5}
          sx={{
            textAlign: 'left',
            '& div > div': { p: 0.5 },
            '& div > div > div > div > span:nth-child(1) > span > span:nth-child(2) > span.object-key > span': {
              fontWeight: 'bold',
              color: theme.palette.text.primary,
            },
          }}
        >
          <Grid xs={12} container item justifyContent="space-between" sx={{ p: 0 }}>
            <Grid item>
              <Paper>
                <Typography>
                  <strong>Element Id: </strong>
                  {elementId}
                </Typography>
              </Paper>
            </Grid>
            <Grid item>
              <IconButton size="small" sx={{ p: 0 }} onClick={() => setExpanded(!expanded)}>
                {expanded && <MinimizeIcon />}
                {!expanded && <MaximizeIcon />}
              </IconButton>
              <IconButton size="small" sx={{ p: 0 }} onClick={() => googletag.pubads().refresh([slotRef.current])}>
                <Refresh />
              </IconButton>
              <IconButton size="small" sx={{ p: 0 }} onClick={closePortal}>
                <Close />
              </IconButton>
            </Grid>
          </Grid>
          {winningCPM && expanded && (
            <Grid item>
              <Paper>
                <Typography>
                  <strong>Winning CPM: </strong>
                  {winningCPM} {currency}
                </Typography>
              </Paper>
            </Grid>
          )}
          {winningBidder && expanded && (
            <Grid item>
              <Paper>
                <Typography>
                  <strong>Winning Bidder: </strong>
                  {winningBidder}
                </Typography>
              </Paper>
            </Grid>
          )}
          {timeToRespond && expanded && (
            <Grid item>
              <Paper>
                <Typography>
                  <strong>Time To Respond: </strong>
                  {timeToRespond}ms
                </Typography>
              </Paper>
            </Grid>
          )}
          {gamInfos && expanded && (
            <Grid item>
              <Paper>
                <Typography>
                  <strong>slotAdUnitPath: </strong>
                  {gamInfos.slotAdUnitPath}
                </Typography>
              </Paper>
            </Grid>
          )}
          {gamInfos && expanded && (
            <Grid item>
              <Paper>
                <Typography>
                  <strong>slotElementId: </strong>
                  {gamInfos.slotElementId}
                </Typography>
              </Paper>
            </Grid>
          )}
          {gamInfos && JSON.stringify(gamInfos.slotTargeting) !== '[]' && expanded && (
            <Grid
              item
              sx={{
                '& div > div': {
                  padding: '0px',
                },
              }}
            >
              <ReactJson
                src={gamInfos.slotTargeting}
                name="slotTargeting"
                collapsed={0}
                enableClipboard={handleCopy}
                displayObjectSize={true}
                displayDataTypes={false}
                sortKeys={false}
                quotesOnKeys={false}
                indentWidth={2}
                collapseStringsAfterLength={100}
                style={{
                  fontSize: '12px',
                  fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                  backgroundColor: 'white',
                  fontWeight: 400,
                  lineHeight: 1.5,
                  letterSpacing: '0.00938em',
                  borderRadius: '4px',
                }}
              />
            </Grid>
          )}
          {gamInfos && JSON.stringify(gamInfos.slotResponseInfo) !== '{}' && expanded && (
            <Grid
              item
              sx={{
                '& div > div': {
                  padding: '0px',
                },
              }}
            >
              <ReactJson
                src={gamInfos.slotResponseInfo}
                name="slotResponseInfo"
                collapsed={0}
                enableClipboard={handleCopy}
                displayObjectSize={true}
                displayDataTypes={false}
                sortKeys={false}
                quotesOnKeys={false}
                indentWidth={2}
                collapseStringsAfterLength={100}
                style={{
                  fontSize: '12px',
                  fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                  backgroundColor: 'white',
                  fontWeight: 400,
                  lineHeight: 1.5,
                  letterSpacing: '0.00938em',
                  borderRadius: '4px',
                }}
              />
            </Grid>
          )}

          {gamInfos && JSON.stringify(gamInfos.slotId) !== '{}' && expanded && (
            <Grid item>
              <Typography>
                <strong>slotId: </strong>
              </Typography>
              <ReactJson
                src={gamInfos.slotId}
                name={false}
                collapsed={0}
                enableClipboard={handleCopy}
                displayObjectSize={true}
                displayDataTypes={false}
                sortKeys={false}
                quotesOnKeys={false}
                indentWidth={2}
                collapseStringsAfterLength={100}
                style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
              />
              <Paper></Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </ThemeProvider>
  );
};

export interface IMaskInputData {
  elementId: string;
  creativeRenderTime: number;
  winningBidder: string;
  winningCPM: number;
  currency: string;
  timeToRespond: number;
  closePortal?: () => void;
}

export interface IGamInfos {
  slotAdUnitPath?: string;
  slotName?: string;
  slotResponseInfo?: object;
  slotElementId?: string;
  slotId?: object;
  slotTargeting?: unknown[];
}
export default AdMaskComponent;
