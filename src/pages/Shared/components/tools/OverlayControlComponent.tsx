import React, { useEffect, useState } from 'react';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import LayerIcon from '@mui/icons-material/Layers';
import { CONSOLE_TOGGLE } from '../../constants';
import { sendChromeTabsMessage } from '../../utils';
import { SectionCard } from '../Section';

const OverlayControlComponent = (): JSX.Element => {
  const [showOverlay, setShowOverlay] = useState<boolean>(false);

  useEffect(() => {
    chrome.storage?.local.get(CONSOLE_TOGGLE, (result) => {
      const checked = result ? !!result[CONSOLE_TOGGLE] : false;
      setShowOverlay(checked);
    });
  }, []);

  const handleShowOverlayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setShowOverlay(checked);
    chrome.storage?.local.set({ [CONSOLE_TOGGLE]: checked }, () => {
      sendChromeTabsMessage(CONSOLE_TOGGLE, { consoleState: checked });
    });
  };

  return (
    <SectionCard
      highlighted={showOverlay}
      icon={<LayerIcon color={showOverlay ? 'primary' : 'action'} />}
      title="On-Page AdUnit Info Overlay"
      badge={<Chip label={showOverlay ? 'ACTIVE' : 'DISABLED'} size="small" color={showOverlay ? 'primary' : 'default'} sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />}
      description="Display interactive debugging badges and bid CPM metadata directly over ad slots on the page."
      actions={<FormControlLabel control={<Switch checked={showOverlay} onChange={handleShowOverlayChange} color="primary" size="small" />} label="" sx={{ mr: 0 }} />}
    />
  );
};

export default OverlayControlComponent;
