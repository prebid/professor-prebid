import React, { useContext, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import { IconButton, Paper, Tooltip } from '@mui/material';
import { GridCell } from '../bids/BidsComponent';
import JSONViewerComponent from '../JSONViewerComponent';
import StateContext from '../../contexts/appStateContext';
import { AutoComplete } from '../autocomplete/AutoComplete';
import { createQueryEngine, distinct, replaceLastToken } from '../autocomplete/utils';
import { IPrebidEvent } from '../../../Injected/prebid';
import DownloadIcon from '@mui/icons-material/Download';
import { download } from '../../utils';
import { conditionalPluralization as cP } from '../../utils';

const EVENT_FIELD_MAP = {
  eventtype: (e: any) => e?.eventType,
  elapsedtime: (e: any) => parseInt(e?.elapsedTime),
  argstype: (e: any) => e?.args?.type,
  argsarguments: (e: any) => e?.args?.arguments,
  argsmessage: (e: any) => {
    if (!e?.args?.arguments) return '';
    return Object.values(e.args.arguments).join(' ');
  },
} as const;

const buildEventSuggestions = (events: any[]): string[] => {
  const keySuggestions = (Object.keys(EVENT_FIELD_MAP) as string[]).map((key) => `${key}:`);

  const eventTypes = distinct(events.map((e) => (e?.eventType ? `eventtype:${String(e.eventType)}` : undefined)));

  const argTypes = distinct(events.map((e) => (e?.args?.type ? `argstype:${String(e.args.type)}` : undefined)));

  const messages = distinct(events.map((e) => (e?.args?.arguments ? `argsmessage:${Object.values(e.args.arguments).join(' ')}` : undefined)));

  return Array.from(new Set<string>([...keySuggestions, ...eventTypes, ...argTypes, ...messages])).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
};

const eventsQueryEngine = createQueryEngine<any>(EVENT_FIELD_MAP);

const sortEvents = (events: IPrebidEvent[]) => [...events].sort((a, b) => a.elapsedTime - b.elapsedTime);

const EventsComponent = (): JSX.Element => {
  const [query, setQuery] = useState('');
  const { prebid } = useContext(StateContext);
  const events = prebid.events as IPrebidEvent[];

  const warningEvents = events?.filter(({ eventType, args: { type } }) => eventType === 'auctionDebug' && type === 'WARNING');
  const errorEvents = events?.filter(({ eventType, args: { type } }) => eventType === 'auctionDebug' && type === 'ERROR');
  const counts = {
    all: events?.length ?? 0,
    warning: warningEvents.length ?? 0,
    error: errorEvents.length ?? 0,
  };

  const suggestions = useMemo(() => buildEventSuggestions(events as any[]), [events]);

  const filteredEvents = useMemo(() => events.filter(eventsQueryEngine.runQuery(query)), [events, query]);

  const sortedEvents = useMemo(() => sortEvents(filteredEvents as IPrebidEvent[]), [filteredEvents]);

  return (
    <Grid container sx={{ width: '100%' }}>
      <GridCell
        cols={1.5}
        variant="h2"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          color: 'text.secondary',
          border: 0,
        }}
        onClick={() => setQuery('')}
      >
        Event{cP(events)}: {events?.length}
      </GridCell>
      <GridCell
        cols={1.5}
        variant="h2"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          color: 'text.secondary',
          border: 0,
          cursor: 'pointer',
        }}
        onClick={() => setQuery('eventtype:auctionDebug argstype:WARNING')}
      >
        Warning{cP(warningEvents)}: {counts.warning}
      </GridCell>
      <GridCell
        cols={1.5}
        variant="h2"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          color: 'text.secondary',
          border: 0,
          cursor: 'pointer',
        }}
        onClick={() => setQuery('eventtype:auctionDebug argstype:ERROR')}
      >
        Error{cP(errorEvents)}: {counts.error}
      </GridCell>

      <Grid size={{ xs: 7 }} sx={{ display: 'flex', alignItems: 'center', border: 0, '& .MuiInputBase-input': { paddingLeft: '4px !important', paddingTop: '4px !important' } }}>
        <AutoComplete fieldKeys={Object.keys(EVENT_FIELD_MAP) as string[]} options={suggestions} onPick={(opt) => setQuery((cur) => replaceLastToken(cur, opt))} onQueryChange={setQuery} placeholder="Filter events..." query={query} />
      </Grid>
      <GridCell cols={0.5} sx={{ display: 'flex', alignItems: 'center', border: 0 }}>
        <Tooltip title="Download filtered events as JSON" arrow>
          <IconButton size="small" onClick={() => download(sortedEvents, 'filtered-events')} sx={{ p: 0.5, fontSize: '1.05rem', height: 'auto' }}>
            <DownloadIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </GridCell>
      {!sortedEvents || sortedEvents.length === 0 ? (
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>No matching bids</Paper>
        </Grid>
      ) : (
        <GridCell variant="body2" cols={12} sx={{ '& .MuiTypography-root': { width: '100%' } }}>
          <JSONViewerComponent
            name={`${sortedEvents.length} Event${cP(sortedEvents)} `}
            src={sortedEvents}
            collapsed={4}
            displayObjectSize={false}
            displayDataTypes={false}
            sortKeys={false}
            quotesOnKeys={false}
            indentWidth={2}
            collapseStringsAfterLength={100}
            style={{ fontSize: '12px', fontFamily: 'roboto' }}
          />
        </GridCell>
      )}
    </Grid>
  );
};

export default EventsComponent;
