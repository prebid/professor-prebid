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

const UserIdsTab = (): JSX.Element => {
  const { prebid } = useContext(AppStateContext);

  return (
    <React.Fragment>
      <Grid item xs={4}>
        <TabPanel value={0} index={0}>
          Source
        </TabPanel>
      </Grid>
      <Grid item xs={4}>
        <TabPanel value={0} index={0}>
          User ID
        </TabPanel>
      </Grid>
      <Grid item xs={4}>
        <TabPanel value={0} index={0}>
          Atype
        </TabPanel>
      </Grid>

      {prebid.eids?.map((eid, i) => {
        return eid.uids.map((uid, index) => {
          return (
            <React.Fragment key={`${i}:${index}`}>
              <GridPaperItem cols={4} value={eid.source} />
              <GridPaperItem cols={4} value={uid.id} />
              <GridPaperItem cols={4} value={uid.atype} />
            </React.Fragment>
          );
        });
      })}
    </React.Fragment>
  );
};

export default UserIdsTab;
