"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Resposta } from "@/lib/database.types";
import type { AcessoAula } from "@/lib/database.types";

type Aba = "acessos" | "urgencia";

// ── Score (mesma lógica do painel principal) ──────────────────────────────────

function pontosInteresse(r: Resposta): number {
  switch (r.interesse_curso_completo) {
    case "Sim, com certeza": return 40;
    case "Talvez, dependendo do valor": return 30;
    default: return 0;
  }
}

function pontosRenda(r: Resposta): number {
  const alta = ["Entre R$ 3.001 e R$ 4.000","Entre R$ 4.001 e R$ 5.000","Entre R$ 5.001 e R$ 10.000","Entre R$ 10.001 e R$ 20.000","Mais de R$ 20.001"];
  const media = ["Entre R$ 1.001 e R$ 2.000","Entre R$ 2.001 e R$ 3.000"];
  if (r.faixa_renda && alta.includes(r.faixa_renda)) return 30;
  if (r.faixa_renda && media.includes(r.faixa_renda)) return 20;
  if (r.faixa_renda === "Menos de R$ 1.000") return 5;
  return 0;
}

function pontosEscolaridade(r: Resposta): number {
  const alta = ["Ensino Superior Completo","Mestrado ou Doutorado Completo","Ensino Médio Completo"];
  if (r.escolaridade && alta.includes(r.escolaridade)) return 15;
  if (r.escolaridade === "Ensino Fundamental Completo") return 5;
  return 0;
}

function pontosIdade(r: Resposta): number {
  const alta = ["25-34","35-44","45-54","55-65","+65"];
  if (r.faixa_etaria && alta.includes(r.faixa_etaria)) return 15;
  if (r.faixa_etaria === "18-24") return 10;
  if (r.faixa_etaria === "13-17") return 5;
  return 0;
}

function calculateScore(r: Resposta): number {
  return pontosInteresse(r) + pontosRenda(r) + pontosEscolaridade(r) + pontosIdade(r);
}

function corScoreHex(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AlunaAcesso {
  acesso: AcessoAula;
  resposta: Resposta | null;
  score: number;
  dias_restantes: number;
}

// ── Componentes ───────────────────────────────────────────────────────────────

function BolhaScore({ score }: { score: number }) {
  return (
    <span
      className="inline-block w-3 h-3 rounded-full shrink-0"
      style={{ backgroundColor: corScoreHex(score) }}
    />
  );
}

function WhatsappPill({
  whatsapp,
  copiado,
  onCopiar,
}: {
  whatsapp: string;
  copiado: boolean;
  onCopiar: () => void;
}) {
  const ultimos4 = whatsapp.replace(/\D/g, "").slice(-4);
  return (
    <button
      type="button"
      onClick={onCopiar}
      className="mt-1 inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[#3574b5] text-[#3574b5] text-xs bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors"
    >
      {copiado ? "copiado!" : `···${ultimos4}`}
    </button>
  );
}

function textosDias(dias: number): string {
  if (dias < 0) return "Expirado";
  if (dias === 0) return "Expira hoje";
  if (dias === 1) return "1 dia restante";
  return `${dias} dias restantes`;
}

function CardAcesso({
  aluna,
  copiado,
  onCopiar,
  expandido,
  onToggle,
  mostrarWhatsapp,
}: {
  aluna: AlunaAcesso;
  copiado: boolean;
  onCopiar: () => void;
  expandido: boolean;
  onToggle: () => void;
  mostrarWhatsapp: boolean;
}) {
  const nome = aluna.resposta?.nome_completo ?? aluna.acesso.email;
  const whatsapp = aluna.resposta?.whatsapp ?? "";

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
      {mostrarWhatsapp ? (
        <button
          type="button"
          onClick={onToggle}
          className="w-full text-left"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-white text-sm">{nome}</span>
            <BolhaScore score={aluna.score} />
          </div>
          <p className="text-xs mt-1" style={{ color: "#888888" }}>
            {textosDias(aluna.dias_restantes)}
          </p>
        </button>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-semibold text-white text-sm">{nome}</span>
            <p className="text-xs mt-1" style={{ color: "#888888" }}>
              {textosDias(aluna.dias_restantes)}
            </p>
          </div>
          <BolhaScore score={aluna.score} />
        </div>
      )}

      {mostrarWhatsapp && expandido && whatsapp && (
        <div className="mt-2">
          <p className="text-xs" style={{ color: "#888888" }}>{whatsapp}</p>
          <WhatsappPill whatsapp={whatsapp} copiado={copiado} onCopiar={onCopiar} />
        </div>
      )}
    </div>
  );
}

