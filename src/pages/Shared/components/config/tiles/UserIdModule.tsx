import React, { useContext } from 'react';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import { ChipRow } from '../../Section';

const UserIdModuleComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);

  const userSync = prebid?.config?.userSync;
  const userIds = userSync?.userIds;

  if (!userIds || !userIds.length) return null;

  return (
    <ExpandableTile icon={<ContactPageOutlinedIcon />} title="User IDs" subtitle={`${userIds.length} detected module(s)`} defaultMaxWidth={4} expandedMaxWidth={8} json={userIds}>
      <Grid size={{ xs: 12 }}>
        <ChipRow sx={{ mb: 1 }}>
          {userIds.map((userId, index) => (
            <Chip key={`${userId.name}-${index}`} label={`${userId.name}${userId.storage?.type ? ` (${userId.storage.type})` : ''}`} size="small" variant="outlined" color="secondary" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }} />
          ))}
        </ChipRow>

        {userIds.map((userId, index) => {
          if (!userId.params || Object.keys(userId.params).length === 0) return null;
          return (
            <Box key={`${userId.name}-${index}`} sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary', mb: 0.5 }}>
                {userId.name} Parameters:
              </Typography>
              <ChipRow>
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
              </ChipRow>
            </Box>
          );
        })}
      </Grid>
    </ExpandableTile>
  );
};

export default UserIdModuleComponent;
