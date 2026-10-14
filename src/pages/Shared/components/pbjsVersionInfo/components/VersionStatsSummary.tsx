import React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BuildCircleOutlinedIcon from '@mui/icons-material/BuildCircleOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import HistoryToggleOffOutlinedIcon from '@mui/icons-material/HistoryToggleOffOutlined';

export interface VersionStatsSummaryProps {
  newFeaturesCount: number;
  maintenanceCount: number;
  bugfixesCount: number;
  timeElapsedText: string;
}

export const VersionStatsSummary: React.FC<VersionStatsSummaryProps> = ({ newFeaturesCount, maintenanceCount, bugfixesCount, timeElapsedText }) => {
  const stats = [
    {
      label: 'New Features',
      value: newFeaturesCount,
      icon: <AutoAwesomeOutlinedIcon sx={{ color: 'primary.main', fontSize: 18 }} />,
      bgColor: 'rgba(67, 142, 217, 0.08)',
      borderColor: 'primary.light',
    },
    {
      label: 'Maintenance Updates',
      value: maintenanceCount,
      icon: <BuildCircleOutlinedIcon sx={{ color: '#0288d1', fontSize: 18 }} />,
      bgColor: 'rgba(2, 136, 209, 0.08)',
      borderColor: 'info.main',
    },
    {
      label: 'Bug Fixes',
      value: bugfixesCount,
      icon: <BugReportOutlinedIcon sx={{ color: '#ed6c02', fontSize: 18 }} />,
      bgColor: 'rgba(237, 108, 2, 0.08)',
      borderColor: 'warning.light',
    },
    {
      label: 'Time Behind',
      value: timeElapsedText || '< 1 day',
      icon: <HistoryToggleOffOutlinedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />,
      bgColor: 'action.hover',
      borderColor: 'divider',
      isText: true,
    },
  ];

  return (
    <>
      {stats.map((stat, index) => (
        <Grid key={index} size={{ xs: 6, sm: 3 }}>
          <Paper
            elevation={1}
            sx={{
              p: 1.25,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.paper',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                {stat.label}
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 0.4,
                  borderRadius: '50%',
                  backgroundColor: stat.bgColor,
                }}
              >
                {stat.icon}
              </Box>
            </Box>

            <Typography
              variant="h2"
              sx={{
                fontSize: stat.isText ? '0.85rem' : '1.25rem',
                fontWeight: 700,
                color: 'text.primary',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {stat.value}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </>
  );
};

export default VersionStatsSummary;
