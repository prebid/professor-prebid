import React from 'react';
import { IPrebidAdUnitMediaTypes } from '../../../../inject/scripts/prebid';
import Chip from '@mui/material/Chip';
import JSONViewerComponent from '../../../Shared/JSONViewerComponent';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

const MediaTypeChipComponent = ({ input, label, isWinner }: IMediaTypeChipComponentProps): JSX.Element => {
  const [popUpOpen, setPopUpOpen] = React.useState<boolean>(false);
  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setPopUpOpen(true);
  };
  const handlePopoverClose = () => {
    setPopUpOpen(false);
  };

  return (
    <React.Fragment>
      <Chip
        size="small"
        variant="outlined"
        color={popUpOpen ? 'success' : isWinner ? 'secondary' : 'primary'}
        label={label}
        onClick={handlePopoverOpen}
      />
      <Popover
        open={popUpOpen}
        anchorReference="anchorPosition"
        anchorPosition={{ top: 1, left: 1 }}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClose={handlePopoverClose}
      >
        <Box sx={{ p: 0, w: 1, display: 'flex', flexDirection: 'row-reverse' }}>
          <Button sx={{ p: 0 }} onClick={() => handlePopoverClose()}>
            X
          </Button>
        </Box>
        <JSONViewerComponent
          src={input}
          name={false}
          collapsed={false}
          displayObjectSize={false}
          displayDataTypes={false}
          sortKeys={false}
          quotesOnKeys={false}
          indentWidth={2}
          collapseStringsAfterLength={100}
          style={{ fontSize: '12px', fontFamily: 'roboto', padding: '5px' }}
        />
      </Popover>
    </React.Fragment>
  );
};

interface IMediaTypeChipComponentProps {
  input: IPrebidAdUnitMediaTypes[keyof IPrebidAdUnitMediaTypes];
  label: string;
  isWinner?: boolean;
}

export default MediaTypeChipComponent;
