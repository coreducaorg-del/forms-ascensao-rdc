"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Resposta } from "@/lib/database.types";
import type { AcessoAula } from "@/lib/database.types";

type Aba = "acessos" | "urgencia";

// ── Score (mesma lógica do painel principal) ──────────────────────────────────

function calculateScore(r: Resposta): number {
  let score = 0;

  // Interesse — 30 pts
  if (r.interesse_curso_completo === "Sim, com certeza") score += 30;
  else if (r.interesse_curso_completo === "Talvez, dependendo do valor") score += 20;

  // Renda — 30 pts
  const rendaAlta = ["Entre R$ 3.001 e R$ 4.000","Entre R$ 4.001 e R$ 5.000","Entre R$ 5.001 e R$ 10.000","Entre R$ 10.001 e R$ 20.000","Mais de R$ 20.001"];
  const rendaMedia = ["Entre R$ 1.001 e R$ 2.000","Entre R$ 2.001 e R$ 3.000"];
  if (r.faixa_renda && rendaAlta.includes(r.faixa_renda)) score += 30;
  else if (r.faixa_renda && rendaMedia.includes(r.faixa_renda)) score += 20;
  else if (r.faixa_renda === "Menos de R$ 1.000" || r.faixa_renda === "Sem Renda") score += 5;

  // Prioridade coreano — 20 pts
  const p = Number(r.prioridade_coreano ?? 0);
  if (p >= 9) score += 20;
  else if (p >= 7) score += 15;
  else if (p >= 5) score += 8;
  else if (p >= 3) score += 3;

  // Faixa etária — 10 pts
  const idadeAlta = ["25-34","35-44","45-54","55-65","+65"];
  if (r.faixa_etaria && idadeAlta.includes(r.faixa_etaria)) score += 10;
  else if (r.faixa_etaria === "18-24") score += 6;
  else if (r.faixa_etaria === "13-17") score += 2;

  // Escolaridade — 10 pts
  const escolaridadeAlta = ["Ensino Superior Completo","Mestrado ou Doutorado Completo","Ensino Médio Completo"];
  if (r.escolaridade && escolaridadeAlta.includes(r.escolaridade)) score += 10;
  else if (r.escolaridade === "Ensino Fundamental Completo") score += 5;

  return score;
}

function corScoreHex(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface AlunaAcesso {
  acesso: AcessoAula;
  resposta: Resposta | null;
  score: number;
  dias_restantes: number;
}

function formatarTempo(segundos: number | null): string {
  if (!segundos || segundos === 0) return "Ainda não assistiu";
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  if (h > 0) return `${h}h ${m}min ${s}s`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

function formatarUltimoAcesso(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso)).replace(",", " às");
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

      {mostrarWhatsapp && expandido && (
        <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-[#2a2a2a]">
          <span className="text-sm text-white">{aluna.acesso.email}</span>
          {whatsapp && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-400">{whatsapp}</span>
              <WhatsappPill whatsapp={whatsapp} copiado={copiado} onCopiar={onCopiar} />
            </div>
          )}
          <p className={`text-xs mt-1 ${aluna.acesso.tempo_maximo_assistido ? "text-white" : "text-[#888888]"}`}>
            ⏱️ Assistiu até: {formatarTempo(aluna.acesso.tempo_maximo_assistido)}
          </p>
          <p className="text-xs text-[#888888]">
            🕐 Último acesso: {formatarUltimoAcesso(aluna.acesso.ultimo_acesso)}
          </p>
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
    try {
      const response = await fetch("/api/admin/acessos");
      const result = await response.json();

      if (!result.success) {
        console.error("Erro ao buscar acessos:", result.error);
        setCarregando(false);
        return;
      }

      const agora = new Date();

      type AcessoCombinado = AcessoAula & Partial<Resposta>;

      const resultado: AlunaAcesso[] = (result.data as AcessoCombinado[] ?? []).map((item) => {
        const acesso: AcessoAula = {
          id: item.id,
          email: item.email,
          primeiro_acesso: item.primeiro_acesso,
          data_expiracao: item.data_expiracao,
          total_acessos: item.total_acessos,
          ultimo_acesso: item.ultimo_acesso,
          tempo_maximo_assistido: item.tempo_maximo_assistido ?? null,
        };

        const resposta: Resposta | null = item.nome_completo
          ? {
              email: item.email,
              nome_completo: item.nome_completo,
              whatsapp: item.whatsapp,
              interesse_curso_completo: item.interesse_curso_completo,
              faixa_renda: item.faixa_renda,
              escolaridade: item.escolaridade,
              faixa_etaria: item.faixa_etaria,
              prioridade_coreano: item.prioridade_coreano,
            } as Resposta
          : null;

        const score = resposta ? calculateScore(resposta) : 0;
        const expiracao = new Date(acesso.data_expiracao ?? agora);
        const diffMs = expiracao.getTime() - agora.getTime();
        const dias_restantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return { acesso, resposta, score, dias_restantes };
      });

      setAlunas(resultado);
    } catch (error) {
      console.error("Erro ao buscar acessos:", error);
    } finally {
      setCarregando(false);
    }
  }

  function copiarWhatsapp(id: string, numero: string) {
    const ultimos4 = (numero || "").replace(/\D/g, "").slice(-4);
    navigator.clipboard.writeText(ultimos4);
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
      if (filtroScore === "media" && (a.score < 50 || a.score > 74)) return false;
      if (filtroScore === "baixa" && a.score >= 50) return false;
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
            <option value="alta">BOM (75-100)</option>
            <option value="media">ANALISAR (50-74)</option>
            <option value="baixa">DESCARTE (0-49)</option>
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
                <p className="text-sm text-[#888888] mb-1">
                  <span className="text-white font-medium">{alunasFiltradas.length}</span> alunas acessaram o Aulão
                </p>
                {alunasFiltradas.length === 0 ? (
                  <p className="text-sm text-center mt-8" style={{ color: "#888888" }}>Nenhum resultado encontrado.</p>
                ) : (
                  alunasFiltradas.map((aluna) => (
                    <CardAcesso
                      key={aluna.acesso.id}
                      aluna={aluna}
                      copiado={copiado === aluna.acesso.id}
                      onCopiar={() => copiarWhatsapp(aluna.acesso.id, aluna.resposta?.whatsapp ?? "")}
                      expandido={expandido === aluna.acesso.id}
                      onToggle={() => toggleExpandido(aluna.acesso.id)}
                      mostrarWhatsapp
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
