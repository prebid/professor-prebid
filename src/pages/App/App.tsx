import React, { useEffect } from 'react';
import logger from '../../logger';
import './App.scss';
import { appHandler } from './appHandler';

interface AppData {}

const App: React.FC = () => {
  useEffect(() => {
    logger.log('[App] waiting for data from background');
    appHandler.getDataFromBackground((data: AppData) => {
      logger.log('[App] received data from background', data);
      // TODO -> do something with the data
    });
  }, []);

  return <div>Professor Prebid App</div>;
};

export default App;
