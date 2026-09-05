import type { ReactNode } from "react";

import { KidsAuthProvider } from "@/components/kids-auth-provider";

export default function KidsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <KidsAuthProvider>{children}</KidsAuthProvider>;
}
