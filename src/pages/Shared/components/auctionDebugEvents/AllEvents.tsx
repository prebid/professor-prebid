import React, { useEffect, useContext } from 'react';
import Typography from '@mui/material/Typography';
import StateContext from '../../contexts/appStateContext';
import { IEventsHeaderState } from './EventsHeader';
import JSONViewerComponent from '../JSONViewerComponent';
import { BoxWithLabel } from '../BoxWithLabel';
import Grid from '@mui/material/Grid';

const filterEventsBySearch = (events: { args: any; elapsedTime: number }[], search: string) => {
  if (!search || search === '') return events;
  let filteredEvents = events;
  console.time(`filterEventsBySearch_${search}`);
  filteredEvents = events.filter((event) => JSON.stringify(event).toLowerCase()?.includes(search.toLowerCase()));
  console.timeEnd(`filterEventsBySearch_${search}`);
  return filteredEvents;
};

const filterEventsByState = (events: { args: any; elapsedTime: number }[], state: IEventsHeaderState) => {
  if (state.all) return events;
  const selectedKeys = Object.keys(state).filter((key) => state[key as keyof IEventsHeaderState]);
  return events.filter((event) => selectedKeys?.includes(event.args.type.toLowerCase()));
};

const sortEventsByElapsedTime = (events: { args: any; elapsedTime: number }[]) => {
  return events.sort((e1, e2) => e1.elapsedTime - e2.elapsedTime);
};

const AllEvents = ({ state, search }: IEventsMessagesProps): JSX.Element => {
  const { prebid } = useContext(StateContext);
  const { events } = prebid;
  const [messages, setMessages] = React.useState<any[]>([]);

  useEffect(() => {
    const searchedEvents = filterEventsBySearch(state.all ? events : events, search);
    const stateFilteredEvents = filterEventsByState(searchedEvents, state);
    const sortedEvents = sortEventsByElapsedTime(stateFilteredEvents);
    setMessages(sortedEvents);
  }, [events, search, state]);

  if (events.length === 0)
    return (
      <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
        No events found
      </Typography>
    );
  return (
    <Grid item xs={12}>
      <BoxWithLabel
        label={
          <Typography variant="body2" color="text.secondary">
            {messages.length} event{messages.length === 1 ? '' : 's'} found
          </Typography>
        }
      >
        <JSONViewerComponent src={messages} />
      </BoxWithLabel>
    </Grid>
  );
};

interface IEventsMessagesProps {
  pbjsNamespace?: string;
  state: IEventsHeaderState;
  search: string;
}

export default AllEvents;
