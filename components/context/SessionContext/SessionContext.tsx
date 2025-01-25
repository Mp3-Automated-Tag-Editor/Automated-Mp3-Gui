import React, { createContext, useContext, ReactNode } from "react";

// Define the shape of the context value
interface SessionContextType {
  sessionData: any;
  sessionName: string;
}

// Create a default value for the context (this is the type)
const defaultContextValue: SessionContextType = {
  sessionData: {},
  sessionName: "",
};

const SessionContext = createContext<SessionContextType>(defaultContextValue);

interface SessionProviderProps {
  children: ReactNode;
  sessionData: any;
  sessionName: string;
}

// Provide the context with values
export const SessionProvider = ({ children, sessionData, sessionName }: SessionProviderProps) => (
  <SessionContext.Provider value={{ sessionData, sessionName }}>
    {children}
  </SessionContext.Provider>
);

// Custom hook to use session data
export const useSessionContext = () => useContext(SessionContext);
