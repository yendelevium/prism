"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface EnvironmentContextType {
  variables: Record<string, string>;
  setVariables: (variables: Record<string, string>) => void;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(
  undefined,
);

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [variables, setVariables] = useState<Record<string, string>>({});

  return (
    <EnvironmentContext.Provider value={{ variables, setVariables }}>
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (context === undefined) {
    throw new Error(
      "useEnvironment must be used within an EnvironmentProvider",
    );
  }
  return context;
}
