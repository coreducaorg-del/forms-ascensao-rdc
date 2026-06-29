"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const USUARIOS_VALIDOS = [
  { email: "vitorchei.negocios@gmail.com", senha: "rdc@2025" },
  { email: "coreduca.org@gmail.com", senha: "rdc@2025" },
];

export default function AdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const usuarioValido = USUARIOS_VALIDOS.some(
      (u) => u.email === email.trim() && u.senha === senha
    );

    if (!usuarioValido) {
      setErro("Email ou senha incorretos.");
      return;
    }

    sessionStorage.setItem("admin_autenticado", "true");
    router.push("/admin/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6"
      >
        <h1 className="text-xl font-bold text-white mb-6">Painel Administrativo</h1>

        {erro && (
          <div className="mb-4 p-3 rounded-lg bg-red-950 border border-red-800 text-red-400 text-sm">
            {erro}
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-white">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#3574b5]"
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-white">Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#3574b5]"
          />
        </div>

        <button
          type="submit"
          className="w-full px-5 py-2 rounded-lg bg-[#3574b5] text-white font-medium hover:bg-[#2a5c92]"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
