import React from 'react';
import { IPrebidConfig } from '../../../../inject/scripts/prebid';
import Typography from '@mui/material/Typography';
import logger from '../../../../logger';
import Avatar from '@mui/material/Avatar';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import { tileHeight } from './ConfigComponent';
import ReactJson from 'react-json-view';
import { Stack } from '@mui/material';
import BorderBottomIcon from '@mui/icons-material/BorderBottom';

interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
}));

const FloorsModuleComponent = ({ floors }: IFloorsModuleComponentProps): JSX.Element => {
  const [expanded, setExpanded] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState<4 | 8>(4);
  const ref = React.useRef<HTMLInputElement>(null);

  const handleExpandClick = () => {
    setExpanded(!expanded);
    setMaxWidth(expanded ? 4 : 8);
    setTimeout(() => ref.current.scrollIntoView({ behavior: 'smooth' }), 150);
  };
  logger.log(`[PopUp][FloorsModuleComponent]: render `, floors);
  return (
    <Grid item xs={maxWidth} ref={ref}>
      <Card sx={{ width: 1, minHeight: tileHeight, border: '1px solid #0e86d4' }}>
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: '#0e86d4' }} aria-label="recipe">
              <BorderBottomIcon />
            </Avatar>
          }
          title="Floors Module"
          subheader={'floors'}
          action={
            <ExpandMore expand={expanded} aria-expanded={expanded} aria-label="show more">
              <ExpandMoreIcon />
            </ExpandMore>
          }
          onClick={handleExpandClick}
        />
        <Collapse in={!expanded} timeout="auto" unmountOnExit>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              <strong>Currency:</strong> {floors.data.currency}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Schema Version:</strong> {floors.data.floorsSchemaVersion}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Schema Delimiter:</strong> {floors.data.schema.delimiter}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Schema Fieds:</strong> [{floors.data.schema.fields.join(' , ')}]
            </Typography>
          </CardContent>
        </Collapse>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            <ReactJson
              src={floors}
              name={false}
              collapsed={false}
              enableClipboard={false}
              displayObjectSize={false}
              displayDataTypes={false}
              sortKeys={false}
              quotesOnKeys={false}
              indentWidth={2}
              collapseStringsAfterLength={100}
              style={{ fontSize: '12px', fontFamily: 'roboto', padding: '15px' }}
            />
          </CardContent>
        </Collapse>
      </Card>
    </Grid>
  );
};

interface IFloorsModuleComponentProps {
  floors: IPrebidConfig['floors'];
}

export default FloorsModuleComponent;
