import React, { useContext } from 'react';
import StateContext from '../../../../contexts/appStateContext';
import { IPrebidAdUnit } from '../../../../../Injected/prebid';
import JSONViewerComponent from '../../../JSONViewerComponent';
import { Box } from '@mui/material';
import { useTileExpansion, TileWrapper, TileContent, TileSection } from './Tiles';

const Ortb2ImpTile = ({ adUnit, colCount }: { adUnit: IPrebidAdUnit; colCount: number }): JSX.Element | null => {
  const { isPanel } = useContext(StateContext);
  const { expanded, toggle } = useTileExpansion();

  if (!adUnit?.ortb2Imp) return null;

  return (
    <TileWrapper expanded={expanded} onToggle={toggle} isPanel={isPanel} colCount={colCount}>
      <TileContent
        expanded={expanded}
        collapsedView={
          <TileSection label="ORTB2 Imp">
            <JSONViewerComponent style={{ padding: 0 }} src={adUnit.ortb2Imp} collapsed={!expanded ? 1 : 2} />
          </TileSection>
        }
        expandedView={
          <Box sx={{ p: 0.5 }}>
            <JSONViewerComponent style={{ padding: 0 }} src={adUnit.ortb2Imp} collapsed={2} />
          </Box>
        }
      />
    </TileWrapper>
  );
};

export default Ortb2ImpTile;
