"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { createLocalKidsExplorationRepository, type KidsExplorationRepository } from "@/lib/kids/exploration-storage";

const KidsExplorationRepositoryContext = createContext<KidsExplorationRepository | null>(null);

export function KidsExplorationProvider({ children }: { children: ReactNode }) {
  const repository = useMemo(
    () => createLocalKidsExplorationRepository(() => window.localStorage),
    [],
  );
  return <KidsExplorationRepositoryContext.Provider value={repository}>{children}</KidsExplorationRepositoryContext.Provider>;
}

export function useKidsExplorationRepository(): KidsExplorationRepository {
  const repository = useContext(KidsExplorationRepositoryContext);
  if (!repository) throw new Error("useKidsExplorationRepository 必须在 KidsExplorationProvider 内使用");
  return repository;
}
