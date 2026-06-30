import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Formulário CNH",
};

export default function FormularioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
