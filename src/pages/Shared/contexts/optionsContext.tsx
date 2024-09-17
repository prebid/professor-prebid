import React, { createContext, useEffect, useState } from 'react';
import { PAGES } from '../constants';

const OptionsContext = createContext<IOptionsContext | undefined>(undefined);

interface ChromeStorageProviderProps {
  children: React.ReactNode;
}
export const OptionsContextProvider = ({ children }: ChromeStorageProviderProps) => {
  const [selectedPopUpNavItems, setSelectedPopUpNavItems] = useState<string[]>([]);
  const [selectedPanelNavItems, setSelectedPanelNavItems] = useState<string[]>([]);

  useEffect(() => {
    chrome.storage.sync.get(['selectedPopUpNavItems'], (result) => {
      if (result.selectedPopUpNavItems) {
        setSelectedPopUpNavItems(result.selectedPopUpNavItems);
      } else {
        setSelectedPopUpNavItems(PAGES.filter(({ beta }) => !beta).map((page) => page.path));
      }
    });
    chrome.storage.sync.get(['selectedPanelNavItems'], (result) => {
      if (result.selectedPanelNavItems) {
        setSelectedPanelNavItems(result.selectedPanelNavItems);
      } else {
        setSelectedPanelNavItems(PAGES.map((page) => page.path));
      }
    });
  }, []);

  const contextValue: IOptionsContext = {
    selectedPopUpNavItems,
    setSelectedPopUpNavItems,
    selectedPanelNavItems,
    setSelectedPanelNavItems,
  };

  return <OptionsContext.Provider value={contextValue}>{children}</OptionsContext.Provider>;
};

export default OptionsContext;

export interface IOptionsContext {
  selectedPopUpNavItems: string[];
  setSelectedPopUpNavItems: React.Dispatch<React.SetStateAction<string[]>>;
  selectedPanelNavItems: string[];
  setSelectedPanelNavItems: React.Dispatch<React.SetStateAction<string[]>>;
}
