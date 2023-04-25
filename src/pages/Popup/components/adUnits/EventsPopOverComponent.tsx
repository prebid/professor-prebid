import React, { useEffect } from 'react';
import { IPrebidAuctionDebugEventData } from '../../../Content/scripts/prebid';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import IconButton from '@mui/material/IconButton';
import Close from '@mui/icons-material/Close';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

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

const EventsPopOverComponent = ({ errors, warnings, close }: IEventsPopOverComponentProps): JSX.Element => {
  const [search, setSearch] = React.useState('');
  const [messages, setMessages] = React.useState<any[]>([]);
  const [state, setState] = React.useState({ error: true, warning: true });
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value.trim());
  };

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setState({
      ...state,
      [event.target.name]: event.target.checked,
    });
  };

  useEffect(() => {
    setMessages(
      [...errors, ...warnings]
        .filter((event) => (search === '' ? true : args2string(event.args.arguments).toLowerCase().includes(search.toLowerCase())))
        .filter((event) =>
          Object.keys(state)
            .filter((key) => state[key as keyof { error: boolean; warning: boolean }])
            .includes(event.args.type.toLocaleLowerCase())
        )
        .sort((e1, e2) => e1.elapsedTime - e2.elapsedTime)
        .reduce((previousValue, currentValue, index, arr) => {
          if (args2string(previousValue.at(-1)?.arguments) === args2string(currentValue.args.arguments)) {
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
        }, [] as { type: string; arguments: any; elapsedTime: number; count: number }[])
    );
  }, [errors, search, state, warnings]);

  return (
    <Box sx={{ p: 0.5 }}>
      <Grid container spacing={1}>
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
          <Typography sx={{ pl: 1 }}>{messages.length} messages</Typography>
          <IconButton sx={{ p: 0 }} onClick={() => close()}>
            <Close sx={{ fontSize: 14 }} />
          </IconButton>
        </Grid>
        <Grid item xs={9.5}>
          <TextField
            color="primary"
            focused
            fullWidth={true}
            margin="dense"
            size="small"
            value={search}
            onChange={handleSearchChange}
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
          xs={2.5}
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
                control={<Switch checked={state.warning} onChange={handleSwitchChange} name="warning" size="small" />}
                label={<WarningAmberOutlinedIcon color={state.warning ? 'primary' : 'secondary'} fontSize="small" />}
              />
              <FormControlLabel
                labelPlacement="start"
                control={<Switch checked={state.error} onChange={handleSwitchChange} name="error" size="small" />}
                label={<ErrorOutlineIcon color={state.error ? 'primary' : 'secondary'} fontSize="small" />}
              />
            </FormGroup>
          </FormControl>
        </Grid>
        {messages[0] &&
          messages.map((event, index, arr) => (
            <React.Fragment key={index}>
              <Grid item xs={0.5}>
                {event.type === 'ERROR' && <ErrorOutlineIcon color="error" sx={{ fontSize: 14, pl: 2 }} />}
                {event.type === 'WARNING' && <WarningAmberOutlinedIcon color="warning" sx={{ fontSize: 14, pl: 2 }} />}
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
        {!messages[0] && (
          <Grid item xs={12}>
            <Typography sx={{ p: 0.5 }}>no messages found</Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
interface IEventsPopOverComponentProps {
  errors: IPrebidAuctionDebugEventData[];
  warnings: IPrebidAuctionDebugEventData[];
  close: Function;
}

export default EventsPopOverComponent;