function BlocoUrgencia({
  titulo,
  alunas,
  expandido,
  onToggle,
  copiado,
  onCopiar,
}: {
  titulo: string;
  alunas: AlunaAcesso[];
  expandido: string | null;
  onToggle: (id: string) => void;
  copiado: string | null;
  onCopiar: (id: string, numero: string) => void;
}) {
  if (alunas.length === 0) return null;

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-3">
        {titulo} <span className="text-xs font-normal" style={{ color: "#888888" }}>({alunas.length})</span>
      </h3>
      <div className="max-h-72 overflow-y-auto scroll-azul pr-1 space-y-2">
        {alunas.map((aluna) => (
          <CardAcesso
            key={aluna.acesso.id}
            aluna={aluna}
            copiado={copiado === aluna.acesso.id}
            onCopiar={() => onCopiar(aluna.acesso.id, aluna.resposta?.whatsapp ?? "")}
            expandido={expandido === aluna.acesso.id}
            onToggle={() => onToggle(aluna.acesso.id)}
            mostrarWhatsapp
          />
        ))}
      </div>
    </div>
  );
}

// ── Ícones ────────────────────────────────────────────────────────────────────

function IconAcessos() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconUrgencia() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function BaseInternaAdminDashboard() {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("acessos");
  const [alunas, setAlunas] = useState<AlunaAcesso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroScore, setFiltroScore] = useState("todos");
  const [expandido, setExpandido] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("auth_baseinterna") !== "true") {
      router.replace("/baseinterna/admin");
      return;
    }
    carregarDados();
  }, [router]);

  async function carregarDados() {
    const { data: acessos, error: erroAcessos } = await supabase
      .from("acessos_aula")
      .select("*")
      .order("primeiro_acesso", { ascending: false });

    if (erroAcessos || !acessos) {
      setCarregando(false);
      return;
    }

    const emails = acessos.map((a) => a.email);

    const { data: respostas } = await supabase
      .from("respostas")
      .select("email,nome_completo,whatsapp,interesse_curso_completo,faixa_renda,escolaridade,faixa_etaria")
      .in("email", emails);

    const respostasPorEmail: Record<string, Resposta> = {};
    if (respostas) {
      for (const r of respostas) {
        respostasPorEmail[r.email.toLowerCase()] = r as Resposta;
      }
    }

    const agora = new Date();

    const resultado: AlunaAcesso[] = acessos.map((acesso) => {
      const resposta = respostasPorEmail[acesso.email.toLowerCase()] ?? null;
      const score = resposta ? calculateScore(resposta) : 0;
      const expiracao = new Date(acesso.data_expiracao);
      const diffMs = expiracao.getTime() - agora.getTime();
      const dias_restantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { acesso, resposta, score, dias_restantes };
    });

    setAlunas(resultado);
    setCarregando(false);
  }

  function copiarWhatsapp(id: string, numero: string) {
    navigator.clipboard.writeText(numero);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 2000);
  }

  function toggleExpandido(id: string) {
    setExpandido((prev) => (prev === id ? null : id));
  }

  const alunasFiltradas = useMemo(() => {
    return alunas.filter((a) => {
      const nome = (a.resposta?.nome_completo ?? a.acesso.email).toLowerCase();
      if (busca && !nome.includes(busca.toLowerCase())) return false;
      if (filtroScore === "alta" && a.score < 75) return false;
      if (filtroScore === "media" && (a.score < 40 || a.score > 74)) return false;
      if (filtroScore === "baixa" && a.score >= 40) return false;
      return true;
    });
  }, [alunas, busca, filtroScore]);

  const blocos = useMemo(() => ({
    hoje: alunasFiltradas.filter((a) => a.dias_restantes === 0),
    um: alunasFiltradas.filter((a) => a.dias_restantes === 1),
    tres: alunasFiltradas.filter((a) => a.dias_restantes === 3),
    cinco: alunasFiltradas.filter((a) => a.dias_restantes === 5),
  }), [alunasFiltradas]);

  const inputClass =
    "bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#3574b5] w-full";

  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-lg font-bold text-white mb-4">Aulão — Base Interna</h1>

        {/* Filtros */}
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={inputClass}
          />
          <select
            value={filtroScore}
            onChange={(e) => setFiltroScore(e.target.value)}
            className={inputClass}
          >
            <option value="todos">Todos os scores</option>
            <option value="alta">Alta chance (75-100)</option>
            <option value="media">Média chance (40-74)</option>
            <option value="baixa">Baixa chance (0-39)</option>
          </select>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4">
        {carregando ? (
          <p className="text-sm text-center mt-8" style={{ color: "#888888" }}>Carregando...</p>
        ) : (
          <>
            {/* ABA: Acessos */}
            {aba === "acessos" && (
              <div className="space-y-3">
                {alunasFiltradas.length === 0 ? (
                  <p className="text-sm text-center mt-8" style={{ color: "#888888" }}>Nenhum resultado encontrado.</p>
                ) : (
                  alunasFiltradas.map((aluna) => (
                    <CardAcesso
                      key={aluna.acesso.id}
                      aluna={aluna}
                      copiado={false}
                      onCopiar={() => {}}
                      expandido={false}
                      onToggle={() => {}}
                      mostrarWhatsapp={false}
                    />
                  ))
                )}
              </div>
            )}

            {/* ABA: Urgência */}
            {aba === "urgencia" && (
              <div className="space-y-4">
                {blocos.hoje.length === 0 && blocos.um.length === 0 && blocos.tres.length === 0 && blocos.cinco.length === 0 ? (
                  <p className="text-sm text-center mt-8" style={{ color: "#888888" }}>Nenhum acesso em prazo crítico.</p>
                ) : (
                  <>
                    <BlocoUrgencia
                      titulo="Expira Hoje"
                      alunas={blocos.hoje}
                      expandido={expandido}
                      onToggle={toggleExpandido}
                      copiado={copiado}
                      onCopiar={copiarWhatsapp}
                    />
                    <BlocoUrgencia
                      titulo="Expira em 1 dia"
                      alunas={blocos.um}
                      expandido={expandido}
                      onToggle={toggleExpandido}
                      copiado={copiado}
                      onCopiar={copiarWhatsapp}
                    />
                    <BlocoUrgencia
                      titulo="Expira em 3 dias"
                      alunas={blocos.tres}
                      expandido={expandido}
                      onToggle={toggleExpandido}
                      copiado={copiado}
                      onCopiar={copiarWhatsapp}
                    />
                    <BlocoUrgencia
                      titulo="Expira em 5 dias"
                      alunas={blocos.cinco}
                      expandido={expandido}
                      onToggle={toggleExpandido}
                      copiado={copiado}
                      onCopiar={copiarWhatsapp}
                    />
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Nav inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#2a2a2a] flex">
        <button
          type="button"
          onClick={() => setAba("acessos")}
          className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors ${
            aba === "acessos" ? "text-[#3574b5]" : "text-[#555555]"
          }`}
        >
          <IconAcessos />
          Acessos
        </button>
        <button
          type="button"
          onClick={() => setAba("urgencia")}
          className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors ${
            aba === "urgencia" ? "text-[#3574b5]" : "text-[#555555]"
          }`}
        >
          <IconUrgencia />
          Urgência
        </button>
      </nav>
    </main>
  );
}
