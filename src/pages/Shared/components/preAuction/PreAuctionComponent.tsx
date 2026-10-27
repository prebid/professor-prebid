import React, { useCallback, useContext, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Alert from '@mui/material/Alert';
import Popover from '@mui/material/Popover';
import CodeIcon from '@mui/icons-material/Code';
import DownloadIcon from '@mui/icons-material/Download';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import AppStateContext from '../../contexts/appStateContext';
import InspectedPageContext from '../../contexts/inspectedPageContext';
import JSONViewerComponent from '../JSONViewerComponent';
import { GridCell } from '../bids/BidsComponent';
import { AutoComplete } from '../autocomplete/AutoComplete';
import { createQueryEngine, distinct, replaceLastToken } from '../autocomplete/utils';
import { download, conditionalPluralization as cP } from '../../utils';
import { getProviderDiagnostics, IAuctionVerdict, IProviderDiagnostic } from './providerDiagnostics';
import { correlateHar, IProviderTiming } from './harCorrelation';
import { ATTRIBUTION_HELP, ATTRIBUTION_LABEL, formatMs, VERDICT_COLOR, VERDICT_HELP, verdictLabel } from './labels';
import PreAuctionHelp from './PreAuctionHelp';

export const PROVIDER_FIELD_MAP = {
  provider: (provider: IProviderDiagnostic) => provider.name,
  type: (provider: IProviderDiagnostic) => provider.type,
  awaited: (provider: IProviderDiagnostic) => String(provider.awaited),
  verdict: (provider: IProviderDiagnostic) => provider.auctions.map(({ verdict }) => verdict).join(' '),
  host: (provider: IProviderDiagnostic) => provider.hosts.join(' '),
} as const;

const providerQueryEngine = createQueryEngine<IProviderDiagnostic>(PROVIDER_FIELD_MAP);

const buildSuggestions = (providers: IProviderDiagnostic[]): string[] =>
  distinct([
    ...Object.keys(PROVIDER_FIELD_MAP).map((key) => `${key}:`),
    ...providers.map(({ name }) => `provider:${name.toLowerCase()}`),
    ...providers.map(({ type }) => `type:${type}`),
    ...providers.map(({ awaited }) => `awaited:${awaited}`),
    ...providers.flatMap(({ auctions }) => auctions.map(({ verdict }) => `verdict:${verdict}`)),
    ...providers.flatMap(({ hosts }) => hosts.map((host) => `host:${host}`)),
  ]).sort();

/** Tooltips here carry several facts; a wall of text in a narrow box is unreadable. */
const InfoTooltip = ({ title, children }: { title: React.ReactNode; children: React.ReactElement }): JSX.Element => (
  <Tooltip arrow componentsProps={{ tooltip: { sx: { maxWidth: 380, p: 1, fontSize: '0.7rem', lineHeight: 1.5 } } }} title={title}>
    {children}
  </Tooltip>
);

const TooltipLines = ({ lines }: { lines: (string | false | undefined)[] }): JSX.Element => (
  <Box component="span" sx={{ display: 'block' }}>
    {lines.filter(Boolean).map((line, index) => (
      <Box key={index} component="span" sx={{ display: 'block', mb: 0.5, '&:last-of-type': { mb: 0 } }}>
        {line}
      </Box>
    ))}
  </Box>
);

/**
 * A verdict chip that opens the auction it was read from. Same shape as `DataPreviewChip` in
 * AdUnitChips: an anchored popover rather than a modal.
 */
const AuctionVerdictChip = ({ provider, auction, auctionEvent }: { provider: IProviderDiagnostic; auction: IAuctionVerdict; auctionEvent?: unknown }): JSX.Element => {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <React.Fragment>
      <Tooltip title={`Auction #${auction.auctionIndex}: ${VERDICT_HELP[auction.verdict]} Click to open.`} arrow>
        <Chip
          label={`#${auction.auctionIndex} ${verdictLabel(auction.verdict, provider.type)}`}
          size="small"
          color={VERDICT_COLOR[auction.verdict]}
          variant="outlined"
          // the row header toggles the collapse, so the chip must not let the click through
          onClick={(event) => {
            event.stopPropagation();
            setAnchorEl(event.currentTarget);
          }}
          sx={{ height: 20, fontSize: '0.65rem', cursor: 'pointer' }}
        />
      </Tooltip>

      {/*
        The popover renders through a portal, but React events propagate through the React tree rather
        than the DOM, so without this every click inside it - expanding a JSON node, hitting the
        backdrop - reaches the row header underneath and toggles the row open.
      */}
      <Popover open={open} anchorEl={anchorEl} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} onClose={() => setAnchorEl(null)} onClick={(event) => event.stopPropagation()}>
        <Box sx={{ p: 1, maxWidth: 900 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Auction #{auction.auctionIndex} — {provider.name}
          </Typography>

          {/* What the verdict was read from, and what was found there */}
          {auction.evidence.length > 0 && (
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="body2">Found in this auction:</Typography>
              {auction.evidence.map((item) => {
                const detail = auction.evidenceDetail?.[item];
                return (
                  <Typography key={item} variant="body2" component="div" sx={{ ml: 1 }}>
                    <code>{detail ? detail.at : item}</code>
                    {detail?.value !== undefined && <span> = {previewValue(detail.value)}</span>}
                  </Typography>
                );
              })}
            </Box>
          )}

          {auctionEvent ? (
            <JSONViewerComponent src={auctionEvent} name={`auction #${auction.auctionIndex}`} collapsed={2} />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              The auctionEnd event for this auction is no longer in memory.
            </Typography>
          )}
        </Box>
      </Popover>
    </React.Fragment>
  );
};

/** Long objects make the line unreadable; the full value is in the JSON below. */
const previewValue = (value: unknown): string => {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  if (!text) return '';
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
};

const distinctHosts = (timing: IProviderTiming): string[] => Array.from(new Set(timing.requests.map(({ host }) => host)));

const ProviderRow = ({ provider, timing, harAvailable, findAuctionEvent }: { provider: IProviderDiagnostic; timing?: IProviderTiming; harAvailable: boolean; findAuctionEvent: (auctionId: string) => unknown }): JSX.Element => {
  const [open, setOpen] = useState(false);
  const lostRaces = timing?.races.filter(({ finishedAfterBidding }) => finishedAfterBidding) || [];

  return (
    <Grid size={{ xs: 12 }}>
      <Paper sx={{ p: 0.75, mb: 0.5, border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Box sx={{ cursor: 'pointer' }} onClick={() => setOpen(!open)}>
          {/* Who it is, and whether its data reached the auction */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <KeyboardArrowDownIcon fontSize="small" sx={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />

            <Typography variant="body1" sx={{ fontWeight: 700, minWidth: 150 }}>
              {provider.name}
            </Typography>

            <Chip label={provider.type === 'rtd' ? 'RTD' : 'ID'} size="small" variant="outlined" color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />

            <Tooltip title={provider.awaitedReason} arrow>
              <Chip label={provider.awaited ? 'awaited' : 'NOT awaited'} size="small" color={provider.awaited ? 'success' : 'error'} sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
            </Tooltip>

            {provider.auctions.map((auction) => (
              <AuctionVerdictChip key={auction.auctionIndex} provider={provider} auction={auction} auctionEvent={findAuctionEvent(auction.auctionId)} />
            ))}
          </Box>

          {/*
            How the network behaved - a separate question from whether the data landed, and the same
            split the help panel uses. Indented past the arrow so it lines up under the provider name.
            Absent entirely in the popup, which has no network data to show.
          */}
          {(harAvailable || timing) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5, ml: 3.5 }}>
              {timing && (
                <InfoTooltip title={<TooltipLines lines={[`${timing.requests.length} request${cP(timing.requests)}, slowest ${formatMs(timing.slowestMs)}.`, `Hosts: ${distinctHosts(timing).join(', ')}`, ATTRIBUTION_HELP[timing.via]]} />}>
                  <Chip
                    label={`${timing.requests.length} req · ${formatMs(timing.slowestMs)} slowest · ${ATTRIBUTION_LABEL[timing.via]}`}
                    size="small"
                    variant="outlined"
                    color={timing.via === 'host' ? 'default' : 'primary'}
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                </InfoTooltip>
              )}

              {/* An absent timing chip is ambiguous, so say which case it is */}
              {harAvailable && !timing && (
                <InfoTooltip
                  title={
                    <TooltipLines
                      lines={[
                        'No captured request could be attributed to this provider.',
                        provider.hosts.length > 0 ? `Known endpoints: ${provider.hosts.join(', ')}` : 'No endpoint is known for this provider — it may resolve from storage or a browser API rather than the network.',
                        'If it did call out, its request is in the unattributed list at the foot of the page.',
                      ]}
                    />
                  }
                >
                  <Chip label="no requests" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', color: 'text.secondary', borderStyle: 'dashed' }} />
                </InfoTooltip>
              )}

              {timing &&
                timing.races.map((race) => (
                  <InfoTooltip
                    key={race.auctionIndex}
                    title={
                      <TooltipLines
                        lines={[
                          `Auction #${race.auctionIndex}`,
                          !race.hasRequest
                            ? 'No request had been made by the time bidding started, so nothing of this provider could have been used.'
                            : race.finishedAfterBidding
                            ? `Still in flight ${formatMs(race.marginMs)} after the first bidder was called — too late to be used.`
                            : `Finished ${formatMs(Math.abs(race.marginMs))} before the first bidder was called — in time.`,
                          race.hasRequest && `Judged against the ${race.requestsBefore} request${race.requestsBefore === 1 ? '' : 's'} started before bidding began.`,
                        ]}
                      />
                    }
                  >
                    <Chip
                      label={!race.hasRequest ? `#${race.auctionIndex} no request` : race.finishedAfterBidding ? `#${race.auctionIndex} +${formatMs(race.marginMs)} late` : `#${race.auctionIndex} ${formatMs(Math.abs(race.marginMs))} early`}
                      size="small"
                      color={!race.hasRequest ? 'default' : race.finishedAfterBidding ? 'error' : 'success'}
                      variant={race.finishedAfterBidding ? 'filled' : 'outlined'}
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: race.finishedAfterBidding ? 700 : 400 }}
                    />
                  </InfoTooltip>
                ))}

              {lostRaces.length > 0 && <Chip label={`missed ${lostRaces.length}/${timing.races.length} auctions`} size="small" color="error" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />}
            </Box>
          )}
        </Box>

        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {provider.awaitedReason}
            </Typography>
            <JSONViewerComponent src={{ provider, networkTiming: timing || 'no network data' }} name={provider.name} collapsed={2} displayObjectSize={false} displayDataTypes={false} />
          </Box>
        </Collapse>
      </Paper>
    </Grid>
  );
};

