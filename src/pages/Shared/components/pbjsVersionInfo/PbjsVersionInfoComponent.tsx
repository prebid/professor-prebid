import React from 'react';
import Box from '@mui/material/Box';
import PbjsVersionInfoContent from './PbjsVersionInfoContent';

export interface PbjsVersionInfoComponentProps {
  close?: () => void;
}

export const PbjsVersionInfoComponent: React.FC<PbjsVersionInfoComponentProps> = ({ close }): JSX.Element => {
  return (
    <Box sx={{ width: '100%' }}>
      <PbjsVersionInfoContent close={close} />
    </Box>
  );
};

export default PbjsVersionInfoComponent;
