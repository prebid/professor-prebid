import React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

const tileWrapperStyles = {
  overflow: 'hidden',
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '6px',
    background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1))',
    pointerEvents: 'none',
  },
};

export const useTileExpansion = (initial = false) => {
  const [expanded, setExpanded] = React.useState(initial);
  const toggle = () => setExpanded((prev) => !prev);
  return { expanded, toggle };
};

interface ITileContentProps {
  expanded: boolean;
  collapsedView: React.ReactNode;
  expandedView: React.ReactNode;
}

export const TileContent = ({ expanded, collapsedView, expandedView }: ITileContentProps) => <Box sx={{ p: 0.5 }}>{!expanded ? collapsedView : expandedView}</Box>;

interface ITileSectionProps {
  label: string;
  children: React.ReactNode;
}

export const TileSection = ({ label, children }: ITileSectionProps) => (
  <Box sx={{ p: 0.5 }}>
    <Typography variant="caption">{label}:</Typography>
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
      {children}
    </Stack>
  </Box>
);

interface ITileWrapperProps {
  expanded: boolean;
  onToggle: () => void;
  isPanel: boolean;
  colCount: number;
  children: React.ReactNode;
}

export const TileWrapper = ({ expanded, onToggle, isPanel, children, colCount }: ITileWrapperProps) => (
  <Grid size={{ xs: 12 / colCount }} sx={tileWrapperStyles} onClick={onToggle}>
    <Paper sx={{ height: '100%', position: 'relative' }}>
      <Box
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-expanded={expanded}
        aria-label="show more"
        sx={{
          zIndex: 100,
          position: 'absolute',
          right: '0px',
          top: '0px',
          // display: isPanel ? 'block' : 'none',
        }}
      >
        {!expanded ? <ExpandMoreIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} /> : <ExpandLessIcon fontSize="small" sx={{ color: 'text.secondary', opacity: 0.7 }} />}
      </Box>
      <Box onClick={(e) => e.stopPropagation()}>{children}</Box>
    </Paper>
  </Grid>
);
