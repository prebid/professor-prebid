import React from 'react';
import { IPrebidConfig } from '../../../Content/scripts/prebid';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import { tileHeight } from './ConfigComponent';
import JSONViewerComponent from '../../../Shared/components/JSONViewerComponent';
import DataObjectOutlinedIcon from '@mui/icons-material/DataObjectOutlined';

const FirstPartyDataComponent = ({ floors }: IFirstPartyDataComponentProps): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 8>(4);
  const ref = React.useRef<HTMLInputElement>(null);

  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 4);
    setTimeout(() => ref.current.scrollIntoView({ behavior: 'smooth' }), 150);
  };
  return (
    <Grid item md={maxWidth} xs={12} ref={ref}>
      <Card sx={{ width: 1, minHeight: tileHeight }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: '#0e86d4' }} aria-label="recipe">
              <DataObjectOutlinedIcon />
            </Avatar>
          }
          title={<Typography variant="h3">Floors Module</Typography>}
          subheader={<Typography variant="subtitle1">Dynamic Floors</Typography>}
          action={
            <ExpandMoreIcon
              sx={{
                transform: !expanded ? 'rotate(0deg)' : 'rotate(180deg)',
                marginLeft: 'auto',
              }}
            />
          }
          onClick={handleExpandClick}
        />
        <Grid item xs={12}>
          <Typography variant="body1">
            <strong>Floor Data</strong>
          </Typography>
        </Grid>
        {expanded && (
          <Grid item xs={12}>
            <JSONViewerComponent
              src={floors}
              name={false}
              collapsed={false}
              displayObjectSize={false}
              displayDataTypes={false}
              sortKeys={false}
              quotesOnKeys={false}
              indentWidth={2}
              collapseStringsAfterLength={100}
              style={{ fontSize: '12px', fontFamily: 'roboto', padding: '15px' }}
            />
          </Grid>
        )}
      </Card>
    </Grid>
  );
};

interface IFirstPartyDataComponentProps {
  floors: IPrebidConfig['floors'];
}

export default FirstPartyDataComponent;
