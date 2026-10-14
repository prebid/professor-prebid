import React, { useContext, useState } from 'react';
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
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

const FirstPartyDataComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const [showJson, setShowJson] = useState(false);
  const rawOrtb2 = prebid?.config?.ortb2;

  if (!rawOrtb2 || (typeof rawOrtb2 === 'object' && Object.keys(rawOrtb2).length === 0)) {
    return null;
  }

  const ortb2 = rawOrtb2 as Record<string, any>;
  const site = (ortb2.site || {}) as Record<string, any>;
  const app = (ortb2.app || {}) as Record<string, any>;
  const user = (ortb2.user || {}) as Record<string, any>;

  const hasSite = Boolean(site.domain || site.name || site.publisher?.id || site.cat?.length);
  const hasApp = Boolean(app.name || app.bundle || app.publisher?.id);
  const hasUser = Boolean(user.gender || user.yob || user.id || user.buyeruid || user.keywords);
  const isFallback = !hasSite && !hasApp && !hasUser;

  const jsonToggleAction = (
    <Tooltip title={showJson ? 'Switch to formatted view' : 'Switch to raw JSON view'} arrow>
      <IconButton size="small" onClick={() => setShowJson(!showJson)} color={showJson ? 'primary' : 'default'} sx={{ mr: 0.5 }}>
        <CodeIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  return (
    <ExpandableTile icon={<DataObjectOutlinedIcon />} title="First Party Data (ortb2)" subtitle="OpenRTB2 publisher & site data" defaultMaxWidth={4} expandedMaxWidth={8} headerAction={jsonToggleAction}>
      {showJson ? (
        <Grid size={{ xs: 12 }}>
          <JSONViewerComponent src={ortb2} name="" collapsed={1} />
        </Grid>
      ) : (
        <Grid size={{ xs: 12 }}>
          {hasSite && (
            <Box sx={{ mb: 1.25 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
                Site Context
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {site.domain && (
                  <Chip
                    label={
                      <>
                        <strong>Domain: </strong>
                        {site.domain}
                      </>
                    }
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
                  />
                )}
                {site.name && (
                  <Chip
                    label={
                      <>
                        <strong>Name: </strong>
                        {site.name}
                      </>
                    }
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
                  />
                )}
                {site.publisher?.id && (
                  <Chip
                    label={
                      <>
                        <strong>Publisher ID: </strong>
                        {site.publisher.id}
                      </>
                    }
                    size="small"
                    color="secondary"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
                  />
                )}
                {site.cat && Array.isArray(site.cat) && (
                  <Chip
                    label={
                      <>
                        <strong>Categories: </strong>
                        {site.cat.join(', ')}
                      </>
                    }
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
                  />
                )}
              </Box>
            </Box>
          )}

          {hasApp && (
            <Box sx={{ mb: 1.25 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
                App Context
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {app.name && (
                  <Chip
                    label={
                      <>
                        <strong>Name: </strong>
                        {app.name}
                      </>
                    }
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                )}
                {app.bundle && (
                  <Chip
                    label={
                      <>
                        <strong>Bundle: </strong>
                        {app.bundle}
                      </>
                    }
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </Box>
          )}

          {hasUser && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
                User Demographics
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {user.gender && (
                  <Chip
                    label={
                      <>
                        <strong>Gender: </strong>
                        {user.gender}
                      </>
                    }
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
                  />
                )}
                {user.yob && (
                  <Chip
                    label={
                      <>
                        <strong>YOB: </strong>
                        {user.yob}
                      </>
                    }
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
                  />
                )}
                {user.buyeruid && (
                  <Chip
                    label={
                      <>
                        <strong>Buyer UID: </strong>
                        {user.buyeruid}
                      </>
                    }
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </Box>
          )}

          {isFallback && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', width: '100%', mb: 0.5 }}>
                {Object.keys(ortb2).length} top-level ortb2 key(s) configured:
              </Typography>
              {Object.keys(ortb2).map((key) => (
                <Chip key={key} label={key} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
              ))}
            </Box>
          )}
        </Grid>
      )}
    </ExpandableTile>
  );
};

export default FirstPartyDataComponent;
