import React from 'react';
import Grid from '@mui/material/Grid';
import PbjsVersionInfoContent from './PbjsVersionInfoContent';
import { Paper } from '@mui/material';
const PbjsVersionInfoComponent = ({ close }: PbjsVersionInfoComponentProps): JSX.Element => {
  return (
    <Grid container>
      <Grid size={{ xs: 12 }}>
        <Paper>
          <Grid container>
            <PbjsVersionInfoContent close={close}></PbjsVersionInfoContent>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};
interface PbjsVersionInfoComponentProps {
  close?: () => void;
}

export default PbjsVersionInfoComponent;
