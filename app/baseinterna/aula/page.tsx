"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    pandascripttag: unknown[];
    PandaPlayer: new (
      id: string,
      options: { onReady: () => void }
    ) => {
      loadWindowScreen: (opts: { panda_id_player: string }) => void;
    };
  }
}

const PANDA_PLAYER_ID = "panda-816cb247-c817-47eb-9a62-5744964d92c5";
const TEMPO_LIMITE_SEGUNDOS = 4234; // 1h 10m 34s

export default function AulaPage() {
  const router = useRouter();
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null);
  const [expirado, setExpirado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [mostrarBotoes, setMostrarBotoes] = useState(false);

  useEffect(() => {
    async function verificarAcesso() {
      const emailSalvo = sessionStorage.getItem("email_aulao");

      if (!emailSalvo) {
        router.replace("/baseinterna");
        return;
      }

      try {
        const response = await fetch("/api/baseinterna/verificar-acesso", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailSalvo }),
        });

        const result = await response.json();

        if (!result.success || !result.valido) {
          setExpirado(true);
          setCarregando(false);
          return;
        }

        setDiasRestantes(result.diasRestantes);
        setCarregando(false);
      } catch {
        router.replace("/baseinterna");
      }
    }

    verificarAcesso();
  }, [router]);

  // Envia o tempo assistido para o servidor a cada 30 segundos
  useEffect(() => {
    const email = sessionStorage.getItem("email_aulao");
    if (!email) return;

    const intervalo = setInterval(async () => {
      const tempoAtual = Number(sessionStorage.getItem("video_tempo_maximo") || 0);
      if (tempoAtual > 0) {
        try {
          await fetch("/api/baseinterna/salvar-tempo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, tempo: tempoAtual }),
          });
        } catch {
          // falha silenciosa — não interrompe a experiência da aluna
        }
      }
    }, 60000);

    return () => clearInterval(intervalo);
  }, []);

  // Ao carregar, verificar se a pessoa já assistiu o suficiente em uma sessão anterior
  useEffect(() => {
    if (carregando || expirado) return;
    const tempoSalvo = Number(sessionStorage.getItem("video_tempo_maximo") || 0);
    if (tempoSalvo >= TEMPO_LIMITE_SEGUNDOS) {
      setMostrarBotoes(true);
    }
  }, [carregando, expirado]);

  useEffect(() => {
    if (carregando || expirado) return;

    // O Panda Player envia eventos via postMessage para o window pai.
    // O evento correto para monitorar o tempo de reprodução é "panda_timeupdate".
    // Referência: https://docs.pandavideo.com/reference/receive-events
    function handleMessage(event: MessageEvent) {
      // Processar apenas mensagens originadas do domínio do Panda Video
      if (!event.origin.includes("pandavideo.com.br")) return;

      const { data } = event;
      if (data?.message === "panda_timeupdate") {
        const tempoAtual: number = data.currentTime ?? 0;

        // Persistir apenas o maior tempo já atingido (proteção contra recarregamento)
        const tempoSalvo = Number(sessionStorage.getItem("video_tempo_maximo") || 0);
        if (tempoAtual > tempoSalvo) {
          sessionStorage.setItem("video_tempo_maximo", String(tempoAtual));
        }

        if (tempoAtual >= TEMPO_LIMITE_SEGUNDOS) {
          setMostrarBotoes(true);
        }
      }
    }

    window.addEventListener("message", handleMessage);

    // Fallback: verificar sessionStorage a cada 5s para cobrir casos onde
    // o evento postMessage não dispara (rede instável, reload, etc.)
    const verificacaoExtra = setInterval(() => {
      const tempoSalvo = Number(sessionStorage.getItem("video_tempo_maximo") || 0);
      if (tempoSalvo >= TEMPO_LIMITE_SEGUNDOS) {
        setMostrarBotoes(true);
        clearInterval(verificacaoExtra);
      }
    }, 5000);

    // Android: ao voltar de segundo plano (aba minimizada), o postMessage pode
    // não ter disparado enquanto o app estava suspenso. Verifica o sessionStorage
    // ao retornar para garantir que os botões apareçam se o limite já foi atingido.
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        const tempoSalvo = Number(sessionStorage.getItem("video_tempo_maximo") || 0);
        if (tempoSalvo >= TEMPO_LIMITE_SEGUNDOS) {
          setMostrarBotoes(true);
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    window.pandascripttag = window.pandascripttag || [];
    window.pandascripttag.push(function () {
      const p = new window.PandaPlayer(PANDA_PLAYER_ID, {
        onReady() {
          p.loadWindowScreen({ panda_id_player: PANDA_PLAYER_ID });
        },
      });
    });

    return () => {
      window.removeEventListener("message", handleMessage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(verificacaoExtra);
    };
  }, [carregando, expirado]);

  if (carregando) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-400 text-sm">Verificando acesso...</p>
      </main>
    );
  }

  if (expirado) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-10">
          <h1 className="text-2xl font-bold text-[#ff5252] mb-3">Seu acesso expirou</h1>
          <p className="text-gray-500">
            O período de 7 dias para assistir ao Aulão chegou ao fim. Entre em contato conosco para
            mais informações.
          </p>
        </div>
      </main>
    );
  }

  const faixaDias =
    diasRestantes === 0
      ? "Hoje é seu último dia de acesso!"
      : `Você tem ${diasRestantes} ${diasRestantes === 1 ? "dia restante" : "dias restantes"} para assistir este Aulão`;

  return (
    <>
      {/* Preloads recomendados pelo Panda Video — hoistados automaticamente para <head> pelo Next.js App Router */}
      <link rel="dns-prefetch" href="https://player-vz-52703098-ed8.tv.pandavideo.com.br" />
      <link rel="dns-prefetch" href="https://b-vz-52703098-ed8.tv.pandavideo.com.br" />
      <link rel="preload" href="https://player-vz-52703098-ed8.tv.pandavideo.com.br/embed/css/plyr.css" as="style" />
      <link rel="preload" href="https://player-vz-52703098-ed8.tv.pandavideo.com.br/embed/css/styles.css" as="style" />
      <link rel="preload" href="https://player-vz-52703098-ed8.tv.pandavideo.com.br/embed/css/pb.css" as="style" />
      <link rel="preload" href="https://config.tv.pandavideo.com.br/vz-52703098-ed8/816cb247-c817-47eb-9a62-5744964d92c5.json" as="fetch" crossOrigin="anonymous" />
      <link rel="preload" href="https://config.tv.pandavideo.com.br/vz-52703098-ed8/config.json" as="fetch" crossOrigin="anonymous" />
      <link rel="preload" href="https://b-vz-52703098-ed8.tv.pandavideo.com.br/816cb247-c817-47eb-9a62-5744964d92c5/playlist.m3u8" as="fetch" crossOrigin="anonymous" />
      <link rel="prerender" href="https://player-vz-52703098-ed8.tv.pandavideo.com.br/embed/?v=816cb247-c817-47eb-9a62-5744964d92c5" />

      <Script
        src="https://player.pandavideo.com.br/api.v2.js"
        strategy="afterInteractive"
      />

      {/* Faixa dias restantes */}
      <div className="w-full bg-[#3574b5] text-white text-center py-3 px-4 text-sm font-medium">
        {faixaDias}
      </div>

      <main className="min-h-screen bg-white py-10 px-4">
        <div className="max-w-[900px] mx-auto">
          {/* Título */}
          <h1 className="text-3xl font-bold text-[#1a1a1a] text-center mb-2">
            Aulão mais completo de coreano DO ZERO para iniciantes
          </h1>
          <p className="text-base text-center mb-8" style={{ color: "#666666" }}>
            Assista do início ao fim para melhor aprendizado
          </p>

          {/* Player — overflow-hidden evita extravasamento em telas estreitas Android */}
          <div style={{ position: "relative", paddingTop: "56.25%", overflow: "hidden" }}>
            {/* autoplay=0 previne tentativa de autoplay com som no Android Chrome */}
            <iframe
              id={PANDA_PLAYER_ID}
              src="https://player-vz-52703098-ed8.tv.pandavideo.com.br/embed/?v=816cb247-c817-47eb-9a62-5744964d92c5&iosFakeFullscreen=true&autoplay=0"
              style={{ border: "none", position: "absolute", top: 0, left: 0 }}
              allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
              allowFullScreen
              width="100%"
              height="100%"
            />
          </div>

          {/* Botões de checkout — aparecem quando vídeo atinge 4234s */}
          {mostrarBotoes && (
            <div className="mt-12 text-center">
              <h2 className="text-xl font-bold text-[#1a1a1a] mb-6">
                Gostou do Aulão? Garanta sua vaga no curso Dominando o Coreano!
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://pay.hub.la/L6tGmnOPKY3P3mzgptq2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center min-h-[44px] px-8 py-4 rounded-xl bg-[#22c55e] text-white font-bold text-sm sm:text-base hover:bg-[#16a34a] transition-colors w-full sm:w-auto touch-manipulation"
                >
                  Quero o plano de 2 anos
                </a>
                <a
                  href="https://pay.hub.la/AVB4X3lgxwWW2nouZgV8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center min-h-[44px] px-8 py-4 rounded-xl bg-[#22c55e] text-white font-bold text-sm sm:text-base hover:bg-[#16a34a] transition-colors w-full sm:w-auto touch-manipulation"
                >
                  Quero o plano de 1 ano
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
