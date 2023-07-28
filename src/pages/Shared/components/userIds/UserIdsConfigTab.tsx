import React, { useContext } from 'react';
import TabPanel from './TabPanel';
import JSONViewerComponent from '../JSONViewerComponent';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import AppStateContext from '../../contexts/appStateContext';

const GridPaperItem = ({ cols, value }: { cols: number; value: string | number | object }): JSX.Element => {
  if (typeof value === 'object' && Object.keys(value).length > 0) {
    return (
      <Grid item xs={cols}>
        <Paper sx={{ height: 1 }}>
          <JSONViewerComponent
            src={value}
            name={false}
            collapsed={2}
            displayObjectSize={false}
            displayDataTypes={false}
            sortKeys={false}
            quotesOnKeys={false}
            indentWidth={2}
            collapseStringsAfterLength={100}
            style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
          />
        </Paper>
      </Grid>
    );
  }
  return (
    <Grid item xs={cols}>
      <Paper sx={{ height: 1 }}>
        <Typography variant="body1" sx={{ whiteSpace: 'normal', wordBreak: 'break-word', p: 0.5 }}>
          <strong>{value}</strong>
        </Typography>
      </Paper>
    </Grid>
  );
};

const ConfigTab = (): JSX.Element => {
  const { prebid } = useContext(AppStateContext);

  return (
    prebid.config?.userSync?.userIds &&
    prebid.config?.userSync?.userIds[0] && (
      <React.Fragment>
        <Grid item xs={3}>
          <TabPanel value={1} index={1}>
            Name
          </TabPanel>
        </Grid>
        <Grid item xs={2}>
          <TabPanel value={1} index={1}>
            Storage Type
          </TabPanel>
        </Grid>
        <Grid item xs={2}>
          <TabPanel value={1} index={1}>
            Storage Expires
          </TabPanel>
        </Grid>
        <Grid item xs={2}>
          <TabPanel value={1} index={1}>
            Storage Name
          </TabPanel>
        </Grid>
        <Grid item xs={3}>
          <TabPanel value={1} index={1}>
            Params
          </TabPanel>
        </Grid>
        {prebid.config?.userSync?.userIds?.map((userId, index) => (
          <React.Fragment key={index}>
            <GridPaperItem cols={3} value={userId.name} />
            <GridPaperItem cols={2} value={userId.storage?.type} />
            <GridPaperItem cols={2} value={userId.storage?.expires} />
            <GridPaperItem cols={2} value={userId.storage?.name} />
            <GridPaperItem cols={3} value={userId.params} />
          </React.Fragment>
        ))}
      </React.Fragment>
    )
  );
};

export default ConfigTab;
