import React, { useContext } from 'react';
import Typography from '@mui/material/Typography';
import StateContext from '../../../../contexts/appStateContext';
import MediaTypeChipComponent from '../../chips/MediaTypeChipComponent';
import { IPrebidAdUnit } from '../../../../../Injected/prebid';
import { useTileExpansion, TileWrapper, TileContent, TileSection } from './Tiles';

const MediaTypesTile = ({ adUnit: { mediaTypes, code: adUnitCode }, colCount }: { adUnit: IPrebidAdUnit; colCount: number }): JSX.Element => {
  const { allWinningBids, isPanel } = useContext(StateContext);
  const { expanded, toggle } = useTileExpansion();

  return (
    <TileWrapper expanded={expanded} onToggle={toggle} isPanel={isPanel} colCount={colCount}>
      <TileContent
        expanded={expanded}
        collapsedView={
          <>
            {(JSON.stringify(mediaTypes) === '{}' || !mediaTypes) && (
              <TileSection label="Media Types Object">
                <Typography variant="caption">{JSON.stringify(mediaTypes)}</Typography>
              </TileSection>
            )}
            {mediaTypes?.banner?.sizes && (
              <TileSection label="Banner Sizes">
                {mediaTypes.banner.sizes.map(([w, h], i) => (
                  <MediaTypeChipComponent key={i} input={mediaTypes.banner} label={`${w}x${h}`} isWinner={allWinningBids.find(({ args }) => args.adUnitCode === adUnitCode)?.args?.size === `${w}x${h}`} />
                ))}
              </TileSection>
            )}
          </>
        }
        expandedView={
          <TileSection label="Full Media Types">
            <pre>{JSON.stringify(mediaTypes, null, 2)}</pre>
          </TileSection>
        }
      />
    </TileWrapper>
  );
};

export default MediaTypesTile;
