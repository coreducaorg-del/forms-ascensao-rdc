"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    pandascripttag: unknown[];
    PandaPlayer: new (
      id: string,
      options: { onReady: () => void }
    ) => {
      loadWindowScreen: (opts: { panda_id_player: string }) => void;
      getCurrentTime: () => Promise<number>;
      onTimeUpdate: (cb: (data: { currentTime: number }) => void) => void;
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

      const { data: acesso, error } = await supabase
        .from("acessos_aula")
        .select("data_expiracao")
        .eq("email", emailSalvo)
        .maybeSingle();

      if (error || !acesso) {
        router.replace("/baseinterna");
        return;
      }

      const agora = new Date();
      const expiracao = new Date(acesso.data_expiracao);

      if (agora > expiracao) {
        setExpirado(true);
        setCarregando(false);
        return;
      }

      const diffMs = expiracao.getTime() - agora.getTime();
      const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      setDiasRestantes(dias);
      setCarregando(false);
    }

    verificarAcesso();
  }, [router]);

  useEffect(() => {
    if (carregando || expirado) return;

    window.pandascripttag = window.pandascripttag || [];
    window.pandascripttag.push(function () {
      const p = new window.PandaPlayer(PANDA_PLAYER_ID, {
        onReady() {
          p.loadWindowScreen({ panda_id_player: PANDA_PLAYER_ID });

          // Abordagem primária: polling via getCurrentTime() a cada segundo.
          // getCurrentTime() retorna uma Promise com o tempo atual do vídeo em segundos.
          // Alternativa caso não funcione: p.onTimeUpdate((data) => { if (data.currentTime >= TEMPO_LIMITE_SEGUNDOS) setMostrarBotoes(true); })
          const intervalo = setInterval(() => {
            p.getCurrentTime().then((tempoAtual: number) => {
              if (tempoAtual >= TEMPO_LIMITE_SEGUNDOS) {
                setMostrarBotoes(true);
                clearInterval(intervalo);
              }
            }).catch(() => {
              // Se getCurrentTime não for suportado, cair no evento nativo
              clearInterval(intervalo);
              p.onTimeUpdate((data: { currentTime: number }) => {
                if (data.currentTime >= TEMPO_LIMITE_SEGUNDOS) {
                  setMostrarBotoes(true);
                }
              });
            });
          }, 1000);
        },
      });
    });
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
          <h1 className="text-3xl font-bold text-[#1a1a1a] text-center mb-8">
            Aulão Coreano na Hora 🇰🇷
          </h1>

          {/* Player */}
          <div style={{ position: "relative", paddingTop: "56.25%" }}>
            <iframe
              id={PANDA_PLAYER_ID}
              src="https://player-vz-52703098-ed8.tv.pandavideo.com.br/embed/?v=816cb247-c817-47eb-9a62-5744964d92c5&iosFakeFullscreen=true"
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
                Gostou do Aulão? Garanta sua vaga na Ascensão!
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://pay.hub.la/L6tGmnOPKY3P3mzgptq2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-xl bg-[#22c55e] text-white font-bold text-base hover:bg-[#16a34a] transition-colors"
                >
                  Quero o plano de 2 anos
                </a>
                <a
                  href="https://pay.hub.la/AVB4X3lgxwWW2nouZgV8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-xl bg-[#22c55e] text-white font-bold text-base hover:bg-[#16a34a] transition-colors"
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
