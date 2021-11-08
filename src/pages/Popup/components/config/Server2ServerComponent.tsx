import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { IPrebidDetails } from "../../../../inject/scripts/prebid";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

const Server2ServerComponent = ({ prebid }: Server2ServerComponentProps): JSX.Element => {
  return (
    <Box sx={{ width: '100%', padding: '5px 5px 5px 25px' }}>
      {prebid.config.s2sConfig?.accountId && <Typography><strong>Account Id:</strong> {prebid?.config?.s2sConfig?.accountId}</Typography>}
      {prebid.config.s2sConfig?.app &&
        <List dense={true}>
          <Typography><strong>App</strong> </Typography>
          {Object.keys(prebid.config.s2sConfig?.app).map(key => {
            const value = prebid.config.s2sConfig?.app[key as keyof typeof prebid.config.s2sConfig.app];
            if (value) {
              return <ListItem key={key}>{key}: {String(value)}</ListItem>
            }
          })}
        </List>
      }
      {prebid.config.s2sConfig?.adapter && <Typography><strong>Adapter:</strong> {prebid.config.s2sConfig.adapter}</Typography>}
      {prebid.config.s2sConfig?.adapterOptions && <Typography><strong>Adapter Options:</strong> {JSON.stringify(prebid.config.s2sConfig.adapterOptions)}</Typography>}
      {prebid.config.s2sConfig?.maxBids && <Typography><strong>max. Bids:</strong> {prebid.config.s2sConfig.maxBids}</Typography>}
      {prebid.config.s2sConfig?.syncUrlModifier && <Typography><strong>Sync. Url Modifier:</strong> {JSON.stringify(prebid.config.s2sConfig.syncUrlModifier)}</Typography>}
      {prebid.config.s2sConfig?.timeout && < Typography > <strong>Timeout:</strong> {prebid.config.s2sConfig.timeout}</Typography>}
    </Box >
  );
}

interface Server2ServerComponentProps {
  prebid: IPrebidDetails
}

export default Server2ServerComponent;
