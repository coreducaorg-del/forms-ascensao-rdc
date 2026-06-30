"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const gridBackground = {
  backgroundColor: "#ffffff",
  backgroundImage:
    "linear-gradient(rgba(224, 224, 224, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(224, 224, 224, 0.4) 1px, transparent 1px)",
  backgroundSize: "32px 32px",
};

export default function BaseInternaLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleAcessar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    const emailNormalizado = email.trim().toLowerCase();
    if (!emailNormalizado) {
      setErro("Digite seu e-mail para continuar.");
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch("/api/baseinterna/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailNormalizado }),
      });

      const result = await response.json();

      if (result.success) {
        sessionStorage.setItem("email_aulao", result.email);
        router.push("/baseinterna/aula");
        return;
      }

      setErro(result.error || "Ocorreu um erro. Tente novamente em alguns instantes.");
      setCarregando(false);
    } catch {
      setErro("Ocorreu um erro. Tente novamente em alguns instantes.");
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={gridBackground}>
      <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-[#3574b5] mb-3">Acesse o seu Aulão</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Digite o e-mail que você cadastrou no formulário para liberar seu acesso.
        </p>

        {erro && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-[#ff5252] text-sm">
            {erro}
          </div>
        )}

        <form onSubmit={handleAcessar} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[#1a1a1a] focus:outline-none focus:border-[#3574b5]"
          />
          <button
            type="submit"
            disabled={carregando}
            className="w-full px-5 py-3 rounded-xl bg-[#3574b5] text-white font-medium hover:bg-[#2a5c92] disabled:opacity-50 transition-colors"
          >
            {carregando ? "Verificando..." : "Acessar"}
          </button>
        </form>
      </div>
    </main>
  );
}
