import React, { useContext } from 'react';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import InspectedPageContext from '../../../../contexts/inspectedPageContext';
import { IPrebidAdUnit } from '../../../../../Content/scripts/prebid';
import Box from '@mui/material/Box';

const AdServerTile = ({ adUnit }: IAdServerTileProps): JSX.Element => {
  const [targetingExpanded, setTargetingExpanded] = React.useState<boolean>(false);
  const { googleAdManager } = useContext(InspectedPageContext);
  const { targeting, sizes, elementId, name } =
    googleAdManager?.slots?.find(({ name, elementId }) => name === adUnit.code || elementId === adUnit.code) || {};

  return (
    <React.Fragment>
      {elementId && (
        <Box sx={{ p: 0.5 }}>
          <Typography variant="caption">ElementId:</Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Chip size="small" variant="outlined" color="primary" label={elementId} />
          </Stack>
        </Box>
      )}
      {name && (
        <Box sx={{ p: 0.5 }}>
          <Typography variant="caption">Name:</Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Chip size="small" variant="outlined" color="primary" label={name} />
          </Stack>
        </Box>
      )}
      {sizes?.length > 0 && (
        <Box sx={{ p: 0.5 }}>
          <Typography variant="caption">Sizes:</Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
            {sizes.map((sizeStr, index) => (
              <Chip size="small" variant="outlined" color="primary" label={sizeStr} key={index} />
            ))}
          </Stack>
        </Box>
      )}
      {targeting?.length > 0 && (
        <Box sx={{ p: 0.5, overflow: 'hidden'}} onClick={() => setTargetingExpanded(!targetingExpanded)}>
          <Typography variant="caption">Targeting:</Typography>
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, maxHeight: !targetingExpanded ? 100 : 'unset' }}>
            {targeting
              .filter(({ value }) => value)
              .sort((a, b) => (a.key > b.key ? 1 : -1))
              .map(({ key, value }, index) => (
                <Chip size="small" variant="outlined" color="primary" label={`${key}: ${value}`} key={index} />
              ))}
            {targeting
              .filter(({ value }) => !value)
              .sort((a, b) => (a.key > b.key ? 1 : -1))
              .map(({ key, value }, index) => (
                <Chip size="small" variant="outlined" color="primary" label={`${key}: ${value}`} key={index} />
              ))}
          </Stack>
        </Box>
      )}
    </React.Fragment>
  );
};

export default AdServerTile;
interface IAdServerTileProps {
  adUnit: IPrebidAdUnit;
}
