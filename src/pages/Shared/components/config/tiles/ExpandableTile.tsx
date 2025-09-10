import React, { useState, useRef, useCallback, ReactNode } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { tileHeight } from '../ConfigComponent';

interface ExpandableTileProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  defaultMaxWidth?: 4 | 6 | 8 | 12;
  expandedMaxWidth?: 4 | 6 | 8 | 12;
  children: ReactNode;
}

export const ExpandableTile = ({ icon, title, subtitle = '', defaultMaxWidth = 4, expandedMaxWidth = 8, children }: ExpandableTileProps): JSX.Element => {
  const [expanded, setExpanded] = useState(false);
  const [maxWidth, setMaxWidth] = useState<typeof defaultMaxWidth | typeof expandedMaxWidth>(defaultMaxWidth);
  const ref = useRef<HTMLInputElement>(null);

  const handleExpandClick = useCallback(() => {
    setExpanded((prev) => !prev);
    setMaxWidth((prev) => (prev === defaultMaxWidth ? expandedMaxWidth : defaultMaxWidth));
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth' }), 150);
  }, [defaultMaxWidth, expandedMaxWidth]);

  return (
    <Grid size={{ xs: 12, sm: maxWidth }} ref={ref}>
      <Card
        sx={{
          width: 1,
          minHeight: tileHeight,
          maxHeight: expanded ? 'unset' : tileHeight,
        }}
      >
        <CardHeader
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{icon}</Avatar>}
          title={<Typography variant="h3">{title}</Typography>}
          subheader={subtitle && <Typography variant="subtitle1">{subtitle}</Typography>}
          action={
            <ExpandMoreIcon
              sx={{
                transform: !expanded ? 'rotate(0deg)' : 'rotate(180deg)',
                marginLeft: 'auto',
                transition: 'transform 0.3s ease',
              }}
            />
          }
          onClick={handleExpandClick}
        />
        <CardContent>
          <Grid container>{children}</Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};