const PreAuctionComponent = (): JSX.Element => {
  const { prebid, auctionEndEvents } = useContext(AppStateContext);
  const { harLog } = useContext(InspectedPageContext);
  const [query, setQuery] = useState('');
  const [showJson, setShowJson] = useState(false);

  // chrome.devtools only exists in the panel; the popup renders the verdicts without timings.
  const harSupported = Boolean((chrome as any)?.devtools?.network);

  const diagnostics = useMemo(() => getProviderDiagnostics(prebid, auctionEndEvents || []), [prebid, auctionEndEvents]);

  // Keyed by auctionId rather than position, so it stays correct if the event list is trimmed.
  const auctionEventsById = useMemo(() => new Map((auctionEndEvents || []).map((event: any) => [event?.args?.auctionId, event])), [auctionEndEvents]);
  const findAuctionEvent = useCallback((auctionId: string) => auctionEventsById.get(auctionId), [auctionEventsById]);
  const correlation = useMemo(() => correlateHar(diagnostics, harLog || []), [diagnostics, harLog]);

  // Lets you tell "this provider made no request" apart from "we failed to attribute its request"
  const unattributedHosts = useMemo(() => {
    const counts = new Map<string, number>();
    (correlation.unmatched || []).forEach(({ host }) => host && counts.set(host, (counts.get(host) || 0) + 1));
    return Array.from(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [correlation]);

  const suggestions = useMemo(() => buildSuggestions(diagnostics.providers), [diagnostics]);
  const filterFn = useMemo(() => providerQueryEngine.runQuery(query), [query]);
  const filtered = useMemo(() => diagnostics.providers.filter(filterFn), [diagnostics, filterFn]);

  if (diagnostics.providers.length === 0) {
    return (
      <Grid container sx={{ width: '100%' }}>
        <PreAuctionHelp />
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>No real time data or user id modules are configured on this page.</Paper>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <PreAuctionHelp />

      {/* Header Bar */}
      <Grid container size={{ xs: 12 }} sx={{ mb: 0.5 }}>
        <GridCell cols={2} variant="h2" sx={{ border: 0, whiteSpace: 'nowrap' }}>
          Provider{cP(diagnostics.providers)}: {diagnostics.providers.length}
        </GridCell>
        <GridCell cols={2.5} variant="h2" sx={{ border: 0, whiteSpace: 'nowrap' }}>
          Auction{cP(diagnostics.auctions)}: {diagnostics.auctions.length}
        </GridCell>
        <GridCell cols={2} variant="h2" sx={{ border: 0, whiteSpace: 'nowrap' }}>
          RTD delay: {diagnostics.rtdAuctionDelay}ms
        </GridCell>
        <GridCell cols={2} variant="h2" sx={{ border: 0, whiteSpace: 'nowrap' }}>
          ID delay: {diagnostics.userSyncAuctionDelay}ms
        </GridCell>

        <Grid size={{ xs: 2.5 }} sx={{ display: 'flex', alignItems: 'center', border: 0, '& .MuiInputBase-input': { paddingLeft: '4px !important', paddingTop: '4px !important' } }}>
          <AutoComplete fieldKeys={Object.keys(PROVIDER_FIELD_MAP) as string[]} options={suggestions} onPick={(opt) => setQuery((cur) => replaceLastToken(cur, opt))} onQueryChange={setQuery} placeholder="Filter providers..." query={query} />
        </Grid>

        <GridCell cols={0.5} sx={{ display: 'flex', alignItems: 'center', border: 0 }}>
          <Tooltip title={showJson ? 'Switch to the verdict view' : 'Switch to raw JSON view'} arrow>
            <IconButton size="small" onClick={() => setShowJson(!showJson)} color={showJson ? 'primary' : 'default'} sx={{ p: 0.5, fontSize: '1.05rem' }}>
              <CodeIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </GridCell>

        <GridCell cols={0.5} sx={{ display: 'flex', alignItems: 'center', border: 0 }}>
          <Tooltip title="Download the diagnostics as JSON" arrow>
            <IconButton size="small" onClick={() => download({ diagnostics, correlation }, 'pre-auction-diagnostics')} sx={{ p: 0.5, fontSize: '1.05rem' }}>
              <DownloadIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </GridCell>
      </Grid>

      {showJson ? (
        <Grid size={{ xs: 12 }}>
          <JSONViewerComponent src={{ diagnostics, correlation }} name="preAuction" collapsed={3} />
        </Grid>
      ) : (
        <React.Fragment>
          {!harSupported && (
            <Grid size={{ xs: 12 }} sx={{ mb: 0.5 }}>
              <Alert severity="info" sx={{ py: 0 }}>
                Verdicts below come from config and auction data and are complete. Per-provider network timings need the DevTools panel — open DevTools before loading the page.
              </Alert>
            </Grid>
          )}

          {harSupported && !correlation.available && (
            <Grid size={{ xs: 12 }} sx={{ mb: 0.5 }}>
              <Alert severity="info" sx={{ py: 0 }}>
                No requests captured yet. DevTools only sees traffic while it is open — reload the page with the panel open to get network timings.
              </Alert>
            </Grid>
          )}

          {filtered.map((provider) => (
            <ProviderRow key={`${provider.type}-${provider.name}`} provider={provider} timing={correlation.timings[provider.name]} harAvailable={correlation.available} findAuctionEvent={findAuctionEvent} />
          ))}

          {unattributedHosts.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 1, mt: 0.5 }} elevation={0}>
                <Typography variant="body2" color="text.secondary">
                  Requests not attributed to any configured provider ({correlation.unmatched.length} total, busiest hosts): {unattributedHosts.map(([host, count]) => `${host} (${count})`).join(', ')}
                </Typography>
              </Paper>
            </Grid>
          )}

          {diagnostics.unmatchedEidSources.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 1, mt: 0.5 }} elevation={0}>
                <Typography variant="body2" color="text.secondary">
                  EID sources not attributable to a configured module: {diagnostics.unmatchedEidSources.join(', ')}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* A write nobody claims means the generated map is out of date */}
          {diagnostics.unmatchedImpPaths.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 1, mt: 0.5 }} elevation={0}>
                <Typography variant="body2" color="text.secondary">
                  ortb2Imp writes not attributable to a configured provider: {diagnostics.unmatchedImpPaths.join(', ')}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Vendor-determined paths are discovered here */}
          {diagnostics.unmatchedOrtb2Paths.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 1, mt: 0.5 }} elevation={0}>
                <Typography variant="body2" color="text.secondary">
                  ortb2 writes not attributable to a configured provider: {diagnostics.unmatchedOrtb2Paths.join(', ')}
                </Typography>
              </Paper>
            </Grid>
          )}

          {diagnostics.segmentNames.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 1, mt: 0.5 }} elevation={0}>
                <Typography variant="body2" color="text.secondary">
                  ortb2 data segments seen: {diagnostics.segmentNames.join(', ')}
                </Typography>
              </Paper>
            </Grid>
          )}
        </React.Fragment>
      )}
    </Grid>
  );
};

export default PreAuctionComponent;
