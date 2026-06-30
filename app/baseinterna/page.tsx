"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

    // PASSO A: verificar se email existe na tabela respostas
    const { data: resposta, error: erroRespostas } = await supabase
      .from("respostas")
      .select("email")
      .ilike("email", emailNormalizado)
      .maybeSingle();

    if (erroRespostas) {
      setErro("Ocorreu um erro. Tente novamente em alguns instantes.");
      setCarregando(false);
      return;
    }

    if (!resposta) {
      setErro("E-mail não encontrado. Verifique se digitou o e-mail correto que você usou no formulário.");
      setCarregando(false);
      return;
    }

    // PASSO B: verificar/criar registro em acessos_aula
    const { data: acesso, error: erroAcesso } = await supabase
      .from("acessos_aula")
      .select("*")
      .eq("email", emailNormalizado)
      .maybeSingle();

    if (erroAcesso) {
      setErro("Ocorreu um erro. Tente novamente em alguns instantes.");
      setCarregando(false);
      return;
    }

    if (!acesso) {
      // Primeiro acesso: criar registro com expiração em 7 dias
      const agora = new Date();
      const expiracao = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);

      const { error: erroInsert } = await supabase.from("acessos_aula").insert([
        {
          email: emailNormalizado,
          primeiro_acesso: agora.toISOString(),
          data_expiracao: expiracao.toISOString(),
          total_acessos: 1,
          ultimo_acesso: agora.toISOString(),
        },
      ]);

      if (erroInsert) {
        setErro("Ocorreu um erro. Tente novamente em alguns instantes.");
        setCarregando(false);
        return;
      }

      sessionStorage.setItem("email_aulao", emailNormalizado);
      router.push("/baseinterna/aula");
      return;
    }

    // Registro existente: verificar prazo
    const agora = new Date();
    const expiracao = new Date(acesso.data_expiracao);

    if (agora > expiracao) {
      setErro("Seu acesso ao Aulão expirou. Entre em contato conosco para mais informações.");
      setCarregando(false);
      return;
    }

    // Dentro do prazo: atualizar ultimo_acesso e total_acessos
    const { error: erroUpdate } = await supabase
      .from("acessos_aula")
      .update({
        ultimo_acesso: agora.toISOString(),
        total_acessos: acesso.total_acessos + 1,
      })
      .eq("email", emailNormalizado);

    if (erroUpdate) {
      setErro("Ocorreu um erro. Tente novamente em alguns instantes.");
      setCarregando(false);
      return;
    }

    sessionStorage.setItem("email_aulao", emailNormalizado);
    router.push("/baseinterna/aula");
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
