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

type PerguntaResposta =
  | { tipo: "pizza"; campo: keyof Resposta; label: string }
  | { tipo: "lista"; campo: keyof Resposta; label: string };

const PERGUNTAS_RESPOSTAS: PerguntaResposta[] = [
  { tipo: "pizza", campo: "nivel_coreano", label: "Qual seu nível de coreano hoje?" },
  {
    tipo: "lista",
    campo: "coreano_no_dia_a_dia",
    label: "Me conte sobre como o Idioma e a Cultura Coreana faz parte do seu dia a dia",
  },
  { tipo: "lista", campo: "motivacao", label: "Por que você decidiu aprender Coreano?" },
  {
    tipo: "lista",
    campo: "maior_dificuldade",
    label: "Qual é a sua maior dificuldade em aprender o Coreano?",
  },
  {
    tipo: "lista",
    campo: "tentou_antes",
    label: "Você já tentou aprender coreano antes? Se sim, o que aconteceu?",
  },
  { tipo: "pizza", campo: "faixa_etaria", label: "Qual a sua idade?" },
  { tipo: "pizza", campo: "estado_civil", label: "Qual seu estado civil?" },
  { tipo: "pizza", campo: "tem_filhos", label: "Você tem filhos?" },
  { tipo: "pizza", campo: "tem_netos", label: "Você tem netos?" },
  { tipo: "pizza", campo: "escolaridade", label: "Qual é seu Grau de Escolaridade?" },
  { tipo: "pizza", campo: "momento_profissional", label: "Qual é seu momento profissional?" },
  { tipo: "pizza", campo: "faixa_renda", label: "Qual a faixa da sua renda mensal?" },
  { tipo: "pizza", campo: "tempo_dedicacao", label: "Quanto tempo por dia você consegue se dedicar?" },
  {
    tipo: "pizza",
    campo: "interesse_curso_completo",
    label: "Você teria interesse em conhecer um caminho completo?",
  },
  {
    tipo: "lista",
    campo: "o_que_faria_investir",
    label: "O que faria você investir mais para aprender coreano de forma completa?",
  },
];

function pontosInteresse(r: Resposta): number {
  switch (r.interesse_curso_completo) {
    case "Sim, com certeza":
      return 40;
    case "Talvez, dependendo do valor":
      return 30;
    default:
      return 0;
  }
}

function pontosRenda(r: Resposta): number {
  const rendaAlta = [
    "Entre R$ 3.001 e R$ 4.000",
    "Entre R$ 4.001 e R$ 5.000",
    "Entre R$ 5.001 e R$ 10.000",
    "Entre R$ 10.001 e R$ 20.000",
    "Mais de R$ 20.001",
  ];
  const rendaMedia = ["Entre R$ 1.001 e R$ 2.000", "Entre R$ 2.001 e R$ 3.000"];

  if (r.faixa_renda && rendaAlta.includes(r.faixa_renda)) return 30;
  if (r.faixa_renda && rendaMedia.includes(r.faixa_renda)) return 20;
  if (r.faixa_renda === "Menos de R$ 1.000") return 5;
  return 0;
}

function pontosEscolaridade(r: Resposta): number {
  const escolaridadeAlta = [
    "Ensino Superior Completo",
    "Mestrado ou Doutorado Completo",
    "Ensino Médio Completo",
  ];

  if (r.escolaridade && escolaridadeAlta.includes(r.escolaridade)) return 15;
  if (r.escolaridade === "Ensino Fundamental Completo") return 5;
  return 0;
}

function pontosIdade(r: Resposta): number {
  const idadeAlta = ["25-34", "35-44", "45-54", "55-65", "+65"];

  if (r.faixa_etaria && idadeAlta.includes(r.faixa_etaria)) return 15;
  if (r.faixa_etaria === "18-24") return 10;
  if (r.faixa_etaria === "13-17") return 5;
  return 0;
}

function calculateScore(resposta: Resposta): number {
  return (
    pontosInteresse(resposta) +
    pontosRenda(resposta) +
    pontosEscolaridade(resposta) +
    pontosIdade(resposta)
  );
}

function corScore(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

function corScoreHex(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 40) return "#eab308";
  return "#ef4444";
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
    <div className={`bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl ${className}`}>
      {children}
    </div>
  );
}

