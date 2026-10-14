import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <Box role="tabpanel" hidden={value !== index} {...other}>
      {value === index && (
        <Typography component="div">
          <Paper sx={{ p: 0.5 }}>
            <Typography variant="h3">{children}</Typography>
          </Paper>
        </Typography>
      )}
    </Box>
  );
};

export default TabPanel;
