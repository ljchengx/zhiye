import type { Metadata } from "next";

import { KidsLogin } from "@/components/kids-login";

export const metadata: Metadata = {
  title: "登录橙子小朋友 | 一程一成长",
  robots: { index: false, follow: false },
};

export default function KidsLoginPage() {
  return <KidsLogin />;
}
