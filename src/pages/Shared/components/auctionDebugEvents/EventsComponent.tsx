import React, { useState } from 'react';
import EventsState from './EventsState';
import Grid from '@mui/material/Grid';
import { CircularProgress, IconButton, Paper, Tooltip, Chip, Typography, Box, Collapse, Card } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { GridCell } from '../bids/BidsComponent';
import JSONViewerComponent from '../JSONViewerComponent';
import { AutoComplete } from '../autocomplete/AutoComplete';
import { replaceLastToken } from '../autocomplete/utils';
import { download, conditionalPluralization as cP } from '../../utils';
import { IPrebidEvent } from '../../../Injected/prebid';

const EventRowComponent = ({ event, index }: { event: IPrebidEvent; index: number }): JSX.Element => {
  const [expanded, setExpanded] = useState(false);

  const { eventType, elapsedTime, args } = event;
  const argsType = args?.type;

  let chipColor: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default' = 'default';
  let chipLabel = eventType || 'event';

  if (eventType === 'auctionDebug') {
    if (argsType === 'WARNING') {
      chipColor = 'warning';
      chipLabel = 'WARNING';
    } else if (argsType === 'ERROR') {
      chipColor = 'error';
      chipLabel = 'ERROR';
    } else {
      chipColor = 'info';
      chipLabel = 'DEBUG';
    }
  } else if (eventType === 'auctionInit' || eventType === 'auctionEnd') {
    chipColor = 'primary';
  } else if (eventType === 'bidWon' || eventType === 'adRenderSucceeded') {
    chipColor = 'success';
  } else if (eventType === 'bidRequested' || eventType === 'bidResponse') {
    chipColor = 'info';
  }

  let summaryText = '';
  if (eventType === 'auctionDebug') {
    summaryText = args?.arguments ? Object.values(args.arguments).join(' ') : String(args?.message || argsType || '');
  } else if (eventType === 'bidResponse' || eventType === 'bidWon') {
    const bidder = args?.bidderCode || args?.bidder || '';
    const cpm = args?.cpm !== undefined ? `$${args.cpm}` : '';
    const unit = args?.adUnitCode || '';
    summaryText = [bidder, cpm, unit].filter(Boolean).join(' — ');
  } else if (eventType === 'bidRequested') {
    const bidder = args?.bidderCode || args?.bidder || '';
    const count = args?.bids?.length;
    summaryText = `${bidder ? `[${bidder}] ` : ''}${count ? `${count} bid(s) requested` : ''}`;
  } else if (eventType === 'auctionInit') {
    const id = args?.auctionId ? `#${String(args.auctionId).slice(0, 8)}` : '';
    const count = args?.adUnitCodes?.length;
    summaryText = `Auction ${id} ${count ? `(${count} ad unit(s))` : ''}`;
  } else if (args && typeof args === 'object') {
    const keys = Object.keys(args).filter((k) => typeof args[k] !== 'function');
    summaryText = keys
      .slice(0, 4)
      .map((k) => `${k}: ${typeof args[k] === 'object' ? '{...}' : String(args[k])}`)
      .join(', ');
  }

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: expanded ? 'primary.main' : 'divider',
        borderRadius: 1,
        mb: 0.5,
        transition: 'border-color 0.2s',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 0.75,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
          gap: 1,
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Timestamp */}
        <Chip label={`+${elapsedTime || 0}ms`} size="small" sx={{ bgcolor: 'grey.200', color: 'text.primary', fontWeight: 600, height: 20, fontSize: '0.68rem', borderRadius: '4px' }} />

        {/* Event Type Chip */}
        <Chip label={chipLabel} size="small" color={chipColor} sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600, textTransform: 'none' }} />

        {/* Summary Text */}
        <Typography
          variant="body2"
          sx={{
            flexGrow: 1,
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: 'text.primary',
          }}
        >
          {summaryText || `Event #${index + 1}`}
        </Typography>

        {/* Expand Chevron */}
        <IconButton size="small" sx={{ p: 0.25 }}>
          <ExpandMoreIcon
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              fontSize: '1.1rem',
            }}
          />
        </IconButton>
      </Box>

      {/* Expanded Details */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <JSONViewerComponent name={`event[${index}]`} src={event} collapsed={2} />
        </Box>
      </Collapse>
    </Card>
  );
};

const EventsComponent = (): JSX.Element => {
  const { query, setQuery, isPending, events, warningEvents, errorEvents, counts, suggestions, sortedEvents, EVENT_FIELD_MAP } = EventsState();
  const [showJson, setShowJson] = useState(false);

  return (
    <Grid container sx={{ width: '100%' }}>
      {/* Counts Header */}
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
        Event{cP(events)}: {events?.length || 0}
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

      {/* Search Bar */}
      <Grid size={{ xs: 6.5 }} sx={{ display: 'flex', alignItems: 'center', border: 0, '& .MuiInputBase-input': { paddingLeft: '4px !important', paddingTop: '4px !important' } }}>
        <AutoComplete fieldKeys={Object.keys(EVENT_FIELD_MAP) as string[]} options={suggestions} onPick={(opt) => setQuery((cur) => replaceLastToken(cur, opt))} onQueryChange={setQuery} placeholder="Filter events..." query={query} />
      </Grid>

      {/* JSON Toggle Icon */}
      <GridCell cols={0.5} sx={{ display: 'flex', alignItems: 'center', border: 0 }}>
        <Tooltip title={showJson ? 'Switch to Event Stream view' : 'Switch to raw JSON view'} arrow>
          <IconButton size="small" onClick={() => setShowJson(!showJson)} color={showJson ? 'primary' : 'default'} sx={{ p: 0.5, fontSize: '1.05rem', height: 'auto' }}>
            <CodeIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </GridCell>

      {/* Download Icon */}
      <GridCell cols={0.5} sx={{ display: 'flex', alignItems: 'center', border: 0 }}>
        <Tooltip title="Download filtered events as JSON" arrow>
          <IconButton size="small" onClick={() => download(sortedEvents, 'filtered-events')} sx={{ p: 0.5, fontSize: '1.05rem', height: 'auto' }}>
            <DownloadIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </GridCell>

      {/* Content Stream or JSON */}
      {isPending ? (
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <CircularProgress />
          </Paper>
        </Grid>
      ) : !sortedEvents || sortedEvents.length === 0 ? (
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 2, textAlign: 'center', mt: 0.5 }}>No matching events</Paper>
        </Grid>
      ) : showJson ? (
        <GridCell variant="body2" cols={12} sx={{ '& .MuiTypography-root': { width: '100%', textAlign: 'left' }, mt: 0.5 }}>
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
      ) : (
        <Grid size={{ xs: 12 }} sx={{ mt: 0.5 }}>
          {sortedEvents.map((event, index) => (
            <EventRowComponent key={`${event.eventType}-${event.elapsedTime}-${index}`} event={event} index={index} />
          ))}
        </Grid>
      )}
    </Grid>
  );
};

export default EventsComponent;
