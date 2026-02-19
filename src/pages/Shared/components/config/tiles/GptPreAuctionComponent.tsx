import React, { useContext } from 'react';
import BorderBottomIcon from '@mui/icons-material/BorderBottom';
import AppStateContext from '../../../contexts/appStateContext';
import RenderKeyValueComponent from '../../RenderKeyValueComponent';
import { ExpandableTile } from './ExpandableTile';

const GptPreAuctionComponent = (): JSX.Element | null => {
  const { prebid } = useContext(AppStateContext);
  const { gptPreAuction } = prebid.config;
  if (!gptPreAuction) return null;

  return (
    <ExpandableTile icon={<BorderBottomIcon />} title="GPT Pre-Auction Module" subtitle="MCM & Pre-Auction Config" defaultMaxWidth={4} expandedMaxWidth={8}>
      <RenderKeyValueComponent label="MCM Enabled" value={gptPreAuction.mcmEnabled} columns={[4, 12]} expanded />
      <RenderKeyValueComponent label="GPT Pre-Auction" value={gptPreAuction} columns={[12, 12]} expanded />
    </ExpandableTile>
  );
};

export default GptPreAuctionComponent;
