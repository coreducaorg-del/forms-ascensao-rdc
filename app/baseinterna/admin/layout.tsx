import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel Admin B.I",
};

export default function BaseInternaAdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
