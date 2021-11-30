import React, { useEffect } from 'react';
import { IPrebidDetails, IPrebidConfigPriceBucket } from '../../../../inject/scripts/prebid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import logger from '../../../../logger';

const defaultBuckets: IDefaultBuckets = {
  low: [{ precision: 2, min: 0, max: 5, increment: 0.5 }],
  medium: [{ precision: 2, min: 0, max: 20, increment: 0.1 }],
  high: [{ precision: 2, min: 0, max: 20, increment: 0.01 }],
  auto: [
    { precision: 2, min: 0, max: 5, increment: 0.05 },
    { precision: 2, min: 5, max: 10, increment: 0.1 },
    { precision: 2, min: 10, max: 20, increment: 0.5 },
  ],
  dense: [
    { precision: 2, min: 0, max: 3, increment: 0.01 },
    { precision: 2, min: 3, max: 8, increment: 0.05 },
    { precision: 2, min: 8, max: 20, increment: 0.5 },
  ],
};

const PriceGranularityComponent = ({ prebid }: IPriceGranularityComponentProps) => {
  const [type, setType] = React.useState<string>();
  const [rows, setRows] = React.useState<IPrebidConfigPriceBucket[]>([]);
  useEffect(() => {
    const type = prebid.config.priceGranularity;
    setType(type);
    const rows = defaultBuckets[type] || prebid.config?.customPriceBucket?.buckets || [];
    setRows(rows);
  }, [prebid.config.priceGranularity]);

  logger.log(`[PopUp][PriceGranularityComponent]: render `, type, rows);
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell align="left">Bucket</TableCell>
          <TableCell align="left">Precision</TableCell>
          <TableCell align="left">Min</TableCell>
          <TableCell align="left">Max</TableCell>
          <TableCell align="left">Increment</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => {
          return (
            <TableRow key={index + 1} sx={{ verticalAlign: 'top' }}>
              <TableCell align="left" sx={{ width: '40%' }}>
                {type} #{index + 1}
              </TableCell>
              <TableCell align="left" sx={{ width: '15%' }}>
                {row.precision}
              </TableCell>
              <TableCell align="left" sx={{ width: '15%' }}>
                {row.min}
              </TableCell>
              <TableCell align="left" sx={{ width: '15%' }}>
                {row.max}
              </TableCell>
              <TableCell align="left" sx={{ width: '15%' }}>
                {row.increment}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

interface IPriceGranularityComponentProps {
  prebid: IPrebidDetails;
}

interface IDefaultBuckets {
  [key: string]: {
    precision: number;
    min: number;
    max: number;
    increment: number;
  }[];
}

export default PriceGranularityComponent;
