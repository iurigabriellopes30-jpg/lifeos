import { useEffect, useState } from "react";
import { getTone, Tone } from "../../shared/tone";
import { analyzeLifeContext, adaptInsight } from "../../shared/insights";

export default function ContextMessage() {
  const [tone, setTone] = useState<Tone>(getTone());
  const [insight, setInsight] = useState<string | null>(null);


  useEffect(() => {
    function onToneChange(e: Event) {
      const detail = (e as CustomEvent).detail as Tone;
      setTone(detail);
    }

    window.addEventListener("toneChange", onToneChange as EventListener);
    return () => window.removeEventListener("toneChange", onToneChange as EventListener);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInsight() {
      try {
        const list = await analyzeLifeContext();
        if (cancelled) return;

        // Prefer warnings, otherwise first info, otherwise null
        const primary = list.find((i) => i.type === "warning") ?? list[0] ?? null;

        if (!primary) {
          setInsight(null);
          return;
        }

        // Use centralized tone adapter to get message
        const adapted = adaptInsight(primary.type, primary.message, tone);
        setInsight(adapted.message);
      } catch (err) {
        // on error, keep insight null (do not disrupt UI)
        setInsight(null);
        setPrimaryInsight(null);
      }
    }

    loadInsight();

    return () => {
      cancelled = true;
    };
  }, [tone]);




  const hour = new Date().getHours();
  let emoji = "☀️";
  let greeting = "Bom dia";

  if (hour >= 18 || hour < 5) {
    emoji = "🌙";
    greeting = "Boa noite";
  } else if (hour >= 12) {
    emoji = "🌤️";
    greeting = "Boa tarde";
  }

  const neutralMap: Record<Tone, string> = {
    calm: "Tudo sob controle por enquanto.",
    balanced: "Tudo sob controle por enquanto.",
    direct: "Tudo sob controle por enquanto.",
  };

  return (
    <div className="context-message">
      <h2>
        {emoji} {greeting}
      </h2>
      <p className="subtitle">{insight ?? neutralMap[tone]}</p>


    </div>
  );
}
