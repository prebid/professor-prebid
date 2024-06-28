import React, { useContext } from 'react';
import { IPrebidBidWonEventData, IPrebidBid, IPrebidBidRequestedEventData } from '../../../../Injected/prebid';
import StateContext from '../../../contexts/appStateContext';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import JSONViewerComponent from '../../JSONViewerComponent';
import Popover from '@mui/material/Popover';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import PictureInPictureOutlinedIcon from '@mui/icons-material/PictureInPictureOutlined';

const BidChipComponent = ({ input, label, isWinner, bidReceived, bidRequested, isRendered }: IBidChipComponentProps): JSX.Element => {
  const { topics } = useContext(StateContext);
  const [popUpOpen, setPopUpOpen] = React.useState<boolean>(false);

  return (
    <React.Fragment>
      <Chip
        size="small"
        variant="outlined"
        color={popUpOpen ? 'success' : isWinner ? 'secondary' : bidReceived ? 'primary' : 'default'}
        icon={
          <Stack direction="row" spacing={1}>
            {isWinner && <GavelOutlinedIcon sx={{ height: '14px' }} />}
            {isRendered && <PictureInPictureOutlinedIcon sx={{ height: '14px' }} />}
          </Stack>
        }
        label={label}
        onClick={() => setPopUpOpen(true)}
      />
      <Popover
        open={popUpOpen}
        anchorReference="anchorPosition"
        anchorPosition={{ top: 1, left: 1 }}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClose={() => setPopUpOpen(false)}
      >
        <JSONViewerComponent
          src={{ input: input, bidderRequest: bidRequested, bidResponse: bidReceived || 'noBid', topics }}
          name={false}
          collapsed={3}
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
  bidRequested: IPrebidBidRequestedEventData | undefined;
  bidReceived: IPrebidBidWonEventData | undefined;
  isRendered: boolean;
}

export default BidChipComponent;
