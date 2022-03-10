import React, { useRef, useEffect } from 'react';
import { IPrebidAdUnit } from '../../../../inject/scripts/prebid';
import Chip from '@mui/material/Chip';
import { getTabId } from '../../utils';
import Stack from '@mui/material/Stack';

const AdUnitChipComponent = ({ adUnit }: IAdunitChipComponentProps): JSX.Element => {
  const [labelText, setLabelText] = React.useState<string | null>(adUnit.code);
  const timeout = useRef<any>();
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
      timeout.current = setTimeout(() => setLabelText(adUnit.code), 1500);
    });
  };
  useEffect(() => {
    return () => {
      clearInterval(timeout.current);
    };
  }, []);

  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, p: 0.5 }}>
      <Chip
        onClick={() => {
          scroll2element(adUnit.code);
        }}
        label={labelText}
        variant="outlined"
      />
    </Stack>
  );
};

interface IAdunitChipComponentProps {
  adUnit: IPrebidAdUnit;
}
export default AdUnitChipComponent;