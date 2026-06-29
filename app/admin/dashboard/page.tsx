"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";
import type { Resposta } from "@/lib/database.types";

type Aba = "alunas" | "respostas" | "analise";

const CORES_GRAFICO = [
  "#3574b5",
  "#ff5252",
  "#34d399",
  "#fbbf24",
  "#a78bfa",
  "#f472b6",
  "#60a5fa",
  "#f87171",
  "#4ade80",
  "#facc15",
];

const PERGUNTAS_MULTIPLA_ESCOLHA: { campo: keyof Resposta; label: string }[] = [
  { campo: "nivel_coreano", label: "Nível de coreano" },
  { campo: "faixa_etaria", label: "Faixa etária" },
  { campo: "estado_civil", label: "Estado civil" },
  { campo: "tem_filhos", label: "Tem filhos?" },
  { campo: "tem_netos", label: "Tem netos?" },
  { campo: "escolaridade", label: "Escolaridade" },
  { campo: "momento_profissional", label: "Momento profissional" },
  { campo: "faixa_renda", label: "Faixa de renda" },
  { campo: "tempo_dedicacao", label: "Tempo de dedicação" },
  { campo: "interesse_curso_completo", label: "Interesse no curso completo" },
];

const PERGUNTAS_ABERTAS: { campo: keyof Resposta; label: string }[] = [
  { campo: "coreano_no_dia_a_dia", label: "Como o coreano faz parte do dia a dia" },
  { campo: "motivacao", label: "Motivação para aprender coreano" },
  { campo: "maior_dificuldade", label: "Maior dificuldade" },
  { campo: "tentou_antes", label: "Já tentou aprender antes" },
  { campo: "o_que_faria_investir", label: "O que faria investir mais" },
];

function calculateScore(resposta: Resposta): number {
  let score = 0;

  switch (resposta.interesse_curso_completo) {
    case "Sim, com certeza":
      score += 40;
      break;
    case "Talvez, dependendo do valor":
      score += 30;
      break;
    default:
      score += 0;
  }

  const rendaAlta = [
    "Entre R$ 3.001 e R$ 4.000",
    "Entre R$ 4.001 e R$ 5.000",
    "Entre R$ 5.001 e R$ 10.000",
    "Entre R$ 10.001 e R$ 20.000",
    "Mais de R$ 20.001",
  ];
  const rendaMedia = ["Entre R$ 1.001 e R$ 2.000", "Entre R$ 2.001 e R$ 3.000"];

  if (resposta.faixa_renda && rendaAlta.includes(resposta.faixa_renda)) {
    score += 30;
  } else if (resposta.faixa_renda && rendaMedia.includes(resposta.faixa_renda)) {
    score += 20;
  } else if (resposta.faixa_renda === "Menos de R$ 1.000") {
    score += 5;
  }

  const escolaridadeAlta = [
    "Ensino Superior Completo",
    "Mestrado ou Doutorado Completo",
    "Ensino Médio Completo",
  ];

  if (resposta.escolaridade && escolaridadeAlta.includes(resposta.escolaridade)) {
    score += 15;
  } else if (resposta.escolaridade === "Ensino Fundamental Completo") {
    score += 5;
  }

  const idadeAlta = ["25-34", "35-44", "45-54", "55-65", "+65"];

  if (resposta.faixa_etaria && idadeAlta.includes(resposta.faixa_etaria)) {
    score += 15;
  } else if (resposta.faixa_etaria === "18-24") {
    score += 10;
  } else if (resposta.faixa_etaria === "13-17") {
    score += 5;
  }

  return score;
}

function corScore(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function formatarData(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function IconAlunas() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconRespostas() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  );
}

