import React from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import JSONViewerComponent from './JSONViewerComponent';

export const RenderKeyValueComponent = ({
  label,
  value,
  expanded,
  columns: [expandedCols, collapsedCols],
}: IRenderKeyValueComponentProps): JSX.Element => {
  if (!value) return null;

  if (typeof value === 'object' && Object.keys(value).length === 0) return null;

  if (typeof value === 'boolean') {
    value = value.toString();
  }

  if (React.isValidElement(value) === true) {
    return (
      <Grid item xs={12} sm={expanded ? expandedCols : collapsedCols}>
        <Typography variant="body1">
          <strong>{label}: </strong>
        </Typography>
        {value}
      </Grid>
    );
  }

  if (React.isValidElement(value) === false && typeof value === 'object' && Object.keys(value).length > 0)
    return (
      <Grid item xs={12} sm={expanded ? expandedCols : collapsedCols}>
        <Typography component={'span'} variant="body1">
          <strong>{label}: </strong>
        </Typography>
        <JSONViewerComponent
          src={value}
          name={false}
          collapsed={false}
          displayObjectSize={false}
          displayDataTypes={false}
          sortKeys={false}
          quotesOnKeys={false}
          indentWidth={2}
          collapseStringsAfterLength={100}
          style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
        />
      </Grid>
    );

  return (
    <Grid item xs={12} sm={expanded ? expandedCols : collapsedCols}>
      <Typography variant="body1">
        <strong>{label}: </strong>
        {value}
      </Typography>
    </Grid>
  );
};

export default RenderKeyValueComponent;

interface IRenderKeyValueComponentProps {
  label: string;
  value: string | number | object | boolean | React.ReactNode;
  expanded: boolean;
  columns: number[];
}
