import React from 'react';
import { IPrebidBidWonEventData, IPrebidBid } from '../../../../inject/scripts/prebid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import ReactJson, { OnCopyProps } from 'react-json-view';
import Popover from '@mui/material/Popover';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import PictureInPictureOutlinedIcon from '@mui/icons-material/PictureInPictureOutlined';

const BidChipComponent = ({ input, label, isWinner, bidReceived, isRendered }: IBidChipComponentProps): JSX.Element => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (typeof input === 'object') {
      setAnchorEl(event.currentTarget);
    }
  };
  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handleCopy = (copy: OnCopyProps) => {
    navigator.clipboard.writeText(JSON.stringify(copy.src, null, '\t'));
  };

  const open = Boolean(anchorEl);
  return (
    <React.Fragment>
      <Chip
        size="small"
        variant="outlined"
        color={isWinner ? 'secondary' : bidReceived ? 'primary' : 'default'}
        icon={
          <Stack direction="row" spacing={1}>
            {isWinner && <GavelOutlinedIcon sx={{ height: '14px' }} />}
            {isRendered && <PictureInPictureOutlinedIcon sx={{ height: '14px' }} />}
          </Stack>
        }
        label={label}
        onClick={handlePopoverOpen}
      />
      <Popover
        id="mouse-over-popover"
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <ReactJson
          src={{ input: input, bidResponse: bidReceived || 'noBid' }}
          name={false}
          collapsed={2}
          enableClipboard={handleCopy}
          displayObjectSize={false}
          displayDataTypes={false}
          sortKeys={false}
          quotesOnKeys={false}
          indentWidth={2}
          collapseStringsAfterLength={100}
          style={{ fontSize: '12px', fontFamily: 'roboto', padding: '15px' }}
        />
      </Popover>
    </React.Fragment>
  );
};
interface IBidChipComponentProps {
  input: IPrebidBid;
  label: string;
  isWinner: boolean;
  bidReceived: IPrebidBidWonEventData | undefined;
  isRendered: boolean;
}

export default BidChipComponent;
