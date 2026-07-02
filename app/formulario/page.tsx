"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  prioridade_coreano: string;
  tempo_conhece_jae: string;
  como_conheceu_jae: string;
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
  prioridade_coreano: "",
  tempo_conhece_jae: "",
  como_conheceu_jae: "",
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
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className={`w-full text-left px-4 py-4 min-h-[52px] rounded-lg border text-sm font-medium transition-colors ${
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

function Label({ children, erro }: { children: React.ReactNode; erro?: boolean }) {
  return (
    <label className={`block mb-2 font-medium ${erro ? "text-[#ff5252]" : "text-[#1a1a1a]"}`}>
      <span className="text-[#ff5252] font-bold mr-1">*</span>
      {children}
    </label>
  );
}

interface Pais {
  nome: string;
  sigla: string;
  bandeira: string;
  codigo: string;
}

const PAISES: Pais[] = [
  { nome: "Brasil", sigla: "BR", bandeira: "🇧🇷", codigo: "+55" },
  { nome: "Estados Unidos", sigla: "US", bandeira: "🇺🇸", codigo: "+1" },
  { nome: "Portugal", sigla: "PT", bandeira: "🇵🇹", codigo: "+351" },
  { nome: "Argentina", sigla: "AR", bandeira: "🇦🇷", codigo: "+54" },
  { nome: "México", sigla: "MX", bandeira: "🇲🇽", codigo: "+52" },
  { nome: "Espanha", sigla: "ES", bandeira: "🇪🇸", codigo: "+34" },
  { nome: "Reino Unido", sigla: "GB", bandeira: "🇬🇧", codigo: "+44" },
  { nome: "Canadá", sigla: "CA", bandeira: "🇨🇦", codigo: "+1" },
  { nome: "Itália", sigla: "IT", bandeira: "🇮🇹", codigo: "+39" },
  { nome: "França", sigla: "FR", bandeira: "🇫🇷", codigo: "+33" },
  { nome: "Alemanha", sigla: "DE", bandeira: "🇩🇪", codigo: "+49" },
  { nome: "Japão", sigla: "JP", bandeira: "🇯🇵", codigo: "+81" },
  { nome: "Coreia do Sul", sigla: "KR", bandeira: "🇰🇷", codigo: "+82" },
  { nome: "Austrália", sigla: "AU", bandeira: "🇦🇺", codigo: "+61" },
];


function formatarWhatsapp(valor: string): string {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

function FormularioConteudo() {
  const searchParams = useSearchParams();
  const [secao, setSecao] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [erros, setErros] = useState<string[]>([]);
  const [camposComErro, setCamposComErro] = useState<Set<string>>(new Set());
  const erroRef = useRef<HTMLDivElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [paisWhatsapp, setPaisWhatsapp] = useState<Pais>(PAISES[0]);
  const [numeroWhatsapp, setNumeroWhatsapp] = useState("");
  const [veioDaBaseInterna, setVeioDaBaseInterna] = useState(false);
  const [emailCopiado, setEmailCopiado] = useState(false);

  useEffect(() => {
    const source = searchParams.get("utm_source");
    const medium = searchParams.get("utm_medium");
    const campaign = searchParams.get("utm_campaign");
    if (source === "ascensao" && medium === "base" && campaign === "interna") {
      setVeioDaBaseInterna(true);
    }
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [secao]);

  function inputClass(campo: string) {
    return `w-full border rounded-lg px-3 py-2 text-[#1a1a1a] focus:outline-none ${
      camposComErro.has(campo)
        ? "border-[#ff5252] focus:border-[#ff5252]"
        : "border-gray-300 focus:border-[#3574b5]"
    }`;
  }

  function set<K extends keyof FormData>(campo: K, valor: FormData[K]) {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
    setCamposComErro((prev) => {
      if (!prev.has(campo as string)) return prev;
      const next = new Set(prev);
      next.delete(campo as string);
      return next;
    });
  }

  function handleNumeroWhatsappChange(valor: string) {
    if (paisWhatsapp.codigo === "+55") {
      const formatado = formatarWhatsapp(valor);
      setNumeroWhatsapp(formatado);
      set("whatsapp", `${paisWhatsapp.codigo} ${formatado}`);
    } else {
      const numeros = valor.replace(/\D/g, "").slice(0, 15);
      setNumeroWhatsapp(numeros);
      set("whatsapp", `${paisWhatsapp.codigo} ${numeros}`);
    }
  }

  function handlePaisWhatsappChange(sigla: string) {
    const pais = PAISES.find((p) => p.sigla === sigla) ?? PAISES[0];
    setPaisWhatsapp(pais);

    if (pais.codigo === "+55") {
      const formatado = formatarWhatsapp(numeroWhatsapp);
      setNumeroWhatsapp(formatado);
      set("whatsapp", `${pais.codigo} ${formatado}`);
    } else {
      const numeros = numeroWhatsapp.replace(/\D/g, "").slice(0, 15);
      setNumeroWhatsapp(numeros);
      set("whatsapp", `${pais.codigo} ${numeros}`);
    }
  }

  function scrollParaErros() {
    setTimeout(() => erroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function validarSecao1(): boolean {
    const novosErros: string[] = [];
    const campos: string[] = [];
    if (!formData.nome_completo.trim()) { novosErros.push("Preencha seu nome e sobrenome."); campos.push("nome_completo"); }
    if (!formData.whatsapp.trim()) { novosErros.push("Preencha seu WhatsApp com DDD."); campos.push("whatsapp"); }
    if (!formData.email.trim()) { novosErros.push("Preencha seu melhor e-mail."); campos.push("email"); }
    setErros(novosErros);
    setCamposComErro(new Set(campos));
    return novosErros.length === 0;
  }

  function validarSecao2(): boolean {
    const novosErros: string[] = [];
    const campos: string[] = [];
    if (!formData.nivel_coreano) { novosErros.push("Selecione seu nível de coreano."); campos.push("nivel_coreano"); }
    if (!formData.coreano_no_dia_a_dia.trim()) { novosErros.push("Conte como o coreano faz parte do seu dia a dia."); campos.push("coreano_no_dia_a_dia"); }
    if (!formData.motivacao.trim()) { novosErros.push("Conte suas motivações para aprender coreano."); campos.push("motivacao"); }
    if (!formData.maior_dificuldade.trim()) { novosErros.push("Conte sua maior dificuldade em aprender coreano."); campos.push("maior_dificuldade"); }
    if (!formData.tentou_antes.trim()) { novosErros.push("Responda se já tentou aprender coreano antes."); campos.push("tentou_antes"); }
    setErros(novosErros);
    setCamposComErro(new Set(campos));
    return novosErros.length === 0;
  }

  function validarSecao3(): boolean {
    const novosErros: string[] = [];
    const campos: string[] = [];
    if (!formData.faixa_etaria) { novosErros.push("Selecione sua faixa etária."); campos.push("faixa_etaria"); }
    if (!formData.estado_civil) { novosErros.push("Selecione seu estado civil."); campos.push("estado_civil"); }
    if (formData.estado_civil === "Outro" && !formData.estado_civil_outro.trim()) { novosErros.push("Preencha seu estado civil."); campos.push("estado_civil_outro"); }
    if (!formData.tem_filhos) { novosErros.push("Responda se você tem filhos."); campos.push("tem_filhos"); }
    if (formData.tem_filhos === "Sim" && !formData.quantidade_filhos.trim()) { novosErros.push("Informe quantos filhos você tem."); campos.push("quantidade_filhos"); }
    if (!formData.tem_netos) { novosErros.push("Responda se você tem netos."); campos.push("tem_netos"); }
    if (formData.tem_netos === "Sim" && !formData.quantidade_netos.trim()) { novosErros.push("Informe quantos netos você tem."); campos.push("quantidade_netos"); }
    if (!formData.escolaridade) { novosErros.push("Selecione seu grau de escolaridade."); campos.push("escolaridade"); }
    if (
      (formData.escolaridade === "Ensino Superior Completo" ||
        formData.escolaridade === "Mestrado ou Doutorado Completo") &&
      !formData.area_formacao.trim()
    ) { novosErros.push("Informe sua área de formação."); campos.push("area_formacao"); }
    if (!formData.momento_profissional) { novosErros.push("Selecione seu momento profissional."); campos.push("momento_profissional"); }
    if (!formData.faixa_renda) { novosErros.push("Selecione sua faixa de renda mensal."); campos.push("faixa_renda"); }
    setErros(novosErros);
    setCamposComErro(new Set(campos));
    return novosErros.length === 0;
  }

  function validarSecao4(): boolean {
    const novosErros: string[] = [];
    const campos: string[] = [];
    if (!formData.tempo_dedicacao) { novosErros.push("Selecione quanto tempo por dia você consegue se dedicar."); campos.push("tempo_dedicacao"); }
    if (!formData.interesse_curso_completo) { novosErros.push("Responda se teria interesse em um curso completo."); campos.push("interesse_curso_completo"); }
    if (!formData.o_que_faria_investir.trim()) { novosErros.push("Conte o que faria você investir mais no aprendizado do coreano."); campos.push("o_que_faria_investir"); }
    if (!formData.prioridade_coreano) { novosErros.push("Selecione sua prioridade de 0 a 10."); campos.push("prioridade_coreano"); }
    if (!formData.tempo_conhece_jae) { novosErros.push("Selecione há quanto tempo você conhece o professor Jae Lee."); campos.push("tempo_conhece_jae"); }
    if (formData.tempo_conhece_jae && !formData.como_conheceu_jae.trim()) { novosErros.push("Conte de onde você conhece o professor Jae Lee."); campos.push("como_conheceu_jae"); }
    setErros(novosErros);
    setCamposComErro(new Set(campos));
    return novosErros.length === 0;
  }

  async function handleProximo() {
    if (secao === 1 && !validarSecao1()) { scrollParaErros(); return; }
    if (secao === 2 && !validarSecao2()) { scrollParaErros(); return; }
    if (secao === 3 && !validarSecao3()) { scrollParaErros(); return; }
    if (secao === 4 && !validarSecao4()) { scrollParaErros(); return; }

    if (secao < TOTAL_SECOES) {
      setSecao(secao + 1);
      setErros([]);
      setCamposComErro(new Set());
    } else {
      await handleEnviar();
    }
  }

  function handleVoltar() {
    if (secao > 1) {
      setSecao(secao - 1);
      setErros([]);
      setCamposComErro(new Set());
    }
  }

  async function handleEnviar() {
    setEnviando(true);
    setErroEnvio("");

    const { data: emailExistente } = await supabase
      .from("respostas")
      .select("email")
      .ilike("email", formData.email)
      .single();

    if (emailExistente) {
      setErroEnvio("Você já preencheu este formulário anteriormente com este e-mail. Caso precise de ajuda, entre em contato conosco.");
      setEnviando(false);
      return;
    }

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

  if (enviado && veioDaBaseInterna) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={gridBackground}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-[#3574b5] mb-4">Aulão liberado! 🎉</h1>
          <p className="text-[#1a1a1a] mb-5">
            Para acessar, copie o seu e-mail abaixo e cole na próxima página de login, que o acesso
            será concedido
          </p>

          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 bg-gray-100 rounded-lg px-4 py-3 text-[#1a1a1a] text-sm font-mono break-all">
              {formData.email}
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(formData.email);
                setEmailCopiado(true);
                setTimeout(() => setEmailCopiado(false), 2000);
              }}
              className="shrink-0 px-4 py-3 rounded-lg bg-[#3574b5] text-white text-sm font-medium hover:bg-[#2a5c92] transition-colors"
            >
              {emailCopiado ? "copiado!" : "Copiar email"}
            </button>
          </div>

          <p className="text-sm text-[#ff5252] font-semibold mb-6">
            ATENÇÃO - Você terá acesso ao Aulão por 7 dias a partir do momento que fizer login.
            Aproveite esse tempo para assistir com atenção!
          </p>

          <a
            href="https://www.aulaodecoreano.online/baseinterna"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-5 py-4 rounded-xl bg-[#3574b5] text-white font-bold text-lg hover:bg-[#2a5c92] transition-colors"
          >
            Acessar o Aulão
          </a>
        </div>
      </main>
    );
  }

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

  if (secao === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10" style={gridBackground}>
        <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-[#3574b5] mb-4">
            Me conta um pouco mais sobre você!
          </h1>
          <div className="text-[#1a1a1a]">
            <p className="mb-4">Oi! Prof. Jae aqui.</p>
            <p className="mb-4">
              Você acabou de dar um passo importante, e antes de começar, quero te conhecer melhor!
            </p>
            <p className="mb-4 font-bold">
              Esse formulário tem perguntas rápidas sobre quem você é, o que te trouxe até aqui e o
              que você espera aprender com o coreano.
            </p>
            <p className="mb-4">
              Leva menos de 3 minutos e vai me ajudar a entender se estou entregando o que você
              realmente preciso, e o que posso melhorar pra te ajudar ainda mais.
            </p>
            <p className="mb-8 italic">
              Seja honesto/a nas respostas. Quanto mais real sua resposta, mais eu consigo fazer por
              você. 🙏
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSecao(1)}
            className="px-5 py-2 rounded-xl bg-[#3574b5] text-white font-medium hover:bg-[#2a5c92]"
          >
            Começar
          </button>
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
          <div ref={erroRef} className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
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
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-[#3574b5]">Dados Pessoais</h2>

            <div>
              <Label erro={camposComErro.has("nome_completo")}>Para começar, qual seu nome e sobrenome?</Label>
              <input
                type="text"
                value={formData.nome_completo}
                onChange={(e) => set("nome_completo", e.target.value)}
                className={inputClass("nome_completo")}
              />
            </div>

            <div>
              <Label erro={camposComErro.has("whatsapp")}>Seu WhatsApp com DDD (DDD + Número)</Label>
              <div className="flex gap-2">
                <select
                  value={paisWhatsapp.sigla}
                  onChange={(e) => handlePaisWhatsappChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-2 text-[#1a1a1a] focus:outline-none focus:border-[#3574b5] bg-white"
                >
                  {PAISES.map((pais) => (
                    <option key={pais.sigla} value={pais.sigla}>
                      {pais.bandeira} {pais.codigo}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={numeroWhatsapp}
                  onChange={(e) => handleNumeroWhatsappChange(e.target.value)}
                  placeholder={paisWhatsapp.codigo === "+55" ? "(00) 00000-0000" : "Número"}
                  className={inputClass("whatsapp")}
                />
              </div>
            </div>

            <div>
              <Label erro={camposComErro.has("email")}>Qual seu melhor email?</Label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => set("email", e.target.value)}
                className={inputClass("email")}
              />
            </div>
          </div>
        )}

        {secao === 2 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-[#3574b5]">Sobre você e o Idioma Coreano...</h2>

            <div>
              <Label erro={camposComErro.has("nivel_coreano")}>Qual seu nível de coreano hoje?</Label>
              <div className={camposComErro.has("nivel_coreano") ? "rounded-lg border border-[#ff5252] p-1" : ""}>
                <ChoiceButtons
                  options={["Do absoluto zero", "Sei ler o hangul", "Sei algumas frases", "Intermediário", "Sou 100% fluente"]}
                  selected={formData.nivel_coreano}
                  onSelect={(v) => set("nivel_coreano", v)}
                />
              </div>
              {camposComErro.has("nivel_coreano") && <p className="text-[#ff5252] text-xs mt-1">* Campo obrigatório</p>}
            </div>

            <div>
              <Label erro={camposComErro.has("coreano_no_dia_a_dia")}>
                Me conte sobre como o Idioma e a Cultura Coreana faz parte do seu dia a dia (pode ser
                bem específica nessa resposta!)
              </Label>
              <textarea
                value={formData.coreano_no_dia_a_dia}
                onChange={(e) => set("coreano_no_dia_a_dia", e.target.value)}
                rows={4}
                className={inputClass("coreano_no_dia_a_dia")}
              />
            </div>

            <div>
              <Label erro={camposComErro.has("motivacao")}>
                Por que você decidiu aprender Coreano? Me conte aqui todas as suas motivações! (Abra
                seu coração nessa resposta! 🫰🏼)
              </Label>
              <textarea
                value={formData.motivacao}
                onChange={(e) => set("motivacao", e.target.value)}
                rows={4}
                className={inputClass("motivacao")}
              />
            </div>

            <div>
              <Label erro={camposComErro.has("maior_dificuldade")}>
                Qual é a sua maior dificuldade em aprender o Coreano? (Abra seu coração mais uma vez)
              </Label>
              <textarea
                value={formData.maior_dificuldade}
                onChange={(e) => set("maior_dificuldade", e.target.value)}
                rows={4}
                className={inputClass("maior_dificuldade")}
              />
            </div>

            <div>
              <Label erro={camposComErro.has("tentou_antes")}>Você já tentou aprender coreano antes? Se sim, o que aconteceu?</Label>
              <textarea
                value={formData.tentou_antes}
                onChange={(e) => set("tentou_antes", e.target.value)}
                rows={4}
                className={inputClass("tentou_antes")}
              />
            </div>
          </div>
        )}

        {secao === 3 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-[#3574b5]">Dados Demográficos</h2>

            <div>
              <Label erro={camposComErro.has("faixa_etaria")}>Qual a sua idade?</Label>
              <div className={camposComErro.has("faixa_etaria") ? "rounded-lg border border-[#ff5252] p-1" : ""}>
                <ChoiceButtons
                  options={["13-17", "18-24", "25-34", "35-44", "45-54", "55-65", "+65"]}
                  selected={formData.faixa_etaria}
                  onSelect={(v) => set("faixa_etaria", v)}
                />
              </div>
              {camposComErro.has("faixa_etaria") && <p className="text-[#ff5252] text-xs mt-1">* Campo obrigatório</p>}
            </div>

            <div>
              <Label erro={camposComErro.has("estado_civil")}>Qual seu estado civil?</Label>
              <div className={camposComErro.has("estado_civil") ? "rounded-lg border border-[#ff5252] p-1" : ""}>
                <ChoiceButtons
                  options={["Solteira(o)", "Namorando", "Casada(o)", "Outro"]}
                  selected={formData.estado_civil}
                  onSelect={(v) => set("estado_civil", v)}
                />
              </div>
              {camposComErro.has("estado_civil") && <p className="text-[#ff5252] text-xs mt-1">* Campo obrigatório</p>}
              {formData.estado_civil === "Outro" && (
                <input
                  type="text"
                  value={formData.estado_civil_outro}
                  onChange={(e) => set("estado_civil_outro", e.target.value)}
                  placeholder="Qual?"
                  className={`mt-2 ${inputClass("estado_civil_outro")}`}
                />
              )}
            </div>

            <div>
              <Label erro={camposComErro.has("tem_filhos")}>Você tem filhos?</Label>
              <div className={camposComErro.has("tem_filhos") ? "rounded-lg border border-[#ff5252] p-1" : ""}>
                <ChoiceButtons
                  options={["Sim", "Não"]}
                  selected={formData.tem_filhos}
                  onSelect={(v) => set("tem_filhos", v)}
                />
              </div>
              {camposComErro.has("tem_filhos") && <p className="text-[#ff5252] text-xs mt-1">* Campo obrigatório</p>}
              {formData.tem_filhos === "Sim" && (
                <input
                  type="text"
                  value={formData.quantidade_filhos}
                  onChange={(e) => set("quantidade_filhos", e.target.value)}
                  placeholder="Quantos filhos tem atualmente?"
                  className={`mt-2 ${inputClass("quantidade_filhos")}`}
                />
              )}
            </div>

            <div>
              <Label erro={camposComErro.has("tem_netos")}>E netos?</Label>
              <div className={camposComErro.has("tem_netos") ? "rounded-lg border border-[#ff5252] p-1" : ""}>
                <ChoiceButtons
                  options={["Sim", "Não"]}
                  selected={formData.tem_netos}
                  onSelect={(v) => set("tem_netos", v)}
                />
              </div>
              {camposComErro.has("tem_netos") && <p className="text-[#ff5252] text-xs mt-1">* Campo obrigatório</p>}
              {formData.tem_netos === "Sim" && (
                <input
                  type="text"
                  value={formData.quantidade_netos}
                  onChange={(e) => set("quantidade_netos", e.target.value)}
                  placeholder="Quantos netos tem atualmente?"
                  className={`mt-2 ${inputClass("quantidade_netos")}`}
                />
              )}
            </div>

            <div>
              <Label erro={camposComErro.has("escolaridade")}>
                Qual é seu Grau de Escolaridade? (Caso você ainda não se formou e esteja fazendo
                alguma das opções, clique naquela do mesmo jeito)
              </Label>
              <div className={camposComErro.has("escolaridade") ? "rounded-lg border border-[#ff5252] p-1" : ""}>
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
              </div>
              {camposComErro.has("escolaridade") && <p className="text-[#ff5252] text-xs mt-1">* Campo obrigatório</p>}
              {(formData.escolaridade === "Ensino Superior Completo" ||
                formData.escolaridade === "Mestrado ou Doutorado Completo") && (
                <input
                  type="text"
                  value={formData.area_formacao}
                  onChange={(e) => set("area_formacao", e.target.value)}
                  placeholder="Qual a área que se formou?"
                  className={`mt-2 ${inputClass("area_formacao")}`}
                />
              )}
            </div>

            <div>
              <Label erro={camposComErro.has("momento_profissional")}>Qual é seu momento profissional?</Label>
              <div className={camposComErro.has("momento_profissional") ? "rounded-lg border border-[#ff5252] p-1" : ""}>
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
              {camposComErro.has("momento_profissional") && <p className="text-[#ff5252] text-xs mt-1">* Campo obrigatório</p>}
            </div>

            <div>
              <Label erro={camposComErro.has("faixa_renda")}>Qual a faixa da sua renda mensal?</Label>
              <div className={camposComErro.has("faixa_renda") ? "rounded-lg border border-[#ff5252] p-1" : ""}>
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
              {camposComErro.has("faixa_renda") && <p className="text-[#ff5252] text-xs mt-1">* Campo obrigatório</p>}
            </div>
          </div>
        )}

        {secao === 4 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-[#3574b5]">Prontidão</h2>

            <div>
              <Label erro={camposComErro.has("tempo_dedicacao")}>Quanto tempo por dia você consegue se dedicar?</Label>
              <div className={camposComErro.has("tempo_dedicacao") ? "rounded-lg border border-[#ff5252] p-1" : ""}>
                <ChoiceButtons
                  options={["Menos de 15 min", "15-30 min", "30-60 min", "Mais de 1h"]}
                  selected={formData.tempo_dedicacao}
                  onSelect={(v) => set("tempo_dedicacao", v)}
                />
              </div>
              {camposComErro.has("tempo_dedicacao") && <p className="text-[#ff5252] text-xs mt-1">* Campo obrigatório</p>}
            </div>

            <div>
              <Label erro={camposComErro.has("interesse_curso_completo")}>
                Este mini-curso é um ótimo primeiro passo para a fluência.. Mas se existisse um caminho
                completo, com professor e acompanhamento, pra te levar do zero à fluência.. você teria
                interesse em conhecer?
              </Label>
              <div className={camposComErro.has("interesse_curso_completo") ? "rounded-lg border border-[#ff5252] p-1" : ""}>
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
              {camposComErro.has("interesse_curso_completo") && <p className="text-[#ff5252] text-xs mt-1">* Campo obrigatório</p>}
            </div>

            <div>
              <Label erro={camposComErro.has("o_que_faria_investir")}>
                O que faria você investir mais para aprender coreano de forma completa? (o que tem não
                pode faltar na entrega)
              </Label>
              <textarea
                value={formData.o_que_faria_investir}
                onChange={(e) => set("o_que_faria_investir", e.target.value)}
                rows={4}
                className={inputClass("o_que_faria_investir")}
              />
            </div>

            <div>
              <Label erro={camposComErro.has("prioridade_coreano")}>
                De 0 a 10, o quanto aprender coreano é uma prioridade real na sua vida agora?
              </Label>
              <div className={camposComErro.has("prioridade_coreano") ? "rounded-lg border border-[#ff5252] p-1" : ""}>
                <div className="grid grid-cols-4 gap-2">
                  {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => set("prioridade_coreano", n)}
                      className={`py-3 rounded-lg border text-sm font-bold transition-colors ${
                        formData.prioridade_coreano === n
                          ? "bg-[#eef3fb] text-[#3574b5] border-[#3574b5]"
                          : "bg-white text-gray-700 border-gray-300 hover:border-[#3574b5]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {camposComErro.has("prioridade_coreano") && <p className="text-[#ff5252] text-xs mt-1">* Campo obrigatório</p>}
            </div>

            <div>
              <Label erro={camposComErro.has("tempo_conhece_jae")}>Há quanto tempo conhece o professor Jae Lee?</Label>
              <div className={camposComErro.has("tempo_conhece_jae") ? "rounded-lg border border-[#ff5252] p-1" : ""}>
                <ChoiceButtons
                  options={["Menos de 1 mês", "Cerca de 3 meses", "Cerca de 6 meses", "Cerca de 1 ano", "Mais de um ano atrás"]}
                  selected={formData.tempo_conhece_jae}
                  onSelect={(v) => set("tempo_conhece_jae", v)}
                />
              </div>
              {camposComErro.has("tempo_conhece_jae") && <p className="text-[#ff5252] text-xs mt-1">* Campo obrigatório</p>}
            </div>

            {formData.tempo_conhece_jae && (
              <div>
                <Label erro={camposComErro.has("como_conheceu_jae")}>De onde você o conhece? Conta brevemente!</Label>
                <textarea
                  value={formData.como_conheceu_jae}
                  onChange={(e) => set("como_conheceu_jae", e.target.value)}
                  rows={4}
                  className={inputClass("como_conheceu_jae")}
                />
              </div>
            )}
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

export default function FormularioPage() {
  return (
    <Suspense>
      <FormularioConteudo />
    </Suspense>
  );
}
