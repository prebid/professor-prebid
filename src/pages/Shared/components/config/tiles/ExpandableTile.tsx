import React, { useState, useRef, useCallback, ReactNode } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';


interface ExpandableTileProps {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  defaultMaxWidth?: 4 | 6 | 8 | 12;
  expandedMaxWidth?: 4 | 6 | 8 | 12;
  children: ReactNode;
  collapsedSize?: number;
  headerAction?: ReactNode;
}

export const ExpandableTile = ({ icon, title, subtitle = '', defaultMaxWidth = 4, expandedMaxWidth = 8, children, collapsedSize = 180, headerAction }: ExpandableTileProps): JSX.Element => {
  const [expanded, setExpanded] = useState(false);
  const [maxWidth, setMaxWidth] = useState<typeof defaultMaxWidth | typeof expandedMaxWidth>(defaultMaxWidth);
  const ref = useRef<HTMLDivElement>(null);

  const handleExpandClick = useCallback(() => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);
    setMaxWidth(newExpanded ? expandedMaxWidth : defaultMaxWidth);

    if (newExpanded) {
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300);
    }
  }, [expanded, defaultMaxWidth, expandedMaxWidth]);

  return (
    <Grid
      size={{ xs: 12, sm: maxWidth }}
      ref={ref}
      sx={{
        transition: 'all 0.3s ease-in-out',
        breakInside: 'avoid',
        columnSpan: expanded ? 'all' : 'none',
        py: 0.25,
      }}
    >
      <Card
        elevation={expanded ? 4 : 1}
        sx={{
          width: 1,
          height: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CardHeader
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{icon}</Avatar>}
          title={<Typography variant="h3">{title}</Typography>}
          subheader={typeof subtitle === 'string' ? subtitle && <Typography variant="subtitle1">{subtitle}</Typography> : subtitle}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
              {headerAction}
              <IconButton onClick={handleExpandClick} aria-expanded={expanded} aria-label="show more">
                <ExpandMoreIcon
                  sx={{
                    transform: !expanded ? 'rotate(0deg)' : 'rotate(180deg)',
                    transition: 'transform 0.3s ease',
                  }}
                />
              </IconButton>
            </Box>
          }
          sx={{
            cursor: 'pointer',
            userSelect: 'none',
          }}
          onClick={handleExpandClick}
        />
        <CardContent sx={{ paddingTop: 0, pb: '12px !important' }}>
          <Box
            sx={{
              maxHeight: expanded ? 'none' : `${collapsedSize}px`,
              overflow: 'hidden',
              transition: 'max-height 0.3s ease-in-out',
            }}
          >
            <Grid container spacing={1}>
              {children}
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
};
