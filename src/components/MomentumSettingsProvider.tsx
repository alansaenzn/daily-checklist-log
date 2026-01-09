"use client";

import React from "react";

type MomentumSettingsContextValue = {
  momentumThreshold: number;
  setMomentumThreshold: (next: number) => void;
};

const MomentumSettingsContext =
  React.createContext<MomentumSettingsContextValue | null>(null);

export function MomentumSettingsProvider({
  initialMomentumThreshold,
  children,
}: {
  initialMomentumThreshold: number;
  children: React.ReactNode;
}) {
  const [momentumThreshold, setMomentumThreshold] = React.useState(
    initialMomentumThreshold
  );

  const value = React.useMemo(
    () => ({ momentumThreshold, setMomentumThreshold }),
    [momentumThreshold]
  );

  return (
    <MomentumSettingsContext.Provider value={value}>
      {children}
    </MomentumSettingsContext.Provider>
  );
}

export function useMomentumSettings(): MomentumSettingsContextValue {
  const ctx = React.useContext(MomentumSettingsContext);
  if (!ctx) {
    throw new Error(
      "useMomentumSettings must be used within MomentumSettingsProvider"
    );
  }
  return ctx;
}
