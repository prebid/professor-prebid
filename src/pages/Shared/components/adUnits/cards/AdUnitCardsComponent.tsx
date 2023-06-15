import React from 'react';
import Stack from '@mui/material/Stack';
import AdUnitsComponentState from '../AdUnitsComponentState';
import AdUnitCard from './AdUnitCard';

const AdUnitCardsComponent = (): JSX.Element => {
  const { adUnits } = AdUnitsComponentState();

  return (
    <Stack sx={{ backgroundColor: 'primary.light' }}>
      {adUnits.map((adUnit, index) => (
        <AdUnitCard adUnit={adUnit} key={index} />
      ))}
    </Stack>
  );
};

export default AdUnitCardsComponent;
