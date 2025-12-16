import { useContext, useDeferredValue, useMemo, useState } from 'react';
import StateContext from '../../contexts/appStateContext';
import { IPrebidEvent } from '../../../Injected/prebid';
import { createQueryEngine, distinct } from '../autocomplete/utils';

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

const eventsQueryEngine = createQueryEngine<any>(EVENT_FIELD_MAP);

const buildEventSuggestions = (events: any[]): string[] => {
  const suggestions = new Set<string>();
  (Object.keys(EVENT_FIELD_MAP) as string[]).forEach((key) => suggestions.add(`${key}:`));

  for (const e of events) {
    if (e?.eventType) {
      suggestions.add(`eventtype:${String(e.eventType)}`);
    }
    if (e?.args?.type) {
      suggestions.add(`argstype:${String(e.args.type)}`);
    }
    if (e?.args?.arguments) {
      suggestions.add(`argsmessage:${Object.values(e.args.arguments).join(' ')}`);
    }
  }

  return Array.from(suggestions).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
};

const sortEvents = (events: IPrebidEvent[]) => [...events].sort((a, b) => a.elapsedTime - b.elapsedTime);

const EventsState = () => {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const isPending = query !== deferredQuery;

  const { prebid } = useContext(StateContext);
  const events = prebid.events as IPrebidEvent[];

  const warningEvents = useMemo(() => events?.filter(({ eventType, args: { type } }) => eventType === 'auctionDebug' && type === 'WARNING'), [events]);
  const errorEvents = useMemo(() => events?.filter(({ eventType, args: { type } }) => eventType === 'auctionDebug' && type === 'ERROR'), [events]);

  const counts = useMemo(
    () => ({
      all: events?.length ?? 0,
      warning: warningEvents?.length ?? 0,
      error: errorEvents?.length ?? 0,
    }),
    [events, warningEvents, errorEvents]
  );

  const suggestions = useMemo(() => buildEventSuggestions(events as any[]), [events]);

  const filteredEvents = useMemo(() => events.filter(eventsQueryEngine.runQuery(deferredQuery)), [events, deferredQuery]);

  const sortedEvents = useMemo(() => sortEvents(filteredEvents as IPrebidEvent[]), [filteredEvents]);

  return {
    query,
    setQuery,
    isPending,
    events,
    warningEvents,
    errorEvents,
    counts,
    suggestions,
    filteredEvents,
    sortedEvents,
    EVENT_FIELD_MAP,
  };
};

export default EventsState;
