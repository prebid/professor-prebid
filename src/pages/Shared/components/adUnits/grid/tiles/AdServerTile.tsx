import React, { useContext, useState, useEffect } from 'react';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import { IPrebidAdUnit } from '../../../../../Injected/prebid';
import { IGoogleAdManagerSlot } from '../../../../../Injected/googleAdManager';
import JSONViewerComponent from '../../../JSONViewerComponent';
import AppStateContext from '../../../../contexts/appStateContext';
import { useTileExpansion, TileWrapper, TileContent, TileSection } from './Tiles';

interface IAdServerTileProps {
  adUnit: IPrebidAdUnit;
  colCount: number;
}

const AdServerTile = ({ adUnit, colCount }: IAdServerTileProps): JSX.Element => {
  const { isPanel, googleAdManager } = useContext(AppStateContext);
  const { expanded, toggle } = useTileExpansion();
  const [slot, setSlot] = useState<IGoogleAdManagerSlot | undefined>(undefined);
  const { targeting, sizes, elementId, name } = (slot || {}) as IGoogleAdManagerSlot;

  useEffect(() => {
    const matchedSlot = googleAdManager?.slots?.find(
      ({ name, elementId }: { name: string; elementId: string }) => name === adUnit.code || elementId === adUnit.code || name.toLowerCase() === adUnit.code.toLowerCase() || elementId.toLowerCase() === adUnit.code.toLowerCase()
    );
    const fallbackSlot = googleAdManager?.slots?.length === 1 ? googleAdManager?.slots[0] : undefined;
    setSlot(matchedSlot || fallbackSlot);
  }, [adUnit.code, googleAdManager?.slots]);

  return (
    <TileWrapper expanded={expanded} onToggle={toggle} isPanel={isPanel} colCount={colCount}>
      {!slot && (
        <TileContent
          expanded={expanded}
          collapsedView={
            <>
              <Typography variant="caption">Unable to match Prebid AdUnit with ad-server slot.</Typography>
              {googleAdManager?.slots?.length > 0 && <JSONViewerComponent style={{ padding: 0 }} name="All detected ad-server slots:" src={googleAdManager.slots} collapsed={2} />}
            </>
          }
          expandedView={
            <>
              <Typography variant="caption">Unable to match Prebid AdUnit with ad-server slot.</Typography>
              {googleAdManager?.slots?.length > 0 && <JSONViewerComponent style={{ padding: 0 }} name="All detected ad-server slots:" src={googleAdManager.slots} collapsed={2} />}
            </>
          }
        />
      )}
      {slot && (
        <TileContent
          expanded={expanded}
          collapsedView={
            <>
              {elementId && (
                <TileSection label="ElementId">
                  <Chip size="small" variant="outlined" color="primary" label={elementId} />
                </TileSection>
              )}
              {name && (
                <TileSection label="Name">
                  <Chip size="small" variant="outlined" color="primary" label={name} />
                </TileSection>
              )}
              {sizes?.length > 0 && (
                <TileSection label="Sizes">
                  {sizes.map((sizeStr, index) => (
                    <Chip size="small" variant="outlined" color="primary" label={sizeStr} key={index} />
                  ))}
                </TileSection>
              )}
              {targeting?.length > 0 && (
                <TileSection label="Targeting">
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
                </TileSection>
              )}
            </>
          }
          expandedView={
            <Box sx={{ p: 0.5 }}>
              <Typography variant="caption">Ad Server Slot JSON:</Typography>
              <JSONViewerComponent style={{ padding: 0 }} src={slot} collapsed={2} />
            </Box>
          }
        />
      )}
    </TileWrapper>
  );
};

export default AdServerTile;
