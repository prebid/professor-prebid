import React, { useContext } from 'react';
import AdUnitChipComponent from '../../chips/AdUnitChipComponent';
import { IPrebidAdUnit } from '../../../../../Injected/prebid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import JSONViewerComponent from '../../../JSONViewerComponent';
import AppStateContext from '../../../../contexts/appStateContext';
import InterstitialChipComponent from '../../chips/InterstitialChipComponent';
import Ortb2ImpExtChipComponent from '../../chips/ortb2impExtChipComponent';
import { useTileExpansion, TileWrapper, TileContent, TileSection } from './Tiles';

const AdUnitTile = ({ adUnit, colCount }: { adUnit: IPrebidAdUnit; colCount: number }): JSX.Element => {
  const { isPanel } = useContext(AppStateContext);
  const { expanded, toggle } = useTileExpansion();

  return (
    <TileWrapper expanded={expanded} onToggle={toggle} isPanel={isPanel} colCount={colCount}>
      <TileContent
        expanded={expanded}
        collapsedView={
          <>
            <TileSection label="AdUnit Code">
              <AdUnitChipComponent adUnit={adUnit} />
            </TileSection>
            {adUnit.ortb2Imp && JSON.stringify(adUnit.ortb2Imp) !== '{}' && (
              <>
                <TileSection label="Ortb2Imp">
                  <Stack direction="column" alignItems="flex-start" flexWrap="wrap" gap={1}>
                    {adUnit.ortb2Imp.instl === 1 && <InterstitialChipComponent adUnit={adUnit} />}
                    {adUnit.ortb2Imp && !isPanel && <Ortb2ImpExtChipComponent label="ortb2Imp" input={adUnit.ortb2Imp} />}
                  </Stack>
                </TileSection>
              </>
            )}
          </>
        }
        expandedView={
          <Box sx={{ p: 0.5 }}>
            <Typography variant="caption">AdUnit JSON:</Typography>
            <JSONViewerComponent style={{ padding: 0 }} src={adUnit} collapsed={2} />
          </Box>
        }
      />
    </TileWrapper>
  );
};

export default AdUnitTile;
