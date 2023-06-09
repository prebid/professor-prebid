/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useContext } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import InspectedPageContext from '../contexts/inspectedPageContext';
import JSONViewerComponent from './JSONViewerComponent';

const NoPrebidCardComponent = (): JSX.Element => {
  const context = useContext(InspectedPageContext);
  const { syncState } = context;
  return (
    <Card onClick={() => chrome.tabs.reload(chrome.devtools.inspectedWindow.tabId)}>
      <CardContent sx={{ backgroundColor: 'primary.light' }}>
        <Grid container justifyContent="center">
          <Grid item>
            <Paper elevation={4} sx={{ p: 2 }}>
              {syncState === '' ? (
                <Typography variant="h2">No Prebid.js detected on this page. Try to scroll down or click here to refresh the page.</Typography>
              ) : (
                <Typography variant="h2">syncState: {syncState}</Typography>
              )}
              {false && <JSONViewerComponent src={context || { context: JSON.stringify(context) }} collapsed={5} />}
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default NoPrebidCardComponent;
