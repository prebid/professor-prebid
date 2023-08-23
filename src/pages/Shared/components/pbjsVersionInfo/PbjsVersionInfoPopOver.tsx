import React, { useContext } from 'react';
import Popover from '@mui/material/Popover';
import StateContext from '../../contexts/appStateContext';
import PbjsVersionInfoComponent from './PbjsVersionInfoComponent';

const PbjsVersionInfoPopOver = ({
  pbjsVersionPopUpOpen,
  setPbjsVersionPopUpOpen,
}: {
  pbjsVersionPopUpOpen: boolean;
  setPbjsVersionPopUpOpen: Function;
}): JSX.Element => {
  const { prebid } = useContext(StateContext);
  if (!prebid) return null;
  return (
    <Popover
      open={pbjsVersionPopUpOpen}
      anchorReference="anchorPosition"
      anchorPosition={{ top: 1, left: 1 }}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      onClose={() => setPbjsVersionPopUpOpen(false)}
      PaperProps={{ style: { width: '100%', padding: 1 } }}
    >
      <PbjsVersionInfoComponent close={() => setPbjsVersionPopUpOpen(false)} />
    </Popover>
  );
};

export default PbjsVersionInfoPopOver;
