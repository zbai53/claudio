const spokenCache = new Set<string>();

let enabled = true;
const stored = localStorage.getItem('claudio-tts-enabled');
if (stored === 'false') enabled = false;

export function setTtsEnabled(value: boolean): void {
  enabled = value;
}

function cacheKey(text: string): string {
  return text.slice(0, 50);
}

export function speak(text: string): void {
  if (!enabled) return;

  const key = cacheKey(text);
  if (spokenCache.has(key)) return;
  spokenCache.add(key);

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.lang = 'en-US';

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  window.speechSynthesis.cancel();
}
