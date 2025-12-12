import React from 'react';
import { useEffect, useState, useContext, useRef } from 'react';
import { AdUnit, AdUnitBid, EventRecord } from 'prebid.js';
import Popover from '@mui/material/Popover';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import ScreenshotMonitorIcon from '@mui/icons-material/ScreenshotMonitor';
import PictureInPictureOutlinedIcon from '@mui/icons-material/PictureInPictureOutlined';
import JSONViewerComponent from '../JSONViewerComponent';
import StateContext from '../../contexts/appStateContext';
import { getTabId } from '../../../Shared/utils';

const commonChipStyle = {
  m: 0.5,
  height: 'unset',
  minHeight: '24px',
  '& .MuiChip-label': {
    overflowWrap: 'anywhere',
    whiteSpace: 'normal',
    textOverflow: 'clip',
  },
};

interface DataPreviewChipProps {
  label: React.ReactNode;
  data: any;
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  icon?: React.ReactElement;
  name?: string;
}

const DataPreviewChip = ({ label, data, color = 'primary', icon, name = '' }: DataPreviewChipProps) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <React.Fragment>
      <Chip size="small" variant="outlined" color={open ? 'success' : color} label={label} onClick={handleClick} icon={icon} sx={commonChipStyle} />
      <Popover open={open} anchorEl={anchorEl} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} onClose={handleClose}>
        <JSONViewerComponent src={data} name={name} collapsed={false} />
      </Popover>
    </React.Fragment>
  );
};

export const Ortb2ImpExtChipComponent = ({ input, label }: { input: AdUnit['ortb2Imp']; label: string }): JSX.Element => <DataPreviewChip label={label} data={input} />;

export const MediaTypeChipComponent = ({ input, label, isWinner }: { input: AdUnit['mediaTypes']['banner' | 'native' | 'video']; label: string; isWinner?: boolean }): JSX.Element => (
  <DataPreviewChip label={label} data={input} color={isWinner ? 'secondary' : 'primary'} />
);

export const InterstitialChipComponent = ({ adUnit }: { adUnit: AdUnit }): JSX.Element => (
  <Tooltip title={`ortb2Imp.instl: ${JSON.stringify(adUnit.ortb2Imp.instl)}`}>
    <Chip size="small" variant="outlined" label="Interstitial" color="primary" icon={<ScreenshotMonitorIcon />} sx={commonChipStyle} />
  </Tooltip>
);

export const BidChipComponent = ({
  input,
  label,
  isWinner,
  bidReceived,
  bidRequested,
  isRendered,
}: {
  input: AdUnitBid;
  label: string;
  isWinner: boolean;
  bidRequested: EventRecord<'bidRequested'> | undefined;
  bidReceived: EventRecord<'bidResponse'> | undefined;
  isRendered: boolean;
}): JSX.Element => {
  const { topics } = useContext(StateContext);

  const color = isWinner ? 'secondary' : bidReceived ? 'primary' : 'default';
  const icon = (
    <Stack direction="row" spacing={1}>
      {isWinner && <GavelOutlinedIcon sx={{ height: '14px' }} />}
      {isRendered && <PictureInPictureOutlinedIcon sx={{ height: '14px' }} />}
    </Stack>
  );

  return <DataPreviewChip label={label} data={{ input: input, bidderRequest: bidRequested, bidResponse: bidReceived || 'noBid', topics }} color={color} icon={icon} />;
};

export const AdUnitChipComponent = ({ adUnit }: { adUnit: AdUnit }): JSX.Element => {
  const [labelText, setLabelText] = useState<string | null>(adUnit.code);
  const timeoutRef = useRef<NodeJS.Timeout | null>();

  const scroll2element = async (elementId: string): Promise<void> => {
    const tabId = await getTabId();
    const func = (elementId: string): boolean => {
      const element = document.getElementById(elementId);
      const addBorder = (element: HTMLElement) => {
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const styleId = 'prebid-professor-carousel-style';
        if (!document.getElementById(styleId)) {
          const style = document.createElement('style');
          style.id = styleId;

          const pattern = ['#ABDDF1 0 10px', 'transparent 10px 20px', '#f99b0c 20px 30px', 'transparent 30px 40px', '#ABDDF1 40px 50px', 'transparent 50px 60px', '#f99b0c 60px 70px', 'transparent 70px 80px'].join(', ');

          const gradient = (deg: string) => `repeating-linear-gradient(${deg}, ${pattern})`;

          style.textContent = `
            @keyframes pp-march-top { from { background-position-x: 0; } to { background-position-x: 80px; } }
            @keyframes pp-march-right { from { background-position-y: 0; } to { background-position-y: 80px; } }
            @keyframes pp-march-bottom { from { background-position-x: 0; } to { background-position-x: -80px; } }
            @keyframes pp-march-left { from { background-position-y: 0; } to { background-position-y: -80px; } }

            .pp-carousel-effect {
              position: relative !important;
            }

            .pp-carousel-effect::after {
              content: '';
              position: absolute;
              top: -6px; left: -6px; right: -6px; bottom: -6px;
              z-index: 10000;
              pointer-events: none;
              border-radius: 6px;

              background:
                ${gradient('90deg')} top left / 100% 6px repeat-x,
                ${gradient('180deg')} top right / 6px 100% repeat-y,
                ${gradient('90deg')} bottom right / 100% 6px repeat-x,
                ${gradient('180deg')} bottom left / 6px 100% repeat-y;

               background-repeat: no-repeat;
               box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
               animation: pp-march-cycle 1s linear infinite;
            }

            @keyframes pp-march-cycle {
              0% {
                background-position:
                  0 0,      /* Top */
                  100% 0,   /* Right */
                  0 100%,   /* Bottom */
                  0 0;      /* Left */
              }
              100% {
                background-position:
                  80px 0,       /* Top moves Right */
                  100% 80px,    /* Right moves Down */
                  -80px 100%,   /* Bottom moves Left */
                  0 -80px;      /* Left moves Up */
              }
            }
          `;
          document.head.appendChild(style);
        }

        element.classList.add('pp-carousel-effect');

        window.setTimeout(() => {
          element.classList.remove('pp-carousel-effect');
        }, 5000);
      };
      if (!element) {
        return false;
      } else {
        addBorder(element);
        return true;
      }
    };
    chrome.scripting.executeScript({ target: { tabId }, func, args: [elementId] }, (injectionResults) => {
      if (injectionResults[0].result) {
        setLabelText(`✓ ${adUnit.code}`);
      } else {
        setLabelText(`✗ Element with id="${adUnit.code}" not found.`);
      }
      timeoutRef.current = setTimeout(() => setLabelText(adUnit.code), 1500);
    });
  };

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    setLabelText(adUnit.code);
  }, [adUnit]);

  return (
    <Chip
      size="small"
      variant="outlined"
      onClick={() => {
        scroll2element(adUnit.code);
      }}
      label={labelText}
      color={'primary'}
      sx={commonChipStyle}
    />
  );
};
