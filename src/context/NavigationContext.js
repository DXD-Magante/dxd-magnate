// Create a NavigationContext.js
import { createContext, useContext, useState } from 'react';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [activeSubsection, setActiveSubsection] = useState('');

  return (
    <NavigationContext.Provider value={{ activeSubsection, setActiveSubsection }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);