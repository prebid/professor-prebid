import React, { useState, useEffect } from 'react';
import { getParentGamPubAds } from '../InjectedApp';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Box from '@mui/system/Box';
import Paper from '@mui/material/Paper';
import JSONViewerComponent from '../../Shared/components/JSONViewerComponent';
import { getSlotTargeting } from '../../Shared/gptTargeting';

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
    const pubads = getParentGamPubAds();
    if (pubads) {
      const slots = pubads.getSlots();
      const slot = slots.find((slot) => slot.getSlotElementId() === elementId) || slots.find((slot) => slot.getAdUnitPath() === elementId);
      if (slot) {
        setSlotElementId(slot.getSlotElementId());
        setSlotAdUnitPath(slot.getAdUnitPath());
        setNetworkId(slot.getAdUnitPath()?.split('/')[1]?.split(','));
        setSlotTargeting(Object.entries(getSlotTargeting(slot)).map(([key, value], id) => ({ key, value, id })));
        const responseInfo = slot.getResponseInformation();
        setSlotResponseInfo(responseInfo);
        setQueryId(document.getElementById(slot.getSlotElementId())?.getAttribute('data-google-query-id') || null);
        if (responseInfo) {
          const { creativeId, lineItemId, sourceAgnosticCreativeId, sourceAgnosticLineItemId } = responseInfo as any;
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
  }, [elementId, inPopOver]);

  return (
    <React.Fragment>
      {lineItemId && (
        <div
          className="prpb-chip"
          style={{
            padding: inPopOver ? '8px' : '3px 6px',
            borderRadius: '4px',
            backgroundColor: inPopOver ? undefined : '#ffffff',
            border: inPopOver ? undefined : '1px solid rgba(67, 142, 217, 0.3)',
            boxShadow: inPopOver ? undefined : '0 1px 2px rgba(0,0,0,0.06)',
            fontSize: inPopOver ? undefined : '11px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            color: '#1e293b',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Typography component={'span'} variant="caption" sx={{ color: 'text.primary', fontSize: 'inherit' }}>
            <strong style={{ color: '#d97706', fontWeight: 700 }}>LineItem-ID: </strong>
          </Typography>
          <Typography component={'span'} variant="caption" sx={{ fontSize: 'inherit', '& a': { color: '#1976d2', textDecoration: 'none', fontWeight: 600 } }}>
            <a href={`https://admanager.google.com/${networktId[0]}#delivery/LineItemDetail/lineItemId=${lineItemId}`} rel="noreferrer" target="_blank" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 600 }}>
              {lineItemId}
            </a>
            {networktId[1] &&
              networktId.map((nwId, index) => (
                <Typography key={nwId} component={'span'} variant="body1" sx={{ color: 'secondary.main', '& a': { color: 'secondary.main' } }}>
                  {index === 0 && ' ('}
                  {index > 0 && (
                    <a href={`https://admanager.google.com/${nwId}#delivery/CreativeDetail/creativeId=${creativeId}`} rel="noreferrer" target="_blank">
                      {`${index}`}
                    </a>
                  )}
                  {index === networktId.length - 1 ? ')' : index === 0 ? '' : ', '}
                </Typography>
              ))}
          </Typography>
        </div>
      )}

      {creativeId && (
        <div
          className="prpb-chip"
          style={{
            padding: inPopOver ? '8px' : '3px 6px',
            borderRadius: '4px',
            backgroundColor: inPopOver ? undefined : '#ffffff',
            border: inPopOver ? undefined : '1px solid rgba(67, 142, 217, 0.3)',
            boxShadow: inPopOver ? undefined : '0 1px 2px rgba(0,0,0,0.06)',
            fontSize: inPopOver ? undefined : '11px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            color: '#1e293b',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Typography variant="caption" component={'span'} sx={{ color: 'text.primary', fontSize: 'inherit' }}>
            <strong style={{ color: '#d97706', fontWeight: 700 }}>Creative-ID: </strong>
          </Typography>
          <Typography component={'span'} variant="caption" sx={{ fontSize: 'inherit', '& a': { color: '#1976d2', textDecoration: 'none', fontWeight: 600 } }}>
            <a href={`https://admanager.google.com/${networktId[0]}#delivery/CreativeDetail/creativeId=${creativeId}`} rel="noreferrer" target="_blank" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 600 }}>
              {creativeId}
            </a>
            {networktId[1] &&
              networktId.map((nwId, index) => (
                <Typography key={nwId} component={'span'} variant="body1" sx={{ color: 'secondary.main', '& a': { color: 'secondary.main' } }}>
                  {index === 0 && ' ('}
                  {index > 0 && (
                    <a href={`https://admanager.google.com/${nwId}#delivery/CreativeDetail/creativeId=${creativeId}`} rel="noreferrer" target="_blank">
                      {`${index}`}
                    </a>
                  )}
                  {index === networktId.length - 1 ? ')' : index === 0 ? '' : ', '}
                </Typography>
              ))}
          </Typography>
        </div>
      )}

      {queryId && (
        <div
          className="prpb-chip"
          style={{
            padding: inPopOver ? '8px' : '3px 6px',
            borderRadius: '4px',
            backgroundColor: inPopOver ? undefined : '#ffffff',
            border: inPopOver ? undefined : '1px solid rgba(67, 142, 217, 0.3)',
            boxShadow: inPopOver ? undefined : '0 1px 2px rgba(0,0,0,0.06)',
            fontSize: inPopOver ? undefined : '11px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            color: '#1e293b',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Typography variant="caption" component={'span'} sx={{ color: 'text.primary', fontSize: 'inherit' }}>
            <strong style={{ color: '#d97706', fontWeight: 700 }}>Query-ID: </strong>
          </Typography>
          <Typography component={'span'} variant="caption" sx={{ fontSize: 'inherit', '& a': { color: '#1976d2', textDecoration: 'none', fontWeight: 600 } }}>
            <a href={`https://admanager.google.com/${networktId[0]}#troubleshooting/screenshot/query_id=${queryId}`} rel="noreferrer" target="_blank" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 600 }}>
              {truncate ? `${queryId.substring(0, 4)}...${queryId.substring(queryId.length - 4)}` : queryId}
            </a>
            {networktId[1] &&
              networktId.map((nwId, index) => (
                <Typography key={nwId} component={'span'} variant="body1" sx={{ color: 'secondary.main', '& a': { color: 'secondary.main' } }}>
                  {index === 0 && ' ('}
                  {index > 0 && (
                    <a href={`https://admanager.google.com/${nwId}#troubleshooting/screenshot/query_id=${queryId}`} rel="noreferrer" target="_blank">
                      {`${index}`}
                    </a>
                  )}
                  {index === networktId.length - 1 ? ')' : index === 0 ? '' : ', '}
                </Typography>
              ))}
          </Typography>
        </div>
      )}

      {slotAdUnitPath && (
        <div
          className="prpb-chip"
          style={{
            padding: inPopOver ? '8px' : '3px 6px',
            borderRadius: '4px',
            backgroundColor: inPopOver ? undefined : '#ffffff',
            border: inPopOver ? undefined : '1px solid rgba(67, 142, 217, 0.3)',
            boxShadow: inPopOver ? undefined : '0 1px 2px rgba(0,0,0,0.06)',
            fontSize: inPopOver ? undefined : '11px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            color: '#1e293b',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Typography variant="caption" component={'span'} sx={{ color: 'text.primary', fontSize: 'inherit' }}>
            <strong style={{ color: '#d97706', fontWeight: 700 }}>AdUnit Path: </strong>
          </Typography>
          <Typography variant="caption" component={'span'} sx={{ color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', verticalAlign: 'bottom', maxWidth: 'calc(100% - 80px)', fontSize: 'inherit' }}>
            {slotAdUnitPath}
          </Typography>
        </div>
      )}

      {slotElementId && (
        <div
          className="prpb-chip"
          style={{
            padding: inPopOver ? '8px' : '3px 6px',
            borderRadius: '4px',
            backgroundColor: inPopOver ? undefined : '#ffffff',
            border: inPopOver ? undefined : '1px solid rgba(67, 142, 217, 0.3)',
            boxShadow: inPopOver ? undefined : '0 1px 2px rgba(0,0,0,0.06)',
            fontSize: inPopOver ? undefined : '11px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            color: '#1e293b',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Typography variant="caption" component={'span'} sx={{ color: 'text.primary', fontSize: 'inherit' }}>
            <strong style={{ color: '#d97706', fontWeight: 700 }}>Element-ID: </strong>
          </Typography>
          <Typography variant="caption" component={'span'} sx={{ color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', verticalAlign: 'bottom', maxWidth: 'calc(100% - 80px)', fontSize: 'inherit' }}>
            {slotElementId}
          </Typography>
        </div>
      )}

      {inPopOver && (
        <React.Fragment>
          <Grid size={12}>
            <Grid container direction={'column'}>
              {slotResponseInfo && (
                <Grid>
                  <Paper elevation={1} sx={{ p: inPopOver ? 1 : 0.5 }}>
                    <Typography sx={{ fontWeight: 'bold' }}>Response-Info:</Typography>
                    <JSONViewerComponent name={''} src={slotResponseInfo} collapsed={false} displayObjectSize={true} displayDataTypes={false} sortKeys={false} quotesOnKeys={false} indentWidth={2} collapseStringsAfterLength={100} />
                  </Paper>
                </Grid>
              )}

              {slotTargeting && (
                <Grid size={12}>
                  <Paper elevation={1} sx={{ p: 1 }}>
                    <Typography sx={{ fontWeight: 'bold' }}>Targeting:</Typography>
                    <Box sx={{ display: 'flex', flexGrow: 1 }}>
                      <Grid container>
                        <Grid size={6}>
                          <Typography variant={'h3'} sx={{ textAlign: 'left' }}>
                            Key
                          </Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant={'h3'} sx={{ textAlign: 'left' }}>
                            Value
                          </Typography>
                        </Grid>
                        {slotTargeting.map((st, i) => (
                          <React.Fragment key={st.key}>
                            <Grid size={6}>
                              <Typography variant={'body1'} sx={{ textAlign: 'left' }}></Typography>
                              {st.key}
                            </Grid>
                            <Grid size={6}>
                              <Typography variant={'body1'} sx={{ textAlign: 'left' }}></Typography>
                              {st.value}
                            </Grid>
                          </React.Fragment>
                        ))}
                      </Grid>
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