function IconAnalise() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 ${className}`}>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [autenticado, setAutenticado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [aba, setAba] = useState<Aba>("alunas");
  const [busca, setBusca] = useState("");
  const [selecionada, setSelecionada] = useState<Resposta | null>(null);
  const [investirExpandido, setInvestirExpandido] = useState<string | null>(null);

  useEffect(() => {
    const ok = sessionStorage.getItem("admin_autenticado") === "true";
    if (!ok) {
      router.push("/admin");
      return;
    }
    setAutenticado(true);
  }, [router]);

  useEffect(() => {
    if (!autenticado) return;

    async function carregar() {
      const { data } = await supabase
        .from("respostas")
        .select("*")
        .order("criado_em", { ascending: false });

      setRespostas(data ?? []);
      setCarregando(false);
    }

    carregar();
  }, [autenticado]);

  const respostasFiltradas = useMemo(() => {
    if (!busca.trim()) return respostas;
    return respostas.filter((r) =>
      r.nome_completo.toLowerCase().includes(busca.toLowerCase())
    );
  }, [respostas, busca]);

  const ranking = useMemo(
    () =>
      [...respostas]
        .map((r) => ({ resposta: r, score: calculateScore(r) }))
        .sort((a, b) => b.score - a.score),
    [respostas]
  );

  if (!autenticado || carregando) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-[#888888]">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {aba === "alunas" && (
          <div>
            <h1 className="text-xl font-bold mb-1">
              {respostas.length} alunas cadastradas
            </h1>
            <p className="text-[#888888] text-sm mb-4">Lista de respostas recebidas</p>

            <input
              type="text"
              placeholder="Buscar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white mb-4 focus:outline-none focus:border-[#3574b5]"
            />

            <div className="flex flex-col gap-3">
              {respostasFiltradas.map((r) => {
                const score = calculateScore(r);
                return (
                  <Card
                    key={r.id}
                    className="cursor-pointer hover:border-[#3574b5] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setSelecionada(r)}
                      className="w-full text-left"
                    >
                      <p className="font-medium text-white">{r.nome_completo}</p>
                      <p className="text-sm text-[#888888] mb-2">
                        {formatarData(r.criado_em)}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${corScore(score)}`} />
                        <span className="text-sm text-white">Score: {score}/100</span>
                      </div>
                    </button>
                  </Card>
                );
              })}

              {respostasFiltradas.length === 0 && (
                <p className="text-[#888888] text-sm">Nenhuma aluna encontrada.</p>
              )}
            </div>
          </div>
        )}

        {aba === "respostas" && (
          <div>
            <h1 className="text-xl font-bold mb-4">Respostas</h1>

            <div className="flex flex-col gap-6 mb-8">
              {PERGUNTAS_MULTIPLA_ESCOLHA.map(({ campo, label }) => {
                const contagem = new Map<string, number>();
                respostas.forEach((r) => {
                  const valor = r[campo] as string | null;
                  if (!valor) return;
                  contagem.set(valor, (contagem.get(valor) ?? 0) + 1);
                });
                const dados = Array.from(contagem.entries()).map(([name, value]) => ({
                  name,
                  value,
                }));

                if (dados.length === 0) return null;

                return (
                  <Card key={campo}>
                    <h2 className="font-medium mb-2">{label}</h2>
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dados}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {dados.map((_, index) => (
                              <Cell
                                key={index}
                                fill={CORES_GRAFICO[index % CORES_GRAFICO.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex flex-col gap-6">
              {PERGUNTAS_ABERTAS.map(({ campo, label }) => {
                const itens = respostas.filter((r) => (r[campo] as string | null)?.trim());

                if (itens.length === 0) return null;

                return (
                  <Card key={campo}>
                    <h2 className="font-medium mb-3">{label}</h2>
                    <div className="flex flex-col gap-3">
                      {itens.map((r) => (
                        <div key={r.id} className="border-b border-[#2a2a2a] pb-2 last:border-0 last:pb-0">
                          <p className="text-sm font-medium text-[#3574b5]">{r.nome_completo}</p>
                          <p className="text-sm text-white">{r[campo] as string}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {aba === "analise" && (
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-lg font-bold mb-3">Ranking de Ascensão</h2>
              <div className="flex flex-col gap-3">
                {ranking.map(({ resposta, score }) => (
                  <Card key={resposta.id} className="flex items-center justify-between">
                    <span className="text-white">{resposta.nome_completo}</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${corScore(score)}`} />
                      <span className="text-sm text-white">{score}/100</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-3">Interesse no Curso Completo</h2>
              <div className="flex flex-col gap-3">
                {respostas.map((r) => {
                  const badge =
                    r.interesse_curso_completo === "Sim, com certeza"
                      ? "bg-green-950 text-green-400 border-green-800"
                      : r.interesse_curso_completo === "Talvez, dependendo do valor"
                      ? "bg-yellow-950 text-yellow-400 border-yellow-800"
                      : "bg-red-950 text-red-400 border-red-800";

                  return (
                    <Card key={r.id} className="flex items-center justify-between">
                      <span className="text-white">{r.nome_completo}</span>
                      <span className={`text-xs px-2 py-1 rounded-full border ${badge}`}>
                        {r.interesse_curso_completo ?? "—"}
                      </span>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-3">Renda Mensal</h2>
              <div className="flex flex-col gap-3">
                {respostas.map((r) => (
                  <Card key={r.id} className="flex items-center justify-between">
                    <span className="text-white">{r.nome_completo}</span>
                    <span className="text-sm text-[#3574b5]">{r.faixa_renda ?? "—"}</span>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-3">O que faria investir mais</h2>
              <div className="flex flex-col gap-3">
                {respostas.map((r) => {
                  const expandido = investirExpandido === r.id;
                  return (
                    <Card key={r.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setInvestirExpandido(expandido ? null : r.id)
                        }
                        className="w-full text-left flex items-center justify-between"
                      >
                        <span className="text-white">{r.nome_completo}</span>
                        <span className="text-[#888888] text-sm">
                          {expandido ? "Ocultar" : "Ver resposta"}
                        </span>
                      </button>
                      {expandido && (
                        <p className="mt-3 text-sm text-white border-t border-[#2a2a2a] pt-3">
                          {r.o_que_faria_investir || "Sem resposta."}
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {selecionada && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50"
          onClick={() => setSelecionada(null)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{selecionada.nome_completo}</h2>
              <button
                type="button"
                onClick={() => setSelecionada(null)}
                className="text-[#888888] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-5 text-sm">
              <div>
                <h3 className="text-[#3574b5] font-medium mb-2">Dados Pessoais</h3>
                <p className="text-[#888888]">Nome: <span className="text-white">{selecionada.nome_completo}</span></p>
                <p className="text-[#888888]">WhatsApp: <span className="text-white">{selecionada.whatsapp}</span></p>
                <p className="text-[#888888]">Email: <span className="text-white">{selecionada.email}</span></p>
              </div>

              <div>
                <h3 className="text-[#3574b5] font-medium mb-2">Sobre o Idioma</h3>
                <p className="text-[#888888]">Nível: <span className="text-white">{selecionada.nivel_coreano}</span></p>
                <p className="text-[#888888]">Dia a dia: <span className="text-white">{selecionada.coreano_no_dia_a_dia || "—"}</span></p>
                <p className="text-[#888888]">Motivação: <span className="text-white">{selecionada.motivacao || "—"}</span></p>
                <p className="text-[#888888]">Dificuldade: <span className="text-white">{selecionada.maior_dificuldade || "—"}</span></p>
                <p className="text-[#888888]">Tentou antes: <span className="text-white">{selecionada.tentou_antes || "—"}</span></p>
              </div>

              <div>
                <h3 className="text-[#3574b5] font-medium mb-2">Dados Demográficos</h3>
                <p className="text-[#888888]">Faixa etária: <span className="text-white">{selecionada.faixa_etaria || "—"}</span></p>
                <p className="text-[#888888]">Estado civil: <span className="text-white">{selecionada.estado_civil || "—"}{selecionada.estado_civil_outro ? ` (${selecionada.estado_civil_outro})` : ""}</span></p>
                <p className="text-[#888888]">Filhos: <span className="text-white">{selecionada.tem_filhos || "—"}{selecionada.quantidade_filhos ? ` (${selecionada.quantidade_filhos})` : ""}</span></p>
                <p className="text-[#888888]">Netos: <span className="text-white">{selecionada.tem_netos || "—"}{selecionada.quantidade_netos ? ` (${selecionada.quantidade_netos})` : ""}</span></p>
                <p className="text-[#888888]">Escolaridade: <span className="text-white">{selecionada.escolaridade || "—"}{selecionada.area_formacao ? ` (${selecionada.area_formacao})` : ""}</span></p>
                <p className="text-[#888888]">Profissão: <span className="text-white">{selecionada.momento_profissional || "—"}</span></p>
                <p className="text-[#888888]">Renda: <span className="text-white">{selecionada.faixa_renda || "—"}</span></p>
              </div>

              <div>
                <h3 className="text-[#3574b5] font-medium mb-2">Prontidão</h3>
                <p className="text-[#888888]">Tempo de dedicação: <span className="text-white">{selecionada.tempo_dedicacao || "—"}</span></p>
                <p className="text-[#888888]">Interesse no curso completo: <span className="text-white">{selecionada.interesse_curso_completo || "—"}</span></p>
                <p className="text-[#888888]">O que faria investir: <span className="text-white">{selecionada.o_que_faria_investir || "—"}</span></p>
              </div>

              <div className="flex items-center gap-2 border-t border-[#2a2a2a] pt-4">
                <span className={`w-2.5 h-2.5 rounded-full ${corScore(calculateScore(selecionada))}`} />
                <span className="text-white">Score: {calculateScore(selecionada)}/100</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 bg-[#1a1a1a] border-t border-[#2a2a2a] flex justify-around py-2">
        <button
          type="button"
          onClick={() => setAba("alunas")}
          className={`flex flex-col items-center gap-1 px-4 py-1 ${
            aba === "alunas" ? "text-[#3574b5]" : "text-[#888888]"
          }`}
        >
          <IconAlunas />
          <span className="text-xs">Alunas</span>
        </button>
        <button
          type="button"
          onClick={() => setAba("respostas")}
          className={`flex flex-col items-center gap-1 px-4 py-1 ${
            aba === "respostas" ? "text-[#3574b5]" : "text-[#888888]"
          }`}
        >
          <IconRespostas />
          <span className="text-xs">Respostas</span>
        </button>
        <button
          type="button"
          onClick={() => setAba("analise")}
          className={`flex flex-col items-center gap-1 px-4 py-1 ${
            aba === "analise" ? "text-[#3574b5]" : "text-[#888888]"
          }`}
        >
          <IconAnalise />
          <span className="text-xs">Análise</span>
        </button>
      </nav>
    </main>
  );
}
