import React from 'react';
import { IPrebidAdUnitMediaTypes } from '../../../../Injected/prebid';
import Chip from '@mui/material/Chip';
import JSONViewerComponent from '../../JSONViewerComponent';
import Popover from '@mui/material/Popover';

const Ortb2ImpExtChipComponent = ({ input, label }: Ortb2ImpExtChipComponentProps): JSX.Element => {
  const [popUpOpen, setPopUpOpen] = React.useState<boolean>(false);

  return (
    <React.Fragment>
      <Chip
        size="small"
        variant="outlined"
        color={popUpOpen ? 'success' : 'primary'}
        label={label}
        onClick={() => setPopUpOpen(true)}
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
      <Popover open={popUpOpen} anchorReference="anchorPosition" anchorPosition={{ top: 1, left: 1 }} anchorOrigin={{ vertical: 'top', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} onClose={() => setPopUpOpen(false)}>
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

interface Ortb2ImpExtChipComponentProps {
  input: IPrebidAdUnitMediaTypes[keyof IPrebidAdUnitMediaTypes];
  label: string;
}

export default Ortb2ImpExtChipComponent;
