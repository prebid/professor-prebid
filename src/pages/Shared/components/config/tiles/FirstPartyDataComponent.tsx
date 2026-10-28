import React, { useContext } from 'react';
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

import AppStateContext from '../../../contexts/appStateContext';
import { ExpandableTile } from './ExpandableTile';
import { ChipRow, SectionLabel } from '../../Section';

const FirstPartyDataComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
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

  return (
    <ExpandableTile icon={<DataObjectOutlinedIcon />} title="First Party Data (ortb2)" subtitle="OpenRTB2 publisher & site data" defaultMaxWidth={4} expandedMaxWidth={8} json={ortb2}>
      <Grid size={{ xs: 12 }}>
        {hasSite && (
          <Box sx={{ mb: 1.25 }}>
            <SectionLabel>Site Context</SectionLabel>
            <ChipRow>
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
            </ChipRow>
          </Box>
        )}

        {hasApp && (
          <Box sx={{ mb: 1.25 }}>
            <SectionLabel>App Context</SectionLabel>
            <ChipRow>
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
            </ChipRow>
          </Box>
        )}

        {hasUser && (
          <Box sx={{ mb: 1 }}>
            <SectionLabel>User Demographics</SectionLabel>
            <ChipRow>
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
            </ChipRow>
          </Box>
        )}

        {isFallback && (
          <ChipRow>
            <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', width: '100%', mb: 0.5 }}>
              {Object.keys(ortb2).length} top-level ortb2 key(s) configured:
            </Typography>
            {Object.keys(ortb2).map((key) => (
              <Chip key={key} label={key} size="small" color="primary" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
            ))}
          </ChipRow>
        )}
      </Grid>
    </ExpandableTile>
  );
};

export default FirstPartyDataComponent;
