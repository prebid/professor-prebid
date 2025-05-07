import React, { useContext } from 'react';
import EventsMessages from './EventsMessages';
import Grid from '@mui/material/Grid';
import EventsHeader from './EventsHeader';
import AppStateContext from '../../contexts/appStateContext';
import { Paper } from '@mui/material';
import AllEvents from './AllEvents';
const EventsComponent = ({ close }: IEventsComponentProps): JSX.Element => {
  const { pbjsNamespace } = useContext(AppStateContext);
  const [search, setSearch] = React.useState('');
  const [state, setState] = React.useState({ error: true, warning: true, all: false });

  return (
    <Grid container spacing={1} sx={{ p: 0.5 }}>
      <Grid item xs={12}>
        <Paper>
          <Grid container spacing={1} sx={{ p: 0.5 }}>
            <EventsHeader search={search} setSearch={setSearch} state={state} setState={setState} close={close}></EventsHeader>
            {state.all && <AllEvents pbjsNamespace={pbjsNamespace} state={state} search={search}></AllEvents>}
            {!state.all && <EventsMessages pbjsNamespace={pbjsNamespace} state={state} search={search}></EventsMessages>}
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};
interface IEventsComponentProps {
  close?: () => void;
}

export default EventsComponent;
