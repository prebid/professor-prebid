import React from 'react';
import Grid from '@mui/material/Grid';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import IconButton from '@mui/material/IconButton';
import Close from '@mui/icons-material/Close';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, setSearch: (newVal: string) => void): void => {
  setSearch(event.target.value.trim());
};

const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>, state: IEventsHeaderState, setState: (newVal: IEventsHeaderState) => void): void => {
  if (event.target.name !== 'all') {
    setState({ ...state, [event.target.name]: event.target.checked });
  }
  if (event.target.name === 'all') {
    // If the "all" switch is checked, uncheck the other switches
    setState(event.target.checked ? { ...state, error: false, warning: false, all: event.target.checked } : { ...state, error: true, warning: true, all: event.target.checked });
  }
};

const EventsHeader = ({ close, search, setSearch, state, setState }: IEventsHeaderProps): JSX.Element => {
  return (
    <React.Fragment>
      {close && (
        <Grid
          item
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            color: 'text.secondary',
          }}
          xs={12}
        >
          <IconButton sx={{ p: 0 }} onClick={() => close()}>
            <Close sx={{ fontSize: 14 }} />
          </IconButton>
        </Grid>
      )}

      <Grid item xs={8.5}>
        <TextField
          color="primary"
          focused
          fullWidth={true}
          margin="dense"
          size="small"
          value={search}
          onChange={(event) => handleSearchChange(event, setSearch)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FilterListOutlinedIcon color="secondary" />
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      <Grid
        item
        xs={3.5}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          color: 'text.secondary',
        }}
      >
        <FormControl component="fieldset">
          <FormGroup sx={{ flexDirection: 'row' }}>
            <FormControlLabel
              labelPlacement="start"
              control={<Switch disabled={state.all} checked={state.warning} onChange={(event) => handleSwitchChange(event, state, setState)} name="warning" size="small" />}
              label={<WarningAmberOutlinedIcon color={state.warning ? 'primary' : 'secondary'} fontSize="small" />}
            />
            <FormControlLabel
              labelPlacement="start"
              control={<Switch disabled={state.all} checked={state.error} onChange={(event) => handleSwitchChange(event, state, setState)} name="error" size="small" />}
              label={<ErrorOutlineIcon color={state.error ? 'primary' : 'secondary'} fontSize="small" />}
            />
            <FormControlLabel
              labelPlacement="start"
              control={<Switch checked={state.all} onChange={(event) => handleSwitchChange(event, state, setState)} name="all" size="small" />}
              label={<PublicOutlinedIcon  color={state.all ? 'primary' : 'secondary'} fontSize="small" />}
            />
          </FormGroup>
        </FormControl>
      </Grid>
    </React.Fragment>
  );
};

type IEventFilter = 'error' | 'warning' | 'all';

export type IEventsHeaderState = Record<IEventFilter, boolean>;

interface IEventsHeaderProps {
  close?: () => void;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  state: IEventsHeaderState;
  setState: React.Dispatch<React.SetStateAction<IEventsHeaderState>>;
}

export default EventsHeader;