function FiltroData({
  inicio,
  fim,
  onInicio,
  onFim,
  onLimpar,
}: {
  inicio: string;
  fim: string;
  onInicio: (v: string) => void;
  onFim: (v: string) => void;
  onLimpar: () => void;
}) {
  const inputClasses =
    "bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#3574b5]";

  return (
    <div className="flex flex-wrap items-end gap-2 mb-3">
      <div>
        <label className="block mb-0.5 text-xs text-[#888888]">De:</label>
        <input
          type="date"
          value={inicio}
          onChange={(e) => onInicio(e.target.value)}
          className={inputClasses}
        />
      </div>
      <div>
        <label className="block mb-0.5 text-xs text-[#888888]">Até:</label>
        <input
          type="date"
          value={fim}
          onChange={(e) => onFim(e.target.value)}
          className={inputClasses}
        />
      </div>
      {(inicio || fim) && (
        <button
          type="button"
          onClick={onLimpar}
          className="px-2 py-1 rounded-lg border border-[#2a2a2a] text-xs text-[#888888] hover:text-white hover:border-[#3574b5]"
        >
          Limpar filtro
        </button>
      )}
    </div>
  );
}

function GraficoPizza({
  titulo,
  dados,
}: {
  titulo: string;
  dados: { name: string; value: number }[];
}) {
  if (dados.length === 0) return null;

  return (
    <Card className="p-4">
      <h2 className="font-bold text-white mb-2">{titulo}</h2>
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
              label={(props) => {
                const { x, y, name, value, textAnchor } = props as {
                  x: number;
                  y: number;
                  name: string;
                  value: number;
                  textAnchor: "start" | "middle" | "end";
                };
                return (
                  <text x={x} y={y} fill="#ffffff" textAnchor={textAnchor} fontSize={12}>
                    {name}: {value}
                  </text>
                );
              }}
            >
              {dados.map((_, index) => (
                <Cell key={index} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}
              itemStyle={{ color: "#ffffff" }}
              labelStyle={{ color: "#ffffff" }}
            />
            <Legend wrapperStyle={{ color: "#ffffff" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function ListaRespostas({ titulo, respostas }: { titulo: string; respostas: string[] }) {
  return (
    <Card className="p-4">
      <h2 className="font-bold text-white mb-1">{titulo}</h2>
      <p className="text-sm text-[#888888] mb-3">{respostas.length} respostas</p>
      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto scroll-azul pr-1">
        {respostas.map((resposta, index) => (
          <div key={index} className="bg-[#2a2a2a] text-white text-sm rounded-lg p-3">
            {resposta}
          </div>
        ))}
      </div>
    </Card>
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
  const [rankingExpandido, setRankingExpandido] = useState<string | null>(null);
  const [filtroInicio, setFiltroInicio] = useState("");
  const [filtroFim, setFiltroFim] = useState("");

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

  const respostasComData = useMemo(() => {
    return respostas.filter((r) => {
      const dataResposta = new Date(r.criado_em);
      if (filtroInicio && dataResposta < new Date(`${filtroInicio}T00:00:00`)) return false;
      if (filtroFim && dataResposta > new Date(`${filtroFim}T23:59:59`)) return false;
      return true;
    });
  }, [respostas, filtroInicio, filtroFim]);

  const respostasFiltradas = useMemo(() => {
    if (!busca.trim()) return respostasComData;
    return respostasComData.filter((r) =>
      r.nome_completo.toLowerCase().includes(busca.toLowerCase())
    );
  }, [respostasComData, busca]);

  const ranking = useMemo(
    () =>
      [...respostasComData]
        .map((r) => ({ resposta: r, score: calculateScore(r) }))
        .sort((a, b) => b.score - a.score),
    [respostasComData]
  );

  function limparFiltroData() {
    setFiltroInicio("");
    setFiltroFim("");
  }

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
              {respostasComData.length} alunas cadastradas
            </h1>
            <p className="text-[#888888] text-sm mb-4">Lista de respostas recebidas</p>

            <FiltroData
              inicio={filtroInicio}
              fim={filtroFim}
              onInicio={setFiltroInicio}
              onFim={setFiltroFim}
              onLimpar={limparFiltroData}
            />

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
                    className="relative cursor-pointer hover:border-[#3574b5] transition-colors py-3 px-4"
                  >
                    <button
                      type="button"
                      onClick={() => setSelecionada(r)}
                      className="w-full text-left pr-6"
                    >
                      <p className="font-medium text-white">{r.nome_completo}</p>
                      <p className="text-sm text-[#888888]">{formatarData(r.criado_em)}</p>
                    </button>
                    <span
                      className="absolute top-3 right-4 w-3 h-3 rounded-full"
                      style={{ backgroundColor: corScoreHex(score) }}
                    />
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
            <h1 className="text-xl font-bold text-white mb-4">Respostas</h1>

            <div className="flex flex-col gap-6">
              {PERGUNTAS_RESPOSTAS.map((pergunta) => {
                if (pergunta.tipo === "pizza") {
                  const contagem = new Map<string, number>();
                  respostas.forEach((r) => {
                    const valor = r[pergunta.campo] as string | null;
                    if (!valor) return;
                    contagem.set(valor, (contagem.get(valor) ?? 0) + 1);
                  });
                  const dados = Array.from(contagem.entries()).map(([name, value]) => ({
                    name,
                    value,
                  }));

                  return (
                    <GraficoPizza key={pergunta.campo} titulo={pergunta.label} dados={dados} />
                  );
                }

                const itens = respostas
                  .map((r) => (r[pergunta.campo] as string | null)?.trim())
                  .filter((v): v is string => Boolean(v));

                return (
                  <ListaRespostas key={pergunta.campo} titulo={pergunta.label} respostas={itens} />
                );
              })}
            </div>
          </div>
        )}

        {aba === "analise" && (
          <div className="flex flex-col gap-8">
            <FiltroData
              inicio={filtroInicio}
              fim={filtroFim}
              onInicio={setFiltroInicio}
              onFim={setFiltroFim}
              onLimpar={limparFiltroData}
            />

            <div>
              <h2 className="text-lg font-bold mb-3">Ranking de Ascensão</h2>
              <div className="flex flex-col gap-3 max-h-72 overflow-y-auto scroll-azul pr-1">
                {ranking.map(({ resposta, score }) => {
                  const expandido = rankingExpandido === resposta.id;
                  return (
                    <Card key={resposta.id} className="p-4">
                      <button
                        type="button"
                        onClick={() =>
                          setRankingExpandido(expandido ? null : resposta.id)
                        }
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div>
                          <span className="text-white block">{resposta.nome_completo}</span>
                          <span className="text-xs text-gray-500">
                            {formatarData(resposta.criado_em)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${corScore(score)}`} />
                          <span className="text-sm text-white">{score}/100</span>
                        </div>
                      </button>

                      {expandido && (
                        <div className="mt-3 pt-3 border-t border-[#2a2a2a] flex flex-col gap-2 text-sm text-white">
                          <p className="flex items-center gap-2 flex-wrap">
                            ✦ Interesse no curso: {resposta.interesse_curso_completo || "—"}
                            <span className="border border-[#3574b5] text-[#3574b5] rounded-full px-2 py-0.5 text-xs">
                              {pontosInteresse(resposta)} pontos
                            </span>
                          </p>
                          <p className="flex items-center gap-2 flex-wrap">
                            ✦ Renda mensal: {resposta.faixa_renda || "—"}
                            <span className="border border-[#3574b5] text-[#3574b5] rounded-full px-2 py-0.5 text-xs">
                              {pontosRenda(resposta)} pontos
                            </span>
                          </p>
                          <p className="flex items-center gap-2 flex-wrap">
                            ✦ Escolaridade: {resposta.escolaridade || "—"}
                            <span className="border border-[#3574b5] text-[#3574b5] rounded-full px-2 py-0.5 text-xs">
                              {pontosEscolaridade(resposta)} pontos
                            </span>
                          </p>
                          <p className="flex items-center gap-2 flex-wrap">
                            ✦ Faixa etária: {resposta.faixa_etaria || "—"}
                            <span className="border border-[#3574b5] text-[#3574b5] rounded-full px-2 py-0.5 text-xs">
                              {pontosIdade(resposta)} pontos
                            </span>
                          </p>
                          <p className="flex items-center gap-2 flex-wrap font-medium mt-1">
                            ✦ Total:
                            <span className="border border-[#3574b5] text-[#3574b5] rounded-full px-2 py-0.5 text-xs">
                              {score}/100 pontos
                            </span>
                          </p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-3">Interesse no Curso Completo</h2>
              <div className="flex flex-col gap-3 max-h-72 overflow-y-auto scroll-azul pr-1">
                {respostasComData.map((r) => {
                  const badge =
                    r.interesse_curso_completo === "Sim, com certeza"
                      ? "bg-green-950 text-green-400 border-green-800"
                      : r.interesse_curso_completo === "Talvez, dependendo do valor"
                      ? "bg-yellow-950 text-yellow-400 border-yellow-800"
                      : "bg-red-950 text-red-400 border-red-800";

                  return (
                    <Card key={r.id} className="p-4 flex items-center justify-between">
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
              <div className="flex flex-col gap-3 max-h-72 overflow-y-auto scroll-azul pr-1">
                {respostasComData.map((r) => (
                  <Card key={r.id} className="p-4 flex items-center justify-between">
                    <span className="text-white">{r.nome_completo}</span>
                    <span
                      className="text-xs px-3 py-1 rounded-full border border-[#3574b5] text-[#3574b5]"
                      style={{ backgroundColor: "rgba(53, 116, 181, 0.15)" }}
                    >
                      {r.faixa_renda ?? "—"}
                    </span>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-3">O que faria investir mais</h2>
              <div className="flex flex-col gap-3 max-h-72 overflow-y-auto scroll-azul pr-1">
                {respostasComData.map((r) => {
                  const expandido = investirExpandido === r.id;
                  return (
                    <Card key={r.id} className="p-4">
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
