import React, { useRef, useEffect, useState } from 'react';
import { IPrebidAdUnit } from '../../../../Content/scripts/prebid';
import Chip from '@mui/material/Chip';
import { getTabId } from '../../../../Shared/utils';

const AdUnitChipComponent = ({ adUnit }: IAdunitChipComponentProps): JSX.Element => {
  const [labelText, setLabelText] = useState<string | null>(adUnit.code);
  const timeoutRef = useRef<NodeJS.Timeout | null>();
  
  const scroll2element = async (elementId: string): Promise<void> => {
    const tabId = await getTabId();
    const func = (elementId: string): boolean => {
      const element = document.getElementById(elementId);
      const addBorder = (element: HTMLElement) => {
        const borderStyleBak = element.style.border;
        element?.scrollIntoView();
        element.style.border = '5px dashed #f99b0c';
        element.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], {
          duration: 1000,
          iterations: 1, // Infinity
        });
        window.setTimeout(() => {
          element.style.border = borderStyleBak;
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

  return (
    <Chip
      size="small"
      variant="outlined"
      onClick={() => {
        scroll2element(adUnit.code);
      }}
      label={labelText}
      sx={{
        m: 0.5,
        height: 'unset',
        minHeight: '24px',
        '& .MuiChip-label': {
          overflowWrap: 'anywhere',
          whiteSpace: 'normal',
          textOverflow: 'clip',
        },
      }}
    />
  );
};

interface IAdunitChipComponentProps {
  adUnit: IPrebidAdUnit;
}
export default AdUnitChipComponent;
