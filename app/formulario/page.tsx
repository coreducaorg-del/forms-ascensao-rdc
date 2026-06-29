"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface FormData {
  nome_completo: string;
  whatsapp: string;
  email: string;

  nivel_coreano: string;
  coreano_no_dia_a_dia: string;
  motivacao: string;
  maior_dificuldade: string;
  tentou_antes: string;

  faixa_etaria: string;
  estado_civil: string;
  estado_civil_outro: string;
  tem_filhos: string;
  quantidade_filhos: string;
  tem_netos: string;
  quantidade_netos: string;
  escolaridade: string;
  area_formacao: string;
  momento_profissional: string;
  faixa_renda: string;

  tempo_dedicacao: string;
  interesse_curso_completo: string;
  o_que_faria_investir: string;
}

const initialFormData: FormData = {
  nome_completo: "",
  whatsapp: "",
  email: "",

  nivel_coreano: "",
  coreano_no_dia_a_dia: "",
  motivacao: "",
  maior_dificuldade: "",
  tentou_antes: "",

  faixa_etaria: "",
  estado_civil: "",
  estado_civil_outro: "",
  tem_filhos: "",
  quantidade_filhos: "",
  tem_netos: "",
  quantidade_netos: "",
  escolaridade: "",
  area_formacao: "",
  momento_profissional: "",
  faixa_renda: "",

  tempo_dedicacao: "",
  interesse_curso_completo: "",
  o_que_faria_investir: "",
};

const TOTAL_SECOES = 4;

