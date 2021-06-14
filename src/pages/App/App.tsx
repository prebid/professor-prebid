import React, { useEffect } from 'react';
import logger from '../../logger';
import './App.scss';
import { appHandler } from './appHandler';

interface AppData {}

const App: React.FC = () => {
  useEffect(() => {
    logger.log('waiting for data from background');
    appHandler.getDataFromBackground((data: AppData) => {
      logger.log('received data from background', data);
        
    });
  }, []);

  return <div>Professor Prebid App</div>;
};

export default App;
