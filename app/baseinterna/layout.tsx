import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aulão Coreano B.I",
};

export default function BaseInternaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
