import type { ReactNode } from "react";

import { KidsAuthProvider } from "@/components/kids-auth-provider";
import { KidsExplorationProvider } from "@/components/kids-exploration-provider";

export default function KidsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <KidsAuthProvider>
      <KidsExplorationProvider>{children}</KidsExplorationProvider>
    </KidsAuthProvider>
  );
}
