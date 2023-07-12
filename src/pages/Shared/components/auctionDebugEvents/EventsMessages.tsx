import React, { useEffect, useContext } from 'react';
import { IPrebidAuctionDebugEventData } from '../../../Content/scripts/prebid';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import Typography from '@mui/material/Typography';
import StateContext from '../../contexts/appStateContext';

const args2string = (input: any): string => {
  if (!input) return `undefined`;
  return `${Object.values(input).join(' ')}${['.', '?', '!', ';', ':'].includes(Object.values(input).join(' ').slice(-1)) ? '' : '.'}`;
};

const Args2Typo = ({ input }: any): JSX.Element => {
  return (
    <React.Fragment>
      {Object.values(input).map((value, index, arr) => {
        return (
          <React.Fragment key={index}>
            <Typography component={'span'}>{typeof value === 'object' ? JSON.stringify(value) : value}</Typography>
            {index + 1 < arr.length && <Typography component={'span'}> </Typography>}
            {index + 1 === arr.length && (
              <Typography component={'span'}>
                {['.', '?', '!', ';', ':'].includes(Object.values(input).join(' ').trim().slice(-1)) ? '' : '.'}
              </Typography>
            )}
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
};

const filterEventsBySearch = (events: { args: any; elapsedTime: number }[], search: string) => {
  return events.filter((event) => args2string(event.args.arguments).toLowerCase()?.includes(search.toLowerCase()));
};

const filterEventsByState = (events: { args: any; elapsedTime: number }[], state: { error: boolean; warning: boolean }) => {
  const selectedKeys = Object.keys(state).filter((key) => state[key as keyof { error: boolean; warning: boolean }]);
  return events.filter((event) => selectedKeys?.includes(event.args.type.toLowerCase()));
};

const sortEventsByElapsedTime = (events: { args: any; elapsedTime: number }[]) => {
  return events.sort((e1, e2) => e1.elapsedTime - e2.elapsedTime);
};

const reduceEventsByArguments = (events: { args: any; elapsedTime: number }[]) => {
  return events.reduce((previousValue, currentValue) => {
    const previousArgs = args2string(previousValue.at(-1)?.arguments);
    const currentArgs = args2string(currentValue.args.arguments);
    if (previousArgs === currentArgs) {
      previousValue.at(-1).count += 1;
    } else {
      previousValue.push({
        type: currentValue.args.type,
        arguments: currentValue.args.arguments,
        elapsedTime: currentValue.elapsedTime,
        count: 1,
      });
    }
    return previousValue;
  }, [] as { type: string; arguments: any; elapsedTime: number; count: number }[]);
};

const getEventIcon = (type: string) => {
  if (type === 'ERROR') {
    return <ErrorOutlineIcon color="error" sx={{ fontSize: 14, pl: 2 }} />;
  } else if (type === 'WARNING') {
    return <WarningAmberOutlinedIcon color="warning" sx={{ fontSize: 14, pl: 2 }} />;
  }
  return null;
};

const EventsMessages = ({ state, search }: IEventsMessagesProps): JSX.Element => {
  const { prebid } = useContext(StateContext);
  const { events } = prebid;
  const [messages, setMessages] = React.useState<any[]>([]);

  useEffect(() => {
    const filteredEvents = ((events || []) as IPrebidAuctionDebugEventData[])
      .filter(({ eventType }) => eventType === 'auctionDebug')
      .map(({ args, elapsedTime }: IPrebidAuctionDebugEventData) => ({ args, elapsedTime }));
    const searchedEvents = filterEventsBySearch(filteredEvents, search);
    const stateFilteredEvents = filterEventsByState(searchedEvents, state);
    const sortedEvents = sortEventsByElapsedTime(stateFilteredEvents);
    const reducedEvents = reduceEventsByArguments(sortedEvents);
    setMessages(reducedEvents);
  }, [events, search, state]);

  return (
    <>
      {messages.length > 0 &&
        messages.map((event, index, arr) => (
          <React.Fragment key={index}>
            <Grid item xs={0.5}>
              {getEventIcon(event.type)}
            </Grid>
            <Grid item>
              <Typography>{Math.round(event.elapsedTime)} ms:</Typography>
            </Grid>
            <Grid item xs={10}>
              <Args2Typo input={event.arguments}></Args2Typo>
            </Grid>
            {index + 1 < arr.length && (
              <Grid item xs={12}>
                <Divider></Divider>
              </Grid>
            )}
          </React.Fragment>
        ))}
      {messages.length === 0 && (
        <Grid item xs={12}>
          <Typography sx={{ p: 0.5 }}>no messages found</Typography>
        </Grid>
      )}
    </>
  );
};
interface IEventsMessagesProps {
  pbjsNamespace?: string;
  state: { error: boolean; warning: boolean };
  search: string;
}

export default EventsMessages;
