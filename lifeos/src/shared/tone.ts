export type Tone = "calm" | "balanced" | "direct";

const KEY = "lifeos:tone";

export function getTone(): Tone {
  const t = localStorage.getItem(KEY);
  if (t === "calm" || t === "balanced" || t === "direct") return t;
  return "balanced";
}

export function setTone(t: Tone) {
  localStorage.setItem(KEY, t);
  window.dispatchEvent(new CustomEvent("toneChange", { detail: t }));
}
