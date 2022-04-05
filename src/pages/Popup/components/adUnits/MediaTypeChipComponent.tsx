import React from 'react';
import { IPrebidAdUnitMediaTypes } from '../../../../inject/scripts/prebid';
import Chip from '@mui/material/Chip';
import ReactJson from 'react-json-view';
import Popover from '@mui/material/Popover';

const MediaTypeChipComponent = ({ input, label }: IMediaTypeChipComponentProps): JSX.Element => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  return (
    <React.Fragment>
      <Chip
        size="small"
        variant="outlined"
        color="primary"
        label={label || JSON.stringify(input)}
        onClick={handlePopoverOpen}
        sx={{ maxWidth: 200 }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <ReactJson
          src={input}
          name={false}
          collapsed={false}
          enableClipboard={false}
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
}

export default MediaTypeChipComponent;
