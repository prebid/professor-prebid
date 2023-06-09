import React, { useContext } from 'react';
import EventsMessages from './EventsMessages';
import Grid from '@mui/material/Grid';
import EventsHeader from './EventsHeader';
import AppStateContext from '../../contexts/appStateContext';
const EventsComponent = ({ close }: IEventsComponentProps): JSX.Element => {
  const { pbjsNamespace } = useContext(AppStateContext);
  const [search, setSearch] = React.useState('');
  const [state, setState] = React.useState({ error: true, warning: true });

  return (
    <Grid container sx={{ backgroundColor: 'background.paper' }}>
      <EventsHeader search={search} setSearch={setSearch} state={state} setState={setState} close={close}></EventsHeader>
      <EventsMessages pbjsNamespace={pbjsNamespace} state={state} search={search}></EventsMessages>
    </Grid>
  );
};
interface IEventsComponentProps {
  close?: () => void;
}

export default EventsComponent;
