import React, { useContext, useState } from 'react';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import CodeIcon from '@mui/icons-material/Code';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import JSONViewerComponent from '../../JSONViewerComponent';

const UserIdModuleComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const [showJson, setShowJson] = useState(false);

  const userSync = prebid?.config?.userSync;
  const userIds = userSync?.userIds;

  if (!userIds || !userIds.length) return null;

  const jsonToggleAction = (
    <Tooltip title={showJson ? 'Switch to formatted view' : 'Switch to raw JSON view'} arrow>
      <IconButton size="small" onClick={() => setShowJson(!showJson)} color={showJson ? 'primary' : 'default'} sx={{ mr: 0.5 }}>
        <CodeIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  return (
    <ExpandableTile icon={<ContactPageOutlinedIcon />} title="User IDs" subtitle={`${userIds.length} detected module(s)`} defaultMaxWidth={4} expandedMaxWidth={8} headerAction={jsonToggleAction}>
      {showJson ? (
        <Grid size={{ xs: 12 }}>
          <JSONViewerComponent src={userIds} name="" collapsed={1} />
        </Grid>
      ) : (
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            {userIds.map((userId, index) => (
              <Chip key={`${userId.name}-${index}`} label={`${userId.name}${userId.storage?.type ? ` (${userId.storage.type})` : ''}`} size="small" variant="outlined" color="secondary" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
            ))}
          </Box>

          {userIds.map((userId, index) => {
            if (!userId.params || Object.keys(userId.params).length === 0) return null;
            return (
              <Box key={`${userId.name}-${index}`} sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                  {userId.name} Parameters:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {Object.entries(userId.params).map(([k, v]) => (
                    <Chip
                      key={k}
                      label={
                        <>
                          <strong>{k}: </strong>
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </>
                      }
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.675rem' }}
                    />
                  ))}
                </Box>
              </Box>
            );
          })}
        </Grid>
      )}
    </ExpandableTile>
  );
};

export default UserIdModuleComponent;
