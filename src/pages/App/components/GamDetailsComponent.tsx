import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { DataGrid } from '@mui/x-data-grid';
import Box from '@mui/system/Box';
import Paper from '@mui/material/Paper';
import JSONViewerComponent from '../../Shared/components/JSONViewerComponent';

const GamDetailsComponent = ({ elementId, inPopOver, truncate }: IGamDetailComponentProps): JSX.Element => {
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
      if (slot) {
        setSlotElementId(slot.getSlotElementId());
        setSlotAdUnitPath(slot.getAdUnitPath());
        setNetworkId(slot.getAdUnitPath()?.split('/')[1]?.split(','));
        setSlotTargeting(slot.getTargetingKeys().map((key, id) => ({ key, value: slot.getTargeting(key), id })));
        setSlotResponseInfo(slot.getResponseInformation());
        setQueryId(document.getElementById(slot.getSlotElementId())?.getAttribute('data-google-query-id') || null);
        if (slotResponseInfo) {
          const { creativeId, lineItemId, sourceAgnosticCreativeId, sourceAgnosticLineItemId } = slotResponseInfo as any;
          setCreativeId(creativeId || sourceAgnosticCreativeId);
          setLineItemId(lineItemId || sourceAgnosticLineItemId);
        }
        const eventHandler = (event: googletag.events.SlotRenderEndedEvent | googletag.events.SlotResponseReceived) => {
          if (event.slot.getSlotElementId() === slot.getSlotElementId()) {
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
    }
  }, [elementId, inPopOver, slotResponseInfo]);

  return (
    <React.Fragment>
      {lineItemId && (
        <Grid item>
          <Paper elevation={1} sx={{ p: inPopOver ? 1 : 0.5 }}>
            <Typography component={'span'} variant="h4">
              LineItem-ID:{' '}
            </Typography>
            <Typography component={'span'} variant="body1" sx={{ '& a': { color: 'secondary.main' } }}>
              <a
                href={`https://admanager.google.com/${networktId[0]}#delivery/LineItemDetail/lineItemId=${lineItemId}`}
                rel="noreferrer"
                target="_blank"
              >
                {lineItemId}
              </a>
              {networktId[1] &&
                networktId.map((nwId, index) => (
                  <Typography key={index} component={'span'} variant="body1" sx={{ color: 'secondary.main', '& a': { color: 'secondary.main' } }}>
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
          </Paper>
        </Grid>
      )}

      {creativeId && (
        <Grid item>
          <Paper elevation={1} sx={{ p: inPopOver ? 1 : 0.5 }}>
            <Typography variant="h4" component={'span'}>
              Creative-ID:{' '}
            </Typography>
            <Typography component={'span'} variant="body1" sx={{ '& a': { color: 'secondary.main' } }}>
              <a
                href={`https://admanager.google.com/${networktId[0]}#delivery/CreativeDetail/creativeId=${creativeId}`}
                rel="noreferrer"
                target="_blank"
              >
                {creativeId}
              </a>
              {networktId[1] &&
                networktId.map((nwId, index) => (
                  <Typography key={index} component={'span'} variant="body1" sx={{ color: 'secondary.main', '& a': { color: 'secondary.main' } }}>
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
          </Paper>
        </Grid>
      )}

      {queryId && (
        <Grid item>
          <Paper elevation={1} sx={{ p: inPopOver ? 1 : 0.5 }}>
            <Typography variant="h4" component={'span'}>
              Query-ID:{' '}
            </Typography>
            <Typography component={'span'} variant="body1" sx={{ '& a': { color: 'secondary.main' } }}>
              <a
                href={`https://admanager.google.com/${networktId[0]}#troubleshooting/screenshot/query_id=${queryId}`}
                rel="noreferrer"
                target="_blank"
              >
                {truncate ? `${queryId.substring(0, 4)}...${queryId.substring(queryId.length - 4)}` : queryId}
              </a>
              {networktId[1] &&
                networktId.map((nwId, index) => (
                  <Typography key={index} component={'span'} variant="body1" sx={{ color: 'secondary.main', '& a': { color: 'secondary.main' } }}>
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
          </Paper>
        </Grid>
      )}

      {slotAdUnitPath && (
        <Grid item>
          <Paper elevation={1} sx={{ p: inPopOver ? 1 : 0.5 }}>
            <Typography variant="h4" component={'span'}>
              AdUnit Path:{' '}
            </Typography>
            <Typography variant="body1" component={'span'}>
              {slotAdUnitPath}
            </Typography>
          </Paper>
        </Grid>
      )}

      {slotElementId && (
        <Grid item>
          <Paper elevation={1} sx={{ p: inPopOver ? 1 : 0.5 }}>
            <Typography variant="h4" component={'span'}>
              Element-ID:{' '}
            </Typography>
            <Typography variant="body1" component={'span'}>
              {slotElementId}
            </Typography>
          </Paper>
        </Grid>
      )}

      {inPopOver && (
        <React.Fragment>
          <Grid item xs={12}>
            <Grid container direction={'column'} spacing={1}>
              {slotResponseInfo && (
                <Grid item>
                  <Paper elevation={1} sx={{ p: inPopOver ? 1 : 0.5 }}>
                    <Typography sx={{ fontWeight: 'bold' }}>Response-Info:</Typography>
                    <JSONViewerComponent
                      name={false}
                      src={slotResponseInfo}
                      collapsed={false}
                      displayObjectSize={true}
                      displayDataTypes={false}
                      sortKeys={false}
                      quotesOnKeys={false}
                      indentWidth={2}
                      collapseStringsAfterLength={100}
                    />
                  </Paper>
                </Grid>
              )}

              {slotTargeting && (
                <Grid item xs={12}>
                  <Paper elevation={1} sx={{ p: 1 }}>
                    <Typography sx={{ fontWeight: 'bold' }}>Targeting:</Typography>
                    <Box sx={{ display: 'flex', flexGrow: 1 }}>
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
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Grid>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

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
export default GamDetailsComponent;