function ChoiceButtons({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            selected === option
              ? "bg-[#eef3fb] text-[#3574b5] border-[#3574b5]"
              : "bg-white text-gray-700 border-gray-300 hover:border-[#3574b5]"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block mb-2 font-medium text-[#1a1a1a]">{children}</label>;
}

const inputClasses =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-[#1a1a1a] focus:outline-none focus:border-[#3574b5]";

export default function FormularioPage() {
  const [secao, setSecao] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [erros, setErros] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const [enviado, setEnviado] = useState(false);

  function set<K extends keyof FormData>(campo: K, valor: FormData[K]) {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
  }

  function validarSecao1(): boolean {
    const novosErros: string[] = [];
    if (!formData.nome_completo.trim()) novosErros.push("Nome completo é obrigatório.");
    if (!formData.whatsapp.trim()) novosErros.push("WhatsApp é obrigatório.");
    if (!formData.email.trim()) novosErros.push("Email é obrigatório.");
    setErros(novosErros);
    return novosErros.length === 0;
  }

  function validarSecao2(): boolean {
    const novosErros: string[] = [];
    if (!formData.nivel_coreano) novosErros.push("Selecione seu nível de coreano.");
    setErros(novosErros);
    return novosErros.length === 0;
  }

  async function handleProximo() {
    if (secao === 1 && !validarSecao1()) return;
    if (secao === 2 && !validarSecao2()) return;

    if (secao < TOTAL_SECOES) {
      setSecao(secao + 1);
      setErros([]);
    } else {
      await handleEnviar();
    }
  }

  function handleVoltar() {
    if (secao > 1) {
      setSecao(secao - 1);
      setErros([]);
    }
  }

  async function handleEnviar() {
    setEnviando(true);
    setErroEnvio("");

    const { error } = await supabase.from("respostas").insert([formData]);

    setEnviando(false);

    if (error) {
      setErroEnvio("Não foi possível enviar suas respostas. Por favor, tente novamente em alguns instantes.");
      return;
    }

    setEnviado(true);
  }

  const gridBackground = {
    backgroundColor: "#ffffff",
    backgroundImage:
      "linear-gradient(rgba(224, 224, 224, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(224, 224, 224, 0.4) 1px, transparent 1px)",
    backgroundSize: "32px 32px",
  };

  if (enviado) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={gridBackground}>
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-10">
          <h1 className="text-2xl font-bold text-[#ff5252] mb-3">Obrigado por responder!</h1>
          <p className="text-gray-500">
            Recebemos suas respostas com sucesso. Em breve entraremos em contato.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-start justify-center px-4 py-10" style={gridBackground}>
      <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-lg p-8">
        <div className="mb-6">
          <p className="text-sm text-[#ff5252] font-bold mb-1">
            Seção {secao} de {TOTAL_SECOES}
          </p>
          <div className="w-full bg-[#f0f0f0] rounded-full h-2">
            <div
              className="bg-[#3574b5] h-2 rounded-full transition-all"
              style={{ width: `${(secao / TOTAL_SECOES) * 100}%` }}
            />
          </div>
        </div>

        {erros.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {erros.map((erro) => (
              <p key={erro}>{erro}</p>
            ))}
          </div>
        )}

        {erroEnvio && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {erroEnvio}
          </div>
        )}

        {secao === 1 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-[#3574b5]">Dados Pessoais</h2>

            <div>
              <Label>Para começar, qual seu nome e sobrenome? *</Label>
              <input
                type="text"
                value={formData.nome_completo}
                onChange={(e) => set("nome_completo", e.target.value)}
                className={inputClasses}
              />
            </div>

            <div>
              <Label>Seu WhatsApp com DDD (DDD + Número) *</Label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                className={inputClasses}
              />
            </div>

            <div>
              <Label>Qual seu melhor email? *</Label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputClasses}
              />
            </div>
          </div>
        )}

        {secao === 2 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-[#3574b5]">Sobre você e o Idioma Coreano...</h2>

            <div>
              <Label>Qual seu nível de coreano hoje? *</Label>
              <ChoiceButtons
                options={["Do absoluto zero", "Sei ler o hangul", "Sei algumas frases", "Intermediário", "Sou 100% fluente"]}
                selected={formData.nivel_coreano}
                onSelect={(v) => set("nivel_coreano", v)}
              />
            </div>

            <div>
              <Label>
                Me conte sobre como o Idioma e a Cultura Coreana faz parte do seu dia a dia (pode ser
                bem específica nessa resposta!)
              </Label>
              <textarea
                value={formData.coreano_no_dia_a_dia}
                onChange={(e) => set("coreano_no_dia_a_dia", e.target.value)}
                rows={4}
                className={inputClasses}
              />
            </div>

            <div>
              <Label>
                Por que você decidiu aprender Coreano? Me conte aqui todas as suas motivações! (Abra
                seu coração nessa resposta! 🫰🏼)
              </Label>
              <textarea
                value={formData.motivacao}
                onChange={(e) => set("motivacao", e.target.value)}
                rows={4}
                className={inputClasses}
              />
            </div>

            <div>
              <Label>
                Qual é a sua maior dificuldade em aprender o Coreano? (Abra seu coração mais uma vez)
              </Label>
              <textarea
                value={formData.maior_dificuldade}
                onChange={(e) => set("maior_dificuldade", e.target.value)}
                rows={4}
                className={inputClasses}
              />
            </div>

            <div>
              <Label>Você já tentou aprender coreano antes? Se sim, o que aconteceu?</Label>
              <textarea
                value={formData.tentou_antes}
                onChange={(e) => set("tentou_antes", e.target.value)}
                rows={4}
                className={inputClasses}
              />
            </div>
          </div>
        )}

        {secao === 3 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-[#3574b5]">Dados Demográficos</h2>

            <div>
              <Label>Qual a sua idade?</Label>
              <ChoiceButtons
                options={["13-17", "18-24", "25-34", "35-44", "45-54", "55-65", "+65"]}
                selected={formData.faixa_etaria}
                onSelect={(v) => set("faixa_etaria", v)}
              />
            </div>

            <div>
              <Label>Qual seu estado civil?</Label>
              <ChoiceButtons
                options={["Solteira(o)", "Namorando", "Casada(o)", "Outro"]}
                selected={formData.estado_civil}
                onSelect={(v) => set("estado_civil", v)}
              />
              {formData.estado_civil === "Outro" && (
                <input
                  type="text"
                  value={formData.estado_civil_outro}
                  onChange={(e) => set("estado_civil_outro", e.target.value)}
                  placeholder="Qual?"
                  className={`mt-2 ${inputClasses}`}
                />
              )}
            </div>

            <div>
              <Label>Você tem filhos?</Label>
              <ChoiceButtons
                options={["Sim", "Não"]}
                selected={formData.tem_filhos}
                onSelect={(v) => set("tem_filhos", v)}
              />
              {formData.tem_filhos === "Sim" && (
                <input
                  type="text"
                  value={formData.quantidade_filhos}
                  onChange={(e) => set("quantidade_filhos", e.target.value)}
                  placeholder="Quantos filhos tem atualmente?"
                  className={`mt-2 ${inputClasses}`}
                />
              )}
            </div>

            <div>
              <Label>E netos?</Label>
              <ChoiceButtons
                options={["Sim", "Não"]}
                selected={formData.tem_netos}
                onSelect={(v) => set("tem_netos", v)}
              />
              {formData.tem_netos === "Sim" && (
                <input
                  type="text"
                  value={formData.quantidade_netos}
                  onChange={(e) => set("quantidade_netos", e.target.value)}
                  placeholder="Quantos netos tem atualmente?"
                  className={`mt-2 ${inputClasses}`}
                />
              )}
            </div>

            <div>
              <Label>
                Qual é seu Grau de Escolaridade? (Caso você ainda não se formou e esteja fazendo
                alguma das opções, clique naquela do mesmo jeito)
              </Label>
              <ChoiceButtons
                options={[
                  "Não estudei",
                  "Ensino Fundamental Completo",
                  "Ensino Médio Completo",
                  "Ensino Superior Completo",
                  "Mestrado ou Doutorado Completo",
                ]}
                selected={formData.escolaridade}
                onSelect={(v) => set("escolaridade", v)}
              />
              {(formData.escolaridade === "Ensino Superior Completo" ||
                formData.escolaridade === "Mestrado ou Doutorado Completo") && (
                <input
                  type="text"
                  value={formData.area_formacao}
                  onChange={(e) => set("area_formacao", e.target.value)}
                  placeholder="Qual a área que se formou?"
                  className={`mt-2 ${inputClasses}`}
                />
              )}
            </div>

            <div>
              <Label>Qual é seu momento profissional?</Label>
              <ChoiceButtons
                options={[
                  "Autônoma(o)",
                  "CLT",
                  "Servidor Público",
                  "Empresária(o)",
                  "MEI",
                  "Desempregada(o)",
                  "Estudante",
                ]}
                selected={formData.momento_profissional}
                onSelect={(v) => set("momento_profissional", v)}
              />
            </div>

            <div>
              <Label>Qual a faixa da sua renda mensal?</Label>
              <ChoiceButtons
                options={[
                  "Sem Renda",
                  "Menos de R$ 1.000",
                  "Entre R$ 1.001 e R$ 2.000",
                  "Entre R$ 2.001 e R$ 3.000",
                  "Entre R$ 3.001 e R$ 4.000",
                  "Entre R$ 4.001 e R$ 5.000",
                  "Entre R$ 5.001 e R$ 10.000",
                  "Entre R$ 10.001 e R$ 20.000",
                  "Mais de R$ 20.001",
                ]}
                selected={formData.faixa_renda}
                onSelect={(v) => set("faixa_renda", v)}
              />
            </div>
          </div>
        )}

        {secao === 4 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-[#3574b5]">Prontidão</h2>

            <div>
              <Label>Quanto tempo por dia você consegue se dedicar?</Label>
              <ChoiceButtons
                options={["Menos de 15 min", "15-30 min", "30-60 min", "Mais de 1h"]}
                selected={formData.tempo_dedicacao}
                onSelect={(v) => set("tempo_dedicacao", v)}
              />
            </div>

            <div>
              <Label>
                Este mini-curso é um ótimo primeiro passo para a fluência.. Mas se existisse um caminho
                completo, com professor e acompanhamento, pra te levar do zero à fluência.. você teria
                interesse em conhecer?
              </Label>
              <ChoiceButtons
                options={[
                  "Sim, com certeza",
                  "Talvez, dependendo do valor",
                  "Por enquanto só o mini-curso me basta",
                ]}
                selected={formData.interesse_curso_completo}
                onSelect={(v) => set("interesse_curso_completo", v)}
              />
            </div>

            <div>
              <Label>
                O que faria você investir mais para aprender coreano de forma completa? (o que tem não
                pode faltar na entrega)
              </Label>
              <textarea
                value={formData.o_que_faria_investir}
                onChange={(e) => set("o_que_faria_investir", e.target.value)}
                rows={4}
                className={inputClasses}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {secao > 1 ? (
            <button
              type="button"
              onClick={handleVoltar}
              disabled={enviando}
              className="px-5 py-2 rounded-xl border border-[#ff5252] text-[#ff5252] font-medium bg-transparent hover:bg-[#fdecec] disabled:opacity-50"
            >
              Voltar
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={handleProximo}
            disabled={enviando}
            className="px-5 py-2 rounded-xl bg-[#3574b5] text-white font-medium hover:bg-[#2a5c92] disabled:opacity-50"
          >
            {enviando ? "Enviando..." : secao === TOTAL_SECOES ? "Enviar" : "Próximo"}
          </button>
        </div>
      </div>
    </main>
  );
}
