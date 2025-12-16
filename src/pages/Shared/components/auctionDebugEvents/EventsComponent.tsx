import React from 'react';
import EventsState from './EventsState';
import Grid from '@mui/material/Grid';
import { CircularProgress, IconButton, Paper, Tooltip } from '@mui/material';
import { GridCell } from '../bids/BidsComponent';
import JSONViewerComponent from '../JSONViewerComponent';
import { AutoComplete } from '../autocomplete/AutoComplete';
import { replaceLastToken } from '../autocomplete/utils';
import DownloadIcon from '@mui/icons-material/Download';
import { download } from '../../utils';
import { conditionalPluralization as cP } from '../../utils';

const EventsComponent = (): JSX.Element => {
  const { query, setQuery, isPending, events, warningEvents, errorEvents, counts, suggestions, sortedEvents, EVENT_FIELD_MAP } = EventsState();

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
          cursor: 'pointer',
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
      {isPending ? (
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <CircularProgress />
          </Paper>
        </Grid>
      ) : !sortedEvents || sortedEvents.length === 0 ? (
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>No matching bids</Paper>
        </Grid>
      ) : (
        <GridCell variant="body2" cols={12} sx={{ '& .MuiTypography-root': { width: '100%', textAlign: 'left' } }}>
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
