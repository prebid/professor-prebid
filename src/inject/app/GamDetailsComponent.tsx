import React, { useState, useEffect, useRef } from 'react';
import Typography from '@mui/material/Typography';
import ReactJson from 'react-json-view';
import Grid from '@mui/material/Grid';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/system';

const GamDetailsComponent = ({ elementId, inPopOver }: IGamDetailComponentProps): JSX.Element => {
  const [networktId, setNetworkId] = useState<string>(null);
  const [slotElementId, setSlotElementId] = useState<string>(null);
  const [creativeId, setCreativeId] = useState<number>(null);
  const [lineItemId, setLineItemId] = useState<number>(null);
  const [slotAdUnitPath, setSlotAdUnitPath] = useState<string>(null);
  const [slotTargeting, setSlotTargeting] = useState<{ key: string; value: string; id: number }[]>(null);
  const [slotResponseInfo, setSlotResponseInfo] = useState<googletag.ResponseInformation>(null);

  useEffect(() => {
    setNetworkId(slotAdUnitPath?.split('/')[1]);
  }, [slotAdUnitPath]);

  useEffect(() => {
    setCreativeId(slotResponseInfo?.creativeId);
    setLineItemId(slotResponseInfo?.lineItemId);
  }, [slotResponseInfo]);

  useEffect(() => {
    if (googletag && typeof googletag?.pubads === 'function') {
      const pubads = googletag.pubads();
      const slots = pubads.getSlots();
      const slot = slots.find((slot) => slot.getSlotElementId() === elementId);
      if (slot) {
        setSlotElementId(slot.getSlotElementId());
        setSlotAdUnitPath(slot.getAdUnitPath());
        setSlotTargeting((slot as any).getTargetingKeys().map((key: string, id: number) => ({ key, value: slot.getTargeting(key), id })));
        setSlotResponseInfo(slot.getResponseInformation());
        if (!slotResponseInfo) {
          setTimeout(() => {
            setSlotResponseInfo(slot.getResponseInformation());
          }, 1000);
        }
        const eventHandler = (event: googletag.events.SlotRenderEndedEvent | googletag.events.SlotResponseReceived) => {
          if (event.slot.getSlotElementId() === slot.getSlotElementId()) {
            setSlotResponseInfo(slot.getResponseInformation());
          }
        };
        pubads.addEventListener('slotResponseReceived', eventHandler);
        pubads.addEventListener('slotRenderEnded', eventHandler);
        pubads.addEventListener('slotRenderEnded', (eventHandler)=>{});
      }
    }
  }, [elementId, inPopOver, slotResponseInfo]);
  return (
    <React.Fragment>
      {slotAdUnitPath && (
        <Grid item>
          <Typography>
            <strong>AdUnit Path: </strong>
            {slotAdUnitPath}
          </Typography>
        </Grid>
      )}
      {slotElementId && (
        <Grid item>
          <Typography>
            <strong>Element-ID: </strong>
            {slotElementId}
          </Typography>
        </Grid>
      )}

      {creativeId && (
        <Grid item>
          <Typography
            sx={{
              fontWeight: 'bold',
              '& a': { color: 'secondary.main' },
            }}
          >
            Creative-ID:{' '}
            <a href={`https://admanager.google.com/${networktId}#delivery/CreativeDetail/creativeId=${creativeId}`} rel="noreferrer" target="_blank">
              {creativeId}
            </a>
          </Typography>
        </Grid>
      )}

      {lineItemId && (
        <Grid item>
          <Typography
            sx={{
              fontWeight: 'bold',
              '& a': { color: 'secondary.main' },
            }}
          >
            LineItem-ID:{' '}
            <a href={`https://admanager.google.com/${networktId}#delivery/LineItemDetail/lineItemId=${lineItemId}`} rel="noreferrer" target="_blank">
              {lineItemId}
            </a>
          </Typography>
        </Grid>
      )}
      {inPopOver && slotResponseInfo && JSON.stringify(slotResponseInfo) !== '{}' && (
        <Grid item>
          <Typography id="slotResponseInfo" sx={{ fontWeight: 'bold' }}>
            Response-Info:
          </Typography>
          <ReactJson
            src={slotResponseInfo}
            collapsed={false}
            enableClipboard={false}
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
      {inPopOver && slotTargeting && JSON.stringify(slotTargeting) !== '[]' && (
        <Grid item>
          <Typography sx={{ fontWeight: 'bold' }}>Targeting:</Typography>
          <Box sx={{ display: 'flex', flexGrow: 1, width: '100%', backgroundColor: 'background.paper' }}>
            <DataGrid
              density="compact"
              rows={slotTargeting}
              columns={[
                { field: 'key', headerName: 'Key', align: 'left', width: 200 },
                { field: 'value', headerName: 'Value', align: 'left', width: 200 },
              ]}
              disableSelectionOnClick
              autoHeight
              hideFooter
            />
          </Box>
        </Grid>
      )}
    </React.Fragment>
  );
};

export interface IGamDetailComponentProps {
  elementId: string;
  inPopOver: boolean;
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
export default GamDetailsComponent;
